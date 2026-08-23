import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';
import { uploadServerMediaFile } from './supabaseStorage';
import {
    findUserByUsername,
    findUserById,
    createUser,
    getMessagesByChannel,
    createDefaultServerRoles,
    createServerRole,
    getServerRoles,
    addMemberToServer,
    assignRoleToMember,
    removeRoleFromMember,
    getMemberRoles,
    getServerMembers,
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

        if (username.length < 3) {
            return res.status(400).json({ error: 'O nome de usuário deve ter pelo menos 3 caracteres.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        // 1. Verifica se o usuário já existe
        const userExists = await findUserByUsername(username);
        if (userExists) {
            return res.status(400).json({ error: 'Nome de usuário já cadastrado.' });
        }

        // 2. Gera o hash da senha utilizando bcrypt com pelo menos 10 salt rounds
        const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        // 3. Salva o usuário no banco de dados PostgreSQL
        const newUser = await createUser(username, passwordHash);

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso!',
            user: {
                id: newUser.id,
                username: newUser.username,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
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

        // 1. Busca o usuário pelo username
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
            user: {
                id: user.id,
                username: user.username,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar perfil.' });
    }
});

// ==========================================
// Rotas de Mensagens Persistidas
// ==========================================

// Buscar histórico de mensagens de um canal ou sala WebRTC (GET /messages/:channelId)
routes.get('/messages/:channelId', async (req: Request, res: Response) => {
    try {
        const channelIdParam = req.params.channelId;
        const channelId = Array.isArray(channelIdParam) ? channelIdParam[0] : channelIdParam;
        const limitParam = req.query.limit ? Number(req.query.limit) : 50;

        if (!channelId) {
            return res.status(400).json({ error: 'ID do canal é obrigatório.' });
        }

        const messages = await getMessagesByChannel(channelId, limitParam);

        return res.status(200).json({
            channelId,
            total: messages.length,
            messages
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de mensagens:', error);
        return res.status(500).json({ error: 'Erro ao buscar histórico de mensagens.' });
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
            [nome.trim(), userId || null]
        );

        const newServer = result.rows[0];

        // Cria automaticamente um canal geral de texto e um geral de voz
        await pool.query(
            "INSERT INTO channels (server_id, nome, tipo) VALUES ($1, 'geral', 'texto'), ($1, 'Voz Geral', 'voz')",
            [newServer.id]
        );

        // Cria automaticamente os cargos dinâmicos padrão: @everyone e Admin
        await createDefaultServerRoles(newServer.id, userId || null);

        return res.status(201).json({
            message: 'Servidor criado com sucesso!',
            server: newServer
        });
    } catch (error) {
        console.error('Erro ao criar servidor:', error);
        return res.status(500).json({ error: 'Erro ao criar servidor.' });
    }
});

// Atualizar Servidor / Comunidade (PATCH /servers/:serverId)
routes.patch('/servers/:serverId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const serverId = Number(req.params.serverId);
        const { nome, icon, icon_url, banner, banner_url } = req.body;

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        // 1. Busca o servidor atual
        const currentServerRes = await pool.query('SELECT * FROM servers WHERE id = $1', [serverId]);
        if (currentServerRes.rows.length === 0) {
            return res.status(404).json({ error: 'Servidor não encontrado.' });
        }
        const currentServer = currentServerRes.rows[0];

        // 2. Define o novo nome se fornecido
        const updatedNome = (nome && nome.trim()) ? nome.trim() : currentServer.nome;

        // 3. Processa upload de Ícone se enviado (Base64 ou nova URL)
        let finalIconUrl = currentServer.icon_url;
        if (icon && typeof icon === 'string') {
            finalIconUrl = await uploadServerMediaFile(serverId, 'icon', icon);
        } else if (icon_url !== undefined) {
            finalIconUrl = icon_url;
        }

        // 4. Processa upload de Banner se enviado (Base64 ou nova URL)
        let finalBannerUrl = currentServer.banner_url;
        if (banner && typeof banner === 'string') {
            finalBannerUrl = await uploadServerMediaFile(serverId, 'banner', banner);
        } else if (banner_url !== undefined) {
            finalBannerUrl = banner_url;
        }

        // 5. Atualiza o registro no PostgreSQL
        const result = await pool.query(
            'UPDATE servers SET nome = $1, icon_url = $2, banner_url = $3 WHERE id = $4 RETURNING *',
            [updatedNome, finalIconUrl, finalBannerUrl, serverId]
        );

        return res.status(200).json({
            message: 'Servidor atualizado com sucesso!',
            server: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar servidor:', error);
        return res.status(500).json({ error: 'Erro ao atualizar servidor.' });
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

// Criar Canal em um Servidor (POST /servers/:serverId/channels)
routes.post('/servers/:serverId/channels', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);
        const { nome, tipo } = req.body;

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        if (!nome || !tipo || !['texto', 'voz'].includes(tipo)) {
            return res.status(400).json({ error: 'Nome e tipo ("texto" ou "voz") são obrigatórios.' });
        }

        const cleanName = String(nome).trim().toLowerCase().replace(/\s+/g, '-');

        const result = await pool.query(
            'INSERT INTO channels (server_id, nome, tipo) VALUES ($1, $2, $3) RETURNING *',
            [serverId, cleanName, tipo]
        );

        return res.status(201).json({
            message: 'Canal criado com sucesso!',
            channel: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar canal no servidor:', error);
        return res.status(500).json({ error: 'Erro ao criar canal.' });
    }
});

// ==========================================
// Rotas de Cargos e Permissões (Discord-Style Roles)
// ==========================================

// Listar todos os cargos de um servidor (GET /servers/:serverId/roles)
routes.get('/servers/:serverId/roles', async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        const roles = await getServerRoles(serverId);
        return res.status(200).json({ roles });
    } catch (error) {
        console.error('Erro ao buscar cargos do servidor:', error);
        return res.status(500).json({ error: 'Erro ao buscar cargos.' });
    }
});

// Criar novo cargo em um servidor (POST /servers/:serverId/roles)
routes.post('/servers/:serverId/roles', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);
        const { nome, cor_hex, posicao, hoist, permissoes } = req.body;

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        if (!nome) {
            return res.status(400).json({ error: 'O nome do cargo é obrigatório.' });
        }

        const newRole = await createServerRole(
            serverId,
            nome,
            cor_hex || '#94a3b8',
            Number(posicao) || 1,
            Boolean(hoist),
            permissoes || {}
        );

        return res.status(201).json({
            message: 'Cargo criado com sucesso!',
            role: newRole
        });
    } catch (error) {
        console.error('Erro ao criar cargo:', error);
        return res.status(500).json({ error: 'Erro ao criar cargo.' });
    }
});

// Listar todos os membros de um servidor com seus cargos (GET /servers/:serverId/members)
routes.get('/servers/:serverId/members', async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        const members = await getServerMembers(serverId);
        return res.status(200).json({ members });
    } catch (error) {
        console.error('Erro ao listar membros do servidor:', error);
        return res.status(500).json({ error: 'Erro ao listar membros.' });
    }
});

// Entrar como membro em um servidor (POST /servers/:serverId/join)
routes.post('/servers/:serverId/join', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);
        const userId = Number(req.userId);

        if (isNaN(serverId) || !userId) {
            return res.status(400).json({ error: 'ID de servidor ou usuário inválido.' });
        }

        await addMemberToServer(userId, serverId);
        const userRoles = await getMemberRoles(userId, serverId);

        return res.status(200).json({
            message: 'Você entrou no servidor com sucesso!',
            roles: userRoles
        });
    } catch (error) {
        console.error('Erro ao entrar no servidor:', error);
        return res.status(500).json({ error: 'Erro ao entrar no servidor.' });
    }
});

// Atribuir cargo a um membro (POST /servers/:serverId/members/:targetUserId/roles/:roleId)
routes.post('/servers/:serverId/members/:targetUserId/roles/:roleId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const serverId = Number(req.params.serverId);
        const targetUserId = Number(req.params.targetUserId);
        const roleId = Number(req.params.roleId);

        if (isNaN(serverId) || isNaN(targetUserId) || isNaN(roleId)) {
            return res.status(400).json({ error: 'IDs fornecidos são inválidos.' });
        }

        const assigned = await assignRoleToMember(targetUserId, serverId, roleId);
        return res.status(200).json({
            message: 'Cargo atribuído com sucesso!',
            assignment: assigned
        });
    } catch (error) {
        console.error('Erro ao atribuir cargo:', error);
        return res.status(500).json({ error: 'Erro ao atribuir cargo.' });
    }
});

// Remover cargo de um membro (DELETE /servers/:serverId/members/:targetUserId/roles/:roleId)
routes.delete('/servers/:serverId/members/:targetUserId/roles/:roleId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const serverId = Number(req.params.serverId);
        const targetUserId = Number(req.params.targetUserId);
        const roleId = Number(req.params.roleId);

        if (isNaN(serverId) || isNaN(targetUserId) || isNaN(roleId)) {
            return res.status(400).json({ error: 'IDs fornecidos são inválidos.' });
        }

        await removeRoleFromMember(targetUserId, serverId, roleId);
        return res.status(200).json({
            message: 'Cargo removido com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao remover cargo:', error);
        return res.status(500).json({ error: 'Erro ao remover cargo.' });
    }
});

// Obter meus cargos e permissões neste servidor (GET /servers/:serverId/my-roles)
routes.get('/servers/:serverId/my-roles', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const serverId = Number(req.params.serverId);
        const userId = Number(req.userId);

        if (isNaN(serverId) || !userId) {
            return res.status(400).json({ error: 'ID de servidor ou usuário inválido.' });
        }

        const roles = await getMemberRoles(userId, serverId);
        return res.status(200).json({ roles });
    } catch (error) {
        console.error('Erro ao buscar meus cargos no servidor:', error);
        return res.status(500).json({ error: 'Erro ao buscar cargos.' });
    }
});

export { routes };
