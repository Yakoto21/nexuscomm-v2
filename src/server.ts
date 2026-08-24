import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { routes } from './routes';
import { initDb, saveMessage, getMessagesByChannel, findUserById, saveDirectMessage } from './db';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Configurações de Segurança e Tráfego
app.use(cors()); // Permite que o nosso frontend converse com este backend
app.use(express.json({ limit: '15mb' })); // Suporta upload de imagens em base64 até 15MB
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Rotas da aplicação
app.use(routes);

// Servir arquivos estáticos da pasta public (para renderizar index.html)
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../../public')));

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
        // 2. Valida o token JWT usando a chave secreta
        const jwtSecret = process.env.JWT_SECRET || 'nexuscomm_super_secret_jwt_key_2026';
        const decoded = jwt.verify(token, jwtSecret) as any;

        let username = decoded.username;
        const rawUserId = decoded.id ?? decoded.sub;
        const userId = (rawUserId !== undefined && rawUserId !== null && !isNaN(Number(rawUserId))) ? Number(rawUserId) : null;

        // Se o token JWT não tiver o username embutido, busca no PostgreSQL pelo ID
        if (!username && userId) {
            try {
                const dbUser = await findUserById(userId);
                if (dbUser && dbUser.username) {
                    username = dbUser.username;
                }
            } catch (dbErr) {
                console.warn(`Aviso ao buscar usuário [${userId}] no DB:`, dbErr);
            }
        }

        // Se ainda não tiver username, verifica se o cliente enviou no handshake auth
        if (!username && socket.handshake.auth?.username) {
            username = String(socket.handshake.auth.username).trim();
        }

        // Se ainda não tiver, gera identificador
        if (!username) {
            username = `User-${socket.id.substring(0, 5)}`;
        }

        // 3. Anexa os dados do usuário autenticado no socket
        socket.data.user = {
            id: userId,
            username: username
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
    const userPayload = socket.data.user as { id: number | null, username: string };
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
    socket.on('join-room', async (room) => {
        const roomName = String(room || 'sala-publica').trim();
        socket.join(roomName);
        console.log(`🚪 Usuário ${socket.id} (${username}) entrou na sala: "${roomName}"`);

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
        const roomName = String(room).trim();
        socket.leave(roomName);
        console.log(`🚪 Usuário ${socket.id} (${username}) saiu da sala: "${roomName}"`);
        socket.to(roomName).emit('user-left', { id: socket.id, username: username, room: roomName });
    });

    // 1. Repasse da Oferta WebRTC (offer) direcionada para um peer específico ou para a sala
    socket.on('offer', (data) => {
        const payload = {
            offer: data.offer || data,
            sender: socket.id,
            username: username,
            room: data.room
        };

        if (data.target) {
            console.log(`📡 Repassando offer de ${socket.id} -> ${data.target}`);
            io.to(data.target).emit('offer', payload);
        } else if (data.room) {
            console.log(`📡 Repassando offer de ${socket.id} para a sala: "${data.room}"`);
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
        if (data.room) {
            socket.to(data.room).emit('user-media-state-changed', {
                sender: socket.id,
                isMicMuted: data.isMicMuted,
                isCameraOff: data.isCameraOff,
                activeVideoType: data.activeVideoType
            });
        }
    });

    // Handler de Mensagens do Chat com Persistência no PostgreSQL e Anexos de Mídia (Sprint 4)
    socket.on('chat-message', async (data) => {
        if (!data || !data.room) return;

        const roomName = String(data.room).trim();
        const messageText = String(data.text || data.message || '').trim();
        const mediaUrl = data.media_url || data.mediaUrl || null;
        // Extrai o username real autenticado do socket
        const senderUsername = socket.data.user?.username || username || String(data.sender || 'Anônimo').trim();

        if (!roomName || (!messageText && !mediaUrl)) return;

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
            socket.to(roomName).emit('chat-message', {
                id: savedMsg.id,
                text: savedMsg.text,
                media_url: savedMsg.media_url,
                sender: savedMsg.sender,
                senderId: socket.id,
                timestamp: savedMsg.timestamp
            });
        } catch (err) {
            console.error('Erro ao persistir mensagem no banco de dados:', err);
            // Em caso de falha transitória no banco, realiza o broadcast
            socket.to(roomName).emit('chat-message', {
                id: `fallback-${Date.now()}`,
                text: messageText,
                media_url: mediaUrl,
                sender: senderUsername,
                senderId: socket.id,
                timestamp: data.timestamp || Date.now()
            });
        }
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
            socket.emit('receive-dm', savedMsg);
            socket.emit('direct-message-received', savedMsg);
            // Emite para o destinatário na sua sala pessoal isolada
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
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuário desconectado: ${socket.id} (${username})`);
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
