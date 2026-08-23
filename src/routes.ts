import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';
import {
    findUserByUsername,
    findUserById,
    createUser,
    getMessagesByChannel,
    pool
} from './db';

const routes = Router();

// Configuração de segurança: garantindo pelo menos 10 salt rounds no bcrypt
const BCRYPT_SALT_ROUNDS = 10;

// Rota de Cadastro de Usuário (POST /register)
routes.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Validação básica de entrada
        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios.' });
        }

        // Verifica se o usuário já existe no PostgreSQL
        const userExists = await findUserByUsername(username);

        if (userExists) {
            return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
        }

        // Criptografa a senha antes de salvar usando pelo menos 10 salt rounds
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        // Salva o usuário no PostgreSQL
        const newUser = await createUser(username, hashedPassword);

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso!',
            user: {
                id: newUser.id,
                username: newUser.username,
                createdAt: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
});

// Rota de Login (POST /login)
routes.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Validação básica de entrada
        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios.' });
        }

        // 1. Busca o usuário no PostgreSQL
        const user = await findUserByUsername(username);

        if (!user) {
            return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
        }

        // 2. Valida a senha usando bcrypt.compare
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
        }

        // 3. Gera o token JWT com o ID e Username do usuário
        const jwtSecret = process.env.JWT_SECRET || 'nexuscomm_super_secret_jwt_key_2026';
        const token = jwt.sign(
            { id: user.id, username: user.username },
            jwtSecret,
            { expiresIn: '1d' }
        );

        // 4. Retorna o token e os dados do usuário
        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        return res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
});

// Rota protegida de perfil do usuário autenticado (GET /me)
routes.get('/me', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);

        if (!userId) {
            return res.status(400).json({ error: 'ID de usuário inválido.' });
        }

        const user = await findUserById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        return res.status(200).json({
            userId,
            user
        });
    } catch (error) {
        console.error('Erro ao buscar dados do usuário autenticado:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Rota para buscar o histórico de mensagens de um canal/sala (GET /messages/:channelId)
routes.get('/messages/:channelId', async (req: Request, res: Response) => {
    try {
        const channelIdParam = req.params.channelId;
        const channelId = Array.isArray(channelIdParam) ? channelIdParam[0] : channelIdParam;
        const limit = Number(req.query.limit) || 50;

        if (!channelId) {
            return res.status(400).json({ error: 'O ID do canal é obrigatório.' });
        }

        const messages = await getMessagesByChannel(channelId, limit);

        return res.status(200).json({
            channelId,
            total: messages.length,
            messages
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de mensagens:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar mensagens.' });
    }
});

// ==========================================
// Rotas de Comunidades (Servers e Canais)
// ==========================================

// Listar Servidores / Comunidades (GET /servers)
routes.get('/servers', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM servers ORDER BY data_criacao DESC');
        return res.status(200).json({ servers: result.rows });
    } catch (error) {
        console.error('Erro ao listar servidores:', error);
        return res.status(500).json({ error: 'Erro ao listar servidores.' });
    }
});

// Criar Servidor / Comunidade (POST /servers)
routes.post('/servers', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const { nome } = req.body;
        const userId = Number(req.userId);

        if (!nome) {
            return res.status(400).json({ error: 'O nome do servidor é obrigatório.' });
        }

        const result = await pool.query(
            'INSERT INTO servers (nome, dono_id) VALUES ($1, $2) RETURNING *',
            [nome, userId || null]
        );

        const newServer = result.rows[0];

        // Cria automaticamente um canal geral de texto e um geral de voz
        await pool.query(
            "INSERT INTO channels (server_id, nome, tipo) VALUES ($1, 'geral', 'texto'), ($1, 'Voz Geral', 'voz')",
            [newServer.id]
        );

        return res.status(201).json({
            message: 'Servidor criado com sucesso!',
            server: newServer
        });
    } catch (error) {
        console.error('Erro ao criar servidor:', error);
        return res.status(500).json({ error: 'Erro ao criar servidor.' });
    }
});

// Listar Canais de um Servidor (GET /servers/:serverId/channels)
routes.get('/servers/:serverId/channels', async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        const result = await pool.query(
            'SELECT * FROM channels WHERE server_id = $1 ORDER BY tipo ASC, nome ASC',
            [serverId]
        );
        return res.status(200).json({ channels: result.rows });
    } catch (error) {
        console.error('Erro ao buscar canais do servidor:', error);
        return res.status(500).json({ error: 'Erro ao buscar canais.' });
    }
});

export { routes };
