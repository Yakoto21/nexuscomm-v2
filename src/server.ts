import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// Gerenciamento de conexões em tempo real e Sinalização WebRTC por Sala via Socket.IO
io.on('connection', (socket) => {
    console.log(`⚡ Usuário conectado: ${socket.id}`);

    // Entrada na Sala (Room)
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`🚪 Usuário ${socket.id} entrou na sala: "${room}"`);
    });

    // 1. Repasse da Oferta WebRTC (offer) para a sala específica
    socket.on('offer', (data) => {
        console.log(`📡 Repassando offer de ${socket.id} para a sala: "${data.room}"`);
        socket.to(data.room).emit('offer', data.offer || data);
    });

    // 2. Repasse da Resposta WebRTC (answer) para a sala específica
    socket.on('answer', (data) => {
        console.log(`📡 Repassando answer de ${socket.id} para a sala: "${data.room}"`);
        socket.to(data.room).emit('answer', data.answer || data);
    });

    // 3. Repasse dos Candidatos ICE (ice-candidate) para a sala específica
    socket.on('ice-candidate', (data) => {
        console.log(`❄️ Repassando ice-candidate de ${socket.id} para a sala: "${data.room}"`);
        socket.to(data.room).emit('ice-candidate', data.candidate || data);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuário desconectado: ${socket.id}`);
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


