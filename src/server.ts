import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { routes } from './routes';

// Carrega as nossas variáveis secretas (como senhas e portas)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Cria o servidor HTTP integrando com o Express
const httpServer = http.createServer(app);

// Inicializa o Server do Socket.IO com CORS configurado
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware de Autenticação do Socket.IO (io.use) para interceptar conexões iniciais
io.use((socket, next) => {
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
        const decoded = jwt.verify(token, jwtSecret);

        // 3. Anexa os dados do usuário autenticado no socket
        socket.data.user = decoded;
        console.log(`🔑 Socket [${socket.id}] autenticado com sucesso para o usuário:`, (decoded as any).id || (decoded as any).username || 'ID autenticado');
        return next();
    } catch (err: any) {
        console.warn(`🔒 Conexão bloqueada no Socket [${socket.id}]: Token inválido ou expirado. Detalhes:`, err.message);
        return next(new Error('Authentication error: Token inválido ou expirado.'));
    }
});

// Gerenciamento de conexões em tempo real e Sinalização WebRTC Multi-Participante via Socket.IO
io.on('connection', (socket) => {
    const userPayload = socket.data.user as any;
    const username = userPayload?.username || `User-${socket.id.substring(0, 5)}`;
    console.log(`⚡ Usuário conectado: ${socket.id} (${username})`);

    // Entrada na Sala (Room)
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`🚪 Usuário ${socket.id} (${username}) entrou na sala: "${room}"`);

        // Obtém todos os outros sockets já presentes nesta sala
        const roomSockets = io.sockets.adapter.rooms.get(room);
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
            room: room
        });

        // 2. Notifica todos os participantes existentes sobre a chegada do novo usuário
        socket.to(room).emit('user-joined', {
            id: socket.id,
            username: username
        });
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

    // Notifica quando o usuário estiver desconectando das salas
    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                socket.to(room).emit('user-left', { id: socket.id, username: username });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuário desconectado: ${socket.id} (${username})`);
    });
});

// Servir arquivos estáticos da pasta public (para renderizar index.html)
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../../public')));

// Configurações de Segurança e Tráfego
app.use(cors()); // Permite que o nosso frontend converse com este backend
app.use(express.json()); // Prepara o servidor para receber dados em formato JSON

// Rotas da aplicação
app.use(routes);

// Rota de teste/status da API
app.get('/api/status', (req, res) => {
    res.json({ status: 'Online', message: 'Servidor NexusComm V2 blindado e operante!' });
});

// Ligando os motores usando httpServer.listen para suportar HTTP e WebSockets
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});

export { io, httpServer, app };


