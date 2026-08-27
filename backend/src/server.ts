import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { routes } from './routes';
import { initDb, saveMessage, getMessagesByChannel, findUserById, saveDirectMessage, canUserAccessChannel, getMessageById, updateMessage, deleteMessage, canUserModerateMessage, sanitizePlainText } from './db';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Configurações de Segurança e Tráfego
app.use(cors()); // Permite que o nosso frontend converse com este backend
app.use(express.json({ limit: '15mb' })); // Suporta upload de imagens em base64 até 15MB
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Rotas da API da aplicação
app.use(routes);

// 1. Resolução dinâmica absoluta para pastas de arquivos estáticos usando path.join()
const backendPublicDir = path.join(__dirname, '../public');
const rootPublicDir = path.join(__dirname, '../../public');

// Servir arquivos estáticos (CSS minificado, JS bundle ofuscado, assets)
app.use(express.static(backendPublicDir));
app.use(express.static(rootPublicDir));

// 2. Rota raiz (/) servindo index.html com resolução absoluta via path.join()
app.get('/', (_req, res) => {
    const backendIndexPath = path.join(backendPublicDir, 'index.html');
    const rootIndexPath = path.join(rootPublicDir, 'index.html');

    if (fs.existsSync(backendIndexPath)) {
        return res.sendFile(backendIndexPath);
    }
    if (fs.existsSync(rootIndexPath)) {
        return res.sendFile(rootIndexPath);
    }
    return res.status(404).send('index.html não encontrado.');
});

// 3. Fallback genérico para SPA (compatível com Express 5 / path-to-regexp)
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.includes('.')) {
        return next();
    }
    const backendIndexPath = path.join(backendPublicDir, 'index.html');
    const rootIndexPath = path.join(rootPublicDir, 'index.html');

    if (fs.existsSync(backendIndexPath)) {
        return res.sendFile(backendIndexPath);
    }
    if (fs.existsSync(rootIndexPath)) {
        return res.sendFile(rootIndexPath);
    }
    return next();
});

// Rota de teste/status da API
app.get('/api/status', (_req, res) => {
    res.json({ status: 'Online', message: 'Servidor NexusComm V2 blindado e operante com PostgreSQL!' });
});

// Cria o servidor HTTP integrando com o Express
const httpServer = http.createServer(app);

// Inicializa o Server do Socket.IO com CORS configurado
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Mapa de rastreamento de presença online (socket.id -> userId)
const onlineUsersMap = new Map<string, number>();

// ==========================================
// Sprint: Presença Visual nos Canais de Voz (Voice Channels Presence)
// ==========================================
interface VoiceParticipant {
    id: number | null;
    socketId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    channelId: string | number;
    channelName: string;
    room: string;
    serverId: number | null;
    isMuted: boolean;
    isDeafened: boolean;
}

// Mapa de Presença em Canais de Voz: roomName -> Map<socketId, VoiceParticipant>
const voiceRoomsPresenceMap = new Map<string, Map<string, VoiceParticipant>>();

function broadcastVoiceChannelPresence(roomName: string) {
    const participantsMap = voiceRoomsPresenceMap.get(roomName);
    const participantsList = participantsMap ? Array.from(participantsMap.values()) : [];

    const firstP = participantsList[0];
    let channelId = firstP?.channelId;
    let channelName = firstP?.channelName;
    let serverId = firstP?.serverId;

    if (!channelName && roomName.includes('-voz-')) {
        const parts = roomName.split('-voz-');
        channelName = parts[1] || '';
        const serverParts = parts[0].split('comunidade-');
        serverId = serverParts[1] ? parseInt(serverParts[1], 10) : null;
    }

    const payload = {
        room: roomName,
        channelId: channelId || roomName,
        channelName: channelName || '',
        serverId: serverId || null,
        participants: participantsList.map(p => ({
            id: p.id,
            socketId: p.socketId,
            username: p.username,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
            isMuted: Boolean(p.isMuted),
            isDeafened: Boolean(p.isDeafened)
        }))
    };

    io.emit('voice-channel-presence-update', payload);
}

// Middleware de Autenticação do Socket.IO (io.use) para interceptar conexões iniciais
io.use(async (socket, next) => {
    // 1. Extrai o token enviado pelo cliente via socket.handshake.auth.token ou headers
    const rawToken = socket.handshake.auth?.token || 
                     socket.handshake.headers?.authorization;

    if (!rawToken) {
        console.warn(`🔒 Conexão bloqueada no Socket [${socket.id}]: Token não fornecido.`);
        return next(new Error('Authentication error: Token não fornecido.'));
    }

    // Suporta tokens prefixados com "Bearer " ou enviados diretamente
    const token = typeof rawToken === 'string' && rawToken.startsWith('Bearer ') 
        ? rawToken.slice(7).trim() 
        : rawToken;

    if (!token) {
        console.warn(`🔒 Conexão bloqueada no Socket [${socket.id}]: Token mal formatado.`);
        return next(new Error('Authentication error: Token mal formatado.'));
    }

    try {
        // 2. Valida o token JWT usando a chave secreta estrita das variáveis de ambiente
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não configurado nas variáveis de ambiente.');
            return next(new Error('Authentication error: Configuração de servidor inválida.'));
        }

        const decoded = jwt.verify(token, jwtSecret) as any;

        let username = decoded.username;
        const rawUserId = decoded.id ?? decoded.sub;
        const userId = (rawUserId !== undefined && rawUserId !== null && !isNaN(Number(rawUserId))) ? Number(rawUserId) : null;

        let displayName = username;
        let avatarUrl: string | null = null;

        // Se tiver userId, busca dados do usuário no PostgreSQL para displayName e avatar
        if (userId) {
            try {
                const dbUser = await findUserById(userId);
                if (dbUser) {
                    if (dbUser.username) username = dbUser.username;
                    displayName = dbUser.display_name || username;
                    avatarUrl = dbUser.avatar_url || null;
                }
            } catch (dbErr) {
                console.warn(`Aviso ao buscar usuário [${userId}] no DB:`, dbErr);
            }
        }

        // Se ainda não tiver username, verifica se o cliente enviou no handshake auth
        if (!username && socket.handshake.auth?.username) {
            username = String(socket.handshake.auth.username).trim();
            if (!displayName) displayName = username;
        }

        // Se ainda não tiver, gera identificador
        if (!username) {
            username = `User-${socket.id.substring(0, 5)}`;
            displayName = username;
        }

        // 3. Anexa os dados do usuário autenticado no socket
        socket.data.user = {
            id: userId,
            username: username,
            displayName: displayName,
            avatarUrl: avatarUrl
        };

        console.log(`🔑 Socket [${socket.id}] autenticado com sucesso para o usuário: ${username} (ID: ${userId})`);
        return next();
    } catch (err: any) {
        console.warn(`🔒 Conexão bloqueada no Socket [${socket.id}]: Token inválido ou expirado. Detalhes:`, err.message);
        return next(new Error('Authentication error: Token inválido ou expirado.'));
    }
});

// Gerenciamento de conexões em tempo real, Sinalização WebRTC e Chat Persistido
io.on('connection', (socket) => {
    const userPayload = socket.data.user as { id: number | null, username: string, displayName?: string, avatarUrl?: string | null };
    const username = userPayload?.username || `User-${socket.id.substring(0, 5)}`;
    const userId = userPayload?.id || null;
    console.log(`⚡ Usuário conectado: ${socket.id} (${username}) | UserID: ${userId}`);

    // Emite os dados autenticados confirmados de volta ao cliente
    socket.emit('authenticated', {
        id: socket.id,
        username: username,
        userId: userId
    });

    // Entrada na Sala (Room)
    socket.on('join-room', async (data) => {
        const roomName = typeof data === 'object' && data !== null
            ? String(data.room || data.name || '').trim()
            : String(data || 'sala-publica').trim();
        if (!roomName) return;

        const isVoiceRoom = Boolean(
            (typeof data === 'object' && (data.isVoice || data.tipo === 'voz')) ||
            roomName.includes('-voz-')
        );
        const channelId = typeof data === 'object' ? (data.channelId || data.id || null) : null;
        const channelName = typeof data === 'object' ? (data.channelName || data.nome || null) : null;
        const serverId = typeof data === 'object' ? (data.serverId || null) : null;
        const clientAvatar = typeof data === 'object' ? (data.avatarUrl || data.avatar_url || null) : null;
        const clientDisplayName = typeof data === 'object' ? (data.displayName || data.display_name || null) : null;

        // 🔒 SEC-04: Validação de autorização no banco antes de permitir entrada na sala
        const hasAccess = await canUserAccessChannel(userId, roomName);
        if (!hasAccess) {
            console.warn(`⛔ [Bloqueio de Acesso] Usuário [${userId} - ${username}] tentou entrar na sala não autorizada: "${roomName}"`);
            socket.emit('room-error', { error: 'Você não tem permissão para acessar esta sala ou canal.' });
            return;
        }

        socket.join(roomName);
        console.log(`🚪 Usuário ${socket.id} (${username}) entrou na sala: "${roomName}"`);

        // Se for canal de voz, registra presença no mapa e emite atualização global
        if (isVoiceRoom) {
            // Remove o usuário de qualquer outra sala de voz em que estivesse previamente
            for (const [vRoom, pMap] of voiceRoomsPresenceMap.entries()) {
                if (vRoom !== roomName && pMap.has(socket.id)) {
                    pMap.delete(socket.id);
                    broadcastVoiceChannelPresence(vRoom);
                }
            }

            if (!voiceRoomsPresenceMap.has(roomName)) {
                voiceRoomsPresenceMap.set(roomName, new Map());
            }

            const pMap = voiceRoomsPresenceMap.get(roomName)!;
            const pDisplayName = clientDisplayName || userPayload?.displayName || username;
            const pAvatar = clientAvatar || userPayload?.avatarUrl || null;

            pMap.set(socket.id, {
                id: userId,
                socketId: socket.id,
                username: username,
                displayName: pDisplayName,
                avatarUrl: pAvatar,
                channelId: channelId || roomName,
                channelName: channelName || (roomName.includes('-voz-') ? roomName.split('-voz-')[1] : roomName),
                room: roomName,
                serverId: serverId,
                isMuted: false,
                isDeafened: false
            });

            broadcastVoiceChannelPresence(roomName);
        }

        // Obtém todos os outros sockets já presentes nesta sala
        const roomSockets = io.sockets.adapter.rooms.get(roomName);
        const otherUsersInRoom: string[] = [];
        if (roomSockets) {
            for (const socketId of roomSockets) {
                if (socketId !== socket.id) {
                    otherUsersInRoom.push(socketId);
                }
            }
        }

        // 1. Envia ao usuário que entrou a lista de participantes já existentes na sala
        socket.emit('room-users', {
            users: otherUsersInRoom,
            selfId: socket.id,
            room: roomName
        });

        // 2. Carrega o histórico de mensagens salvas no PostgreSQL para o canal/sala
        try {
            const history = await getMessagesByChannel(roomName, 50);
            socket.emit('room-history', {
                room: roomName,
                messages: history
            });
        } catch (err) {
            console.warn(`Erro ao carregar histórico da sala [${roomName}]:`, err);
        }

        // 3. Notifica todos os participantes existentes sobre a chegada do novo usuário
        socket.to(roomName).emit('user-joined', {
            id: socket.id,
            username: username
        });
    });

    // Saída Graciosa da Sala (Room Teardown)
    socket.on('leave-room', (room) => {
        if (!room) return;
        const roomName = typeof room === 'object' && room !== null ? String(room.room || room.name || '').trim() : String(room).trim();
        socket.leave(roomName);
        console.log(`🚪 Usuário ${socket.id} (${username}) saiu da sala: "${roomName}"`);
        socket.to(roomName).emit('user-left', { id: socket.id, username: username, room: roomName });

        if (voiceRoomsPresenceMap.has(roomName)) {
            const pMap = voiceRoomsPresenceMap.get(roomName)!;
            if (pMap.delete(socket.id)) {
                broadcastVoiceChannelPresence(roomName);
            }
        }
    });

    // 1. Repasse da Oferta WebRTC (offer) direcionada para um peer específico ou para a sala
    socket.on('offer', (data) => {
        const payload = {
            offer: data.offer || data,
            sender: socket.id,
            username: username,
            room: data.room,
            isRenegotiation: Boolean(data.isRenegotiation),
            isIceRestart: Boolean(data.isIceRestart)
        };

        if (data.target) {
            console.log(`📡 Repassando offer (${payload.isRenegotiation ? 'Renegociação' : 'Inicial'}) de ${socket.id} -> ${data.target}`);
            io.to(data.target).emit('offer', payload);
        } else if (data.room) {
            console.log(`📡 Repassando offer (${payload.isRenegotiation ? 'Renegociação' : 'Inicial'}) de ${socket.id} para a sala: "${data.room}"`);
            socket.to(data.room).emit('offer', payload);
        }
    });

    // 2. Repasse da Resposta WebRTC (answer) direcionada para o peer que fez a oferta
    socket.on('answer', (data) => {
        const payload = {
            answer: data.answer || data,
            sender: socket.id,
            room: data.room
        };

        if (data.target) {
            console.log(`📡 Repassando answer de ${socket.id} -> ${data.target}`);
            io.to(data.target).emit('answer', payload);
        } else if (data.room) {
            console.log(`📡 Repassando answer de ${socket.id} para a sala: "${data.room}"`);
            socket.to(data.room).emit('answer', payload);
        }
    });

    // 3. Repasse dos Candidatos ICE (ice-candidate) direcionado ao peer correspondente
    socket.on('ice-candidate', (data) => {
        const payload = {
            candidate: data.candidate,
            sender: socket.id,
            room: data.room
        };

        if (data.target) {
            io.to(data.target).emit('ice-candidate', payload);
        } else if (data.room) {
            socket.to(data.room).emit('ice-candidate', payload);
        }
    });

    // 4. Sincronização do estado de mídia (Microfone Mutado / Câmera Desligada)
    socket.on('media-state-change', (data) => {
        if (data && data.room) {
            socket.to(data.room).emit('user-media-state-changed', {
                sender: socket.id,
                isMicMuted: data.isMicMuted,
                isDeafened: data.isDeafened,
                isCameraOff: data.isCameraOff,
                activeVideoType: data.activeVideoType
            });

            // Atualiza presença visual no canal de voz
            if (voiceRoomsPresenceMap.has(data.room)) {
                const pMap = voiceRoomsPresenceMap.get(data.room)!;
                const participant = pMap.get(socket.id);
                if (participant) {
                    participant.isMuted = Boolean(data.isMicMuted);
                    if (data.isDeafened !== undefined) {
                        participant.isDeafened = Boolean(data.isDeafened);
                    }
                    broadcastVoiceChannelPresence(data.room);
                }
            }
        }
    });

    // Handler de Mensagens do Chat com Persistência no PostgreSQL e Anexos de Mídia (Sprint 4)
    socket.on('chat-message', async (data) => {
        if (!data || !data.room) return;

        const roomName = String(data.room).trim();
        // 🔒 SEC-05: Sanitização rigorosa Anti-XSS e truncamento para limite seguro
        const rawText = String(data.text || data.message || '');
        const messageText = rawText.replace(/<[^>]*>?/gm, '').trim().substring(0, 2000);
        const mediaUrl = data.media_url || data.mediaUrl || null;
        // Extrai o username real autenticado do socket
        const senderUsername = socket.data.user?.username || username || 'Usuário';

        if (!roomName || (!messageText && !mediaUrl)) return;

        // 🔒 SEC-04: Validação de autorização antes de salvar ou transmitir mensagem
        const hasAccess = await canUserAccessChannel(userId, roomName);
        if (!hasAccess) {
            console.warn(`⛔ [Chat Bloqueado] Usuário [${userId}] tentou enviar mensagem para sala não autorizada: "${roomName}"`);
            socket.emit('room-error', { error: 'Você não tem permissão para enviar mensagens nesta sala.' });
            return;
        }

        try {
            // Salva a mensagem no banco de dados PostgreSQL antes do broadcast
            const savedMsg = await saveMessage(
                roomName,
                userId,
                senderUsername,
                messageText,
                mediaUrl
            );

            console.log(`💬 [${roomName}] ${senderUsername}: ${messageText} ${mediaUrl ? `[Mídia: ${mediaUrl}]` : ''} (ID: ${savedMsg.id})`);

            // Envia a mensagem persistida com o nome real do remetente para todos os outros participantes da sala
            const payload = {
                id: savedMsg.id,
                channel_id: savedMsg.channel_id,
                text: savedMsg.text,
                media_url: savedMsg.media_url,
                sender: savedMsg.sender,
                senderId: socket.id,
                is_edited: false,
                timestamp: savedMsg.timestamp
            };

            // Confirma o ID oficial do banco para o remetente
            socket.emit('chat-message-sent', {
                tempId: data.tempId,
                id: savedMsg.id,
                channel_id: savedMsg.channel_id,
                timestamp: savedMsg.timestamp
            });

            socket.to(roomName).emit('chat-message', payload);
        } catch (err) {
            console.error('Erro ao persistir mensagem no banco de dados:', err);
            // Em caso de falha transitória no banco, realiza o broadcast
            socket.to(roomName).emit('chat-message', {
                id: `fallback-${Date.now()}`,
                channel_id: roomName,
                text: messageText,
                media_url: mediaUrl,
                sender: senderUsername,
                senderId: socket.id,
                is_edited: false,
                timestamp: data.timestamp || Date.now()
            });
        }
    });

    // ✏️ Sprint 7: Edição de Mensagem em Tempo Real via Socket.IO
    socket.on('edit-message', async (data: { id: number | string; text: string; room?: string }) => {
        if (!userId || !data || !data.id || !data.text) return;
        const cleanText = sanitizePlainText(String(data.text || '')).substring(0, 2000);
        if (!cleanText) return;

        try {
            const existingMsg = await getMessageById(data.id);
            if (!existingMsg || existingMsg.user_id !== userId) {
                return;
            }

            const updated = await updateMessage(data.id, userId, cleanText);
            if (updated) {
                const targetRoom = updated.channel_id || data.room;
                if (targetRoom) {
                    io.to(targetRoom).emit('message-updated', updated);
                }
                socket.emit('message-updated', updated);
            }
        } catch (err) {
            console.error('Erro ao processar socket edit-message:', err);
        }
    });

    // 🗑️ Sprint 7: Exclusão de Mensagem em Tempo Real via Socket.IO
    socket.on('delete-message', async (data: { id: number | string; room?: string }) => {
        if (!userId || !data || !data.id) return;

        try {
            const existingMsg = await getMessageById(data.id);
            if (!existingMsg) return;

            const canDelete = await canUserModerateMessage(userId, data.id);
            if (!canDelete) return;

            await deleteMessage(data.id);
            const targetRoom = existingMsg.channel_id || data.room;
            if (targetRoom) {
                io.to(targetRoom).emit('message-deleted', {
                    id: Number(data.id),
                    channel_id: existingMsg.channel_id
                });
            }
            socket.emit('message-deleted', {
                id: Number(data.id),
                channel_id: existingMsg.channel_id
            });
        } catch (err) {
            console.error('Erro ao processar socket delete-message:', err);
        }
    });

    // ✍️ Indicador de Digitação em Tempo Real (Typing Indicator)
    socket.on('typing', (data: { room?: string; channel_id?: string; isTyping?: boolean }) => {
        const targetRoom = String(data?.room || data?.channel_id || '').trim();
        if (!targetRoom) return;

        const isTyping = data.isTyping !== false;
        const senderDisplayName = (socket.data.user as any)?.display_name || (socket.data.user as any)?.username || username || 'Usuário';

        socket.to(targetRoom).emit('user-typing', {
            userId: userId,
            username: username,
            displayName: senderDisplayName,
            room: targetRoom,
            isTyping: isTyping
        });
    });

    // Adiciona o socket à sala pessoal do usuário para notificações diretas (DMs, amizades)
    if (userId) {
        socket.join(`user_${userId}`);
        onlineUsersMap.set(socket.id, userId);
        
        // Notifica presença online para todos
        io.emit('user-presence', {
            userId: userId,
            status: 'online'
        });
    }

    // Retorna a lista atual de IDs de usuários online
    socket.on('get-online-users', (callback) => {
        const uniqueOnlineUserIds = Array.from(new Set(Array.from(onlineUsersMap.values())));
        if (typeof callback === 'function') {
            callback(uniqueOnlineUserIds);
        } else {
            socket.emit('online-users-list', uniqueOnlineUserIds);
        }
    });

    // Handler universal de envio de DM (send-dm e send-direct-message)
    const handleSendDm = async (data: any) => {
        const receiverId = Number(data.receiverId || data.targetUserId);
        const content = String(data.content || data.text || '').trim();
        const mediaUrl = data.media_url || data.mediaUrl || null;
        if (!userId || !receiverId || (!content && !mediaUrl)) return;

        try {
            const savedMsg = await saveDirectMessage(userId, receiverId, content, mediaUrl);
            // Envia confirmação de volta para o remetente
            socket.emit('dm-message', savedMsg);
            socket.emit('receive-dm', savedMsg);
            socket.emit('direct-message-received', savedMsg);
            // Emite para o destinatário na sua sala pessoal isolada
            io.to(`user_${receiverId}`).emit('dm-message', savedMsg);
            io.to(`user_${receiverId}`).emit('receive-dm', savedMsg);
            io.to(`user_${receiverId}`).emit('direct-message-received', savedMsg);
            console.log(`✉️ [DM] ${username} -> User ${receiverId}: ${content.substring(0, 30)} ${mediaUrl ? '[Mídia anexada]' : ''}`);
        } catch (dmErr) {
            console.error('Erro ao processar DM via socket:', dmErr);
        }
    };

    socket.on('send-dm', handleSendDm);
    socket.on('send-direct-message', handleSendDm);

    // Sinalização de Chamadas Privadas P2P (WebRTC DM Calls)
    socket.on('dm-call-invite', async (data) => {
        const targetUserId = Number(data?.targetUserId);
        if (!userId || !targetUserId) return;

        const callerInfo = await findUserById(userId);
        console.log(`📞 [DM Call Invite] ${username} ligando para User ${targetUserId} (Vídeo: ${!!data.isVideo})`);

        io.to(`user_${targetUserId}`).emit('dm-incoming-call', {
            callerId: userId,
            callerSocketId: socket.id,
            callerUsername: callerInfo?.username || username,
            callerDisplayName: callerInfo?.display_name || callerInfo?.username || username,
            callerAvatarUrl: callerInfo?.avatar_url || null,
            isVideo: !!data.isVideo,
            callRoom: data.callRoom || `dm_call_${Math.min(userId, targetUserId)}_${Math.max(userId, targetUserId)}`
        });
    });

    socket.on('dm-call-response', (data) => {
        const targetUserId = Number(data?.targetUserId);
        if (!userId || !targetUserId) return;

        console.log(`📞 [DM Call Response] User ${userId} respondeu chamada de User ${targetUserId}: Aceito = ${!!data.accepted}`);
        io.to(`user_${targetUserId}`).emit('dm-call-response', {
            responderId: userId,
            responderSocketId: socket.id,
            responderUsername: username,
            accepted: !!data.accepted,
            callRoom: data.callRoom
        });
    });

    socket.on('dm-call-end', (data) => {
        const targetUserId = Number(data?.targetUserId);
        if (!userId || !targetUserId) return;

        console.log(`📴 [DM Call Ended] User ${userId} encerrou a chamada com User ${targetUserId}`);
        io.to(`user_${targetUserId}`).emit('dm-call-ended', {
            endedByUserId: userId,
            callRoom: data.callRoom
        });
    });

    // Eventos para sinalização instantânea de pedidos de amizade
    socket.on('friend-request-sent', (data) => {
        if (data?.targetUserId) {
            io.to(`user_${data.targetUserId}`).emit('friend-request-received', {
                senderId: userId,
                senderUsername: username,
                ...data
            });
        }
    });

    socket.on('friend-request-status-changed', (data) => {
        if (data?.otherUserId) {
            io.to(`user_${data.otherUserId}`).emit('friend-request-updated', {
                userId: userId,
                username: username,
                ...data
            });
        }
    });

    // Notifica quando o usuário estiver desconectando das salas
    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (room !== socket.id && !room.startsWith('user_')) {
                socket.to(room).emit('user-left', { id: socket.id, username: username });
            }
        }
        for (const [vRoom, pMap] of voiceRoomsPresenceMap.entries()) {
            if (pMap.delete(socket.id)) {
                broadcastVoiceChannelPresence(vRoom);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuário desconectado: ${socket.id} (${username})`);
        for (const [vRoom, pMap] of voiceRoomsPresenceMap.entries()) {
            if (pMap.delete(socket.id)) {
                broadcastVoiceChannelPresence(vRoom);
            }
        }
        if (userId) {
            onlineUsersMap.delete(socket.id);
            // Verifica se o usuário ainda possui outros sockets ativos
            const remainingUserSockets = Array.from(onlineUsersMap.values()).filter(id => id === userId);
            if (remainingUserSockets.length === 0) {
                io.emit('user-presence', {
                    userId: userId,
                    status: 'offline'
                });
            }
        }
    });

    // Fornece a presença atual de todos os canais de voz para sincronização inicial
    socket.on('get-voice-channel-presence', (_data, callback) => {
        const allPresence: any[] = [];
        for (const [vRoom, pMap] of voiceRoomsPresenceMap.entries()) {
            if (pMap.size > 0) {
                const participantsList = Array.from(pMap.values());
                const firstP = participantsList[0];
                allPresence.push({
                    room: vRoom,
                    channelId: firstP?.channelId || vRoom,
                    channelName: firstP?.channelName || '',
                    serverId: firstP?.serverId || null,
                    participants: participantsList.map(p => ({
                        id: p.id,
                        socketId: p.socketId,
                        username: p.username,
                        displayName: p.displayName,
                        avatarUrl: p.avatarUrl,
                        isMuted: Boolean(p.isMuted),
                        isDeafened: Boolean(p.isDeafened)
                    }))
                });
            }
        }
        if (typeof callback === 'function') {
            callback(allPresence);
        } else {
            socket.emit('voice-channel-presence-sync', allPresence);
        }
    });
});

// Inicialização do Banco de Dados PostgreSQL e Servidor HTTP/Socket.IO
initDb().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Servidor NexusComm V2 rodando na porta http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Falha crítica na inicialização do banco:', err);
    httpServer.listen(PORT, () => {
        console.log(`🚀 Servidor NexusComm V2 rodando em modo de contingência na porta http://localhost:${PORT}`);
    });
});

export { io, httpServer, app };
