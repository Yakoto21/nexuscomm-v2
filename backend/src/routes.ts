import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';
import { ensureServerMember, ensureServerPermission } from './middlewares/serverPermissions';
import { uploadServerMediaFile, uploadUserAvatar, uploadChatMediaFile, uploadChatMediaBuffer } from './supabaseStorage';
import {
    findUserByUsername,
    findUserById,
    updateUserProfile,
    createUser,
    getMessagesByChannel,
    getMessageById,
    updateMessage,
    deleteMessage,
    canUserModerateMessage,
    canUserAccessChannel,
    createDefaultServerRoles,
    createServerRole,
    getServerRoles,
    addMemberToServer,
    assignRoleToMember,
    removeRoleFromMember,
    getMemberRoles,
    getServerMembers,
    getFriendships,
    sendFriendRequest,
    respondFriendRequest,
    getDirectMessages,
    saveDirectMessage,
    createServerInvite,
    getInviteByCode,
    acceptServerInvite,
    getChannelById,
    updateChannel,
    deleteChannel,
    canUserManageChannel,
    pool
} from './db';

const routes = Router();

// Configuração do Multer para Upload de Mídias de Chat (Sprint: Compartilhamento de Mídia)
const uploadChatMediaMulter = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem e GIFs são permitidos.'));
        }
    }
});

// Função utilitária para sanitização e garantia de texto puro (Anti-XSS Defense-in-Depth)
function sanitizePlainText(input: unknown): string {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>?/gm, '').trim();
}

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
                display_name: newUser.display_name,
                avatar_url: newUser.avatar_url,
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
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não configurado nas variáveis de ambiente.');
            return res.status(500).json({ error: 'Erro de configuração no servidor de autenticação.' });
        }

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
                username: user.username,
                display_name: user.display_name,
                avatar_url: user.avatar_url
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
                display_name: user.display_name,
                avatar_url: user.avatar_url,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar perfil.' });
    }
});

// Rota para atualizar perfil do usuário autenticado (PATCH /me)
routes.patch('/me', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { display_name, avatar, avatar_url } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'ID de usuário inválido.' });
        }

        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        let finalAvatarUrl = user.avatar_url;
        if (avatar && typeof avatar === 'string') {
            finalAvatarUrl = await uploadUserAvatar(userId, avatar);
        } else if (avatar_url !== undefined) {
            finalAvatarUrl = avatar_url;
        }

        const cleanDisplayName = display_name !== undefined ? sanitizePlainText(display_name) : user.display_name;

        const updatedUser = await updateUserProfile(
            userId,
            cleanDisplayName,
            finalAvatarUrl
        );

        return res.status(200).json({
            message: 'Perfil atualizado com sucesso!',
            user: updatedUser
        });
    } catch (error: any) {
        console.error('Erro ao atualizar perfil do usuário:', error);
        return res.status(500).json({ error: error?.message || 'Erro interno ao atualizar perfil.' });
    }
});

// ==========================================
// Rotas de Mensagens Persistidas
// ==========================================

// Buscar histórico de mensagens de um canal ou sala WebRTC (GET /messages/:channelId)
routes.get('/messages/:channelId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const channelIdParam = req.params.channelId;
        const channelId = Array.isArray(channelIdParam) ? channelIdParam[0] : channelIdParam;
        const limitParam = req.query.limit ? Math.min(Number(req.query.limit), 50) : 50;
        const beforeIdParam = req.query.beforeId ? Number(req.query.beforeId) : undefined;

        if (!channelId) {
            return res.status(400).json({ error: 'ID do canal é obrigatório.' });
        }

        // Validação de autorização: o usuário precisa ter acesso a este canal/servidor
        const hasAccess = await canUserAccessChannel(userId, channelId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Acesso negado ao histórico deste canal.' });
        }

        const messages = await getMessagesByChannel(channelId, limitParam, beforeIdParam);

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

// Editar Mensagem do Chat (PATCH /messages/:messageId - Sprint 7)
routes.patch('/messages/:messageId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const messageId = Number(req.params.messageId);
        const { text, content } = req.body;

        if (isNaN(messageId) || !userId) {
            return res.status(400).json({ error: 'ID de mensagem ou usuário inválido.' });
        }

        const rawText = String(text || content || '');
        const cleanText = sanitizePlainText(rawText).substring(0, 2000);

        if (!cleanText) {
            return res.status(400).json({ error: 'O conteúdo da mensagem não pode ficar vazio.' });
        }

        const existingMsg = await getMessageById(messageId);
        if (!existingMsg) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        // Apenas o próprio autor pode editar sua mensagem
        if (existingMsg.user_id !== userId) {
            return res.status(403).json({ error: 'Você só pode editar suas próprias mensagens.' });
        }

        const updatedMsg = await updateMessage(messageId, userId, cleanText);
        if (!updatedMsg) {
            return res.status(500).json({ error: 'Falha ao atualizar mensagem.' });
        }

        // Emite broadcast via Socket.IO para atualizar em tempo real na tela de todos
        try {
            const { io } = require('./server');
            if (io && updatedMsg.channel_id) {
                io.to(updatedMsg.channel_id).emit('message-updated', updatedMsg);
            }
        } catch (sockErr) {
            // Silencioso em caso de inicialização assíncrona
        }

        return res.status(200).json({
            message: 'Mensagem editada com sucesso!',
            updatedMessage: updatedMsg
        });
    } catch (error) {
        console.error('Erro ao editar mensagem:', error);
        return res.status(500).json({ error: 'Erro interno ao editar mensagem.' });
    }
});

// Apagar Mensagem do Chat (DELETE /messages/:messageId - Sprint 7)
routes.delete('/messages/:messageId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const messageId = Number(req.params.messageId);

        if (isNaN(messageId) || !userId) {
            return res.status(400).json({ error: 'ID de mensagem ou usuário inválido.' });
        }

        const existingMsg = await getMessageById(messageId);
        if (!existingMsg) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        // Valida se o usuário é o autor ou se é moderador/administrador/dono do servidor
        const canDelete = await canUserModerateMessage(userId, messageId);
        if (!canDelete) {
            return res.status(403).json({ error: 'Você não tem permissão para apagar esta mensagem.' });
        }

        const deleted = await deleteMessage(messageId);

        // Emite broadcast via Socket.IO para remover em tempo real na tela de todos
        try {
            const { io } = require('./server');
            if (io && existingMsg.channel_id) {
                io.to(existingMsg.channel_id).emit('message-deleted', {
                    id: messageId,
                    channel_id: existingMsg.channel_id
                });
            }
        } catch (sockErr) {
            // Silencioso
        }

        return res.status(200).json({
            message: 'Mensagem apagada com sucesso!',
            id: messageId,
            channel_id: existingMsg.channel_id
        });
    } catch (error) {
        console.error('Erro ao apagar mensagem:', error);
        return res.status(500).json({ error: 'Erro interno ao apagar mensagem.' });
    }
});

// ==========================================
// Rotas de Comunidades (Servers e Canais)
// ==========================================

// Listar Servidores / Comunidades em que o Usuário Autenticado é Membro (GET /servers)
routes.get('/servers', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        const result = await pool.query(
            `SELECT s.* FROM servers s
             INNER JOIN server_members sm ON s.id = sm.server_id
             WHERE sm.user_id = $1
             ORDER BY s.data_criacao DESC`,
            [userId]
        );
        return res.status(200).json({ servers: result.rows });
    } catch (error) {
        console.error('Erro ao listar servidores do usuário:', error);
        return res.status(500).json({ error: 'Erro ao listar servidores.' });
    }
});

// Criar Servidor / Comunidade (POST /servers)
routes.post('/servers', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const { nome } = req.body;
        const userId = Number(req.userId);
        const cleanServerName = sanitizePlainText(nome);

        if (!cleanServerName) {
            return res.status(400).json({ error: 'O nome do servidor é obrigatório e deve conter texto válido.' });
        }

        const result = await pool.query(
            'INSERT INTO servers (nome, dono_id) VALUES ($1, $2) RETURNING *',
            [cleanServerName, userId || null]
        );

        const newServer = result.rows[0];

        // Adiciona automaticamente o criador como membro do servidor
        if (userId) {
            await addMemberToServer(userId, newServer.id);
        }

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
routes.patch('/servers/:serverId', ensureAuthenticated, ensureServerPermission('can_manage_server'), async (req: Request, res: Response) => {
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
        const cleanServerName = nome !== undefined ? sanitizePlainText(nome) : '';
        const updatedNome = cleanServerName ? cleanServerName : currentServer.nome;

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
    } catch (error: any) {
        console.error('Erro ao atualizar servidor:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao atualizar servidor.' });
    }
});

// Listar Canais de um Servidor (GET /servers/:serverId/channels)
routes.get('/servers/:serverId/channels', ensureAuthenticated, ensureServerMember, async (req: Request, res: Response) => {
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
routes.post('/servers/:serverId/channels', ensureAuthenticated, ensureServerPermission('can_manage_channels'), async (req: Request, res: Response) => {
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

        const cleanName = sanitizePlainText(nome).toLowerCase().replace(/\s+/g, '-');
        if (!cleanName) {
            return res.status(400).json({ error: 'O nome do canal é inválido.' });
        }

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
// Gestão de Canais: Renomear e Excluir (PATCH & DELETE /api/channels/:id)
// ==========================================

// Renomear Canal (PATCH /api/channels/:id)
routes.patch(['/api/channels/:id', '/channels/:id'], ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const channelIdParam = req.params.id;
        const channelId = Number(Array.isArray(channelIdParam) ? channelIdParam[0] : channelIdParam);
        const { nome } = req.body;

        if (isNaN(channelId) || isNaN(userId)) {
            return res.status(400).json({ error: 'ID do canal ou usuário inválido.' });
        }

        if (!nome || typeof nome !== 'string') {
            return res.status(400).json({ error: 'O novo nome do canal é obrigatório.' });
        }

        const cleanName = sanitizePlainText(nome).toLowerCase().replace(/\s+/g, '-').substring(0, 100);
        if (!cleanName) {
            return res.status(400).json({ error: 'O nome do canal é inválido.' });
        }

        const channel = await getChannelById(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Canal não encontrado.' });
        }

        const canManage = await canUserManageChannel(userId, channelId);
        if (!canManage) {
            return res.status(403).json({ error: 'Você não tem permissão para personalizar este canal.' });
        }

        const updated = await updateChannel(channelId, cleanName);

        // Notifica via Socket.IO em tempo real
        try {
            const { io } = require('./server');
            if (io && updated) {
                io.emit('channel-updated', {
                    id: updated.id,
                    server_id: updated.server_id,
                    nome: updated.nome,
                    tipo: updated.tipo
                });
            }
        } catch (sockErr) {
            console.warn('Aviso ao emitir channel-updated via Socket.IO:', sockErr);
        }

        return res.status(200).json({
            message: 'Canal renomeado com sucesso!',
            channel: updated
        });
    } catch (error: any) {
        console.error('Erro ao renomear canal:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao renomear canal.' });
    }
});

// Excluir Canal (DELETE /api/channels/:id)
routes.delete(['/api/channels/:id', '/channels/:id'], ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const channelIdParam = req.params.id;
        const channelId = Number(Array.isArray(channelIdParam) ? channelIdParam[0] : channelIdParam);

        if (isNaN(channelId) || isNaN(userId)) {
            return res.status(400).json({ error: 'ID do canal ou usuário inválido.' });
        }

        const channel = await getChannelById(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Canal não encontrado.' });
        }

        const canManage = await canUserManageChannel(userId, channelId);
        if (!canManage) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir este canal.' });
        }

        const deleted = await deleteChannel(channelId);

        // Notifica via Socket.IO em tempo real
        try {
            const { io } = require('./server');
            if (io && deleted) {
                io.emit('channel-deleted', {
                    id: channelId,
                    server_id: deleted.server_id,
                    nome: deleted.nome,
                    tipo: deleted.tipo
                });
            }
        } catch (sockErr) {
            console.warn('Aviso ao emitir channel-deleted via Socket.IO:', sockErr);
        }

        return res.status(200).json({
            message: 'Canal excluído com sucesso!',
            id: channelId,
            server_id: deleted?.server_id
        });
    } catch (error: any) {
        console.error('Erro ao excluir canal:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao excluir canal.' });
    }
});

// ==========================================
// Rotas de Cargos e Permissões (Discord-Style Roles)
// ==========================================

// Listar todos os cargos de um servidor (GET /servers/:serverId/roles)
routes.get('/servers/:serverId/roles', ensureAuthenticated, ensureServerMember, async (req: Request, res: Response) => {
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
routes.post('/servers/:serverId/roles', ensureAuthenticated, ensureServerPermission('can_manage_roles'), async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);
        const { nome, cor_hex, posicao, hoist, permissoes } = req.body;

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        const cleanRoleName = sanitizePlainText(nome);
        if (!cleanRoleName) {
            return res.status(400).json({ error: 'O nome do cargo é obrigatório e deve conter texto válido.' });
        }

        const newRole = await createServerRole(
            serverId,
            cleanRoleName,
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

// Listar todos os membros de um servidor com seus cargos (GET /servers/:serverId/members e GET /api/servers/:serverId/members)
routes.get(['/servers/:serverId/members', '/api/servers/:serverId/members'], ensureAuthenticated, ensureServerMember, async (req: Request, res: Response) => {
    try {
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID do servidor inválido.' });
        }

        const limitParam = req.query.limit ? Math.min(Number(req.query.limit), 50) : 50;
        const offsetParam = req.query.offset ? Number(req.query.offset) : 0;

        const members = await getServerMembers(serverId, limitParam, offsetParam);
        return res.status(200).json({ members });
    } catch (error: any) {
        console.error('Erro ao listar membros do servidor:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao listar membros.' });
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
routes.post('/servers/:serverId/members/:targetUserId/roles/:roleId', ensureAuthenticated, ensureServerPermission('can_manage_roles'), async (req: Request, res: Response) => {
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
routes.delete('/servers/:serverId/members/:targetUserId/roles/:roleId', ensureAuthenticated, ensureServerPermission('can_manage_roles'), async (req: Request, res: Response) => {
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

// ==========================================
// Hub Social: Sistema de Amigos & DMs (Sprint 3)
// ==========================================

// Listar amigos e solicitações (GET /friends)
routes.get('/friends', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        if (!userId) return res.status(401).json({ error: 'Não autorizado.' });

        const lists = await getFriendships(userId);
        return res.status(200).json(lists);
    } catch (error) {
        console.error('Erro ao buscar lista de amigos:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar amigos.' });
    }
});

// Enviar solicitação de amizade (POST /friends/request)
routes.post('/friends/request', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { target_username, target_user_id } = req.body;

        if (!userId) return res.status(401).json({ error: 'Não autorizado.' });

        let resolvedUsername = typeof target_username === 'string' ? target_username.trim() : '';
        if (!resolvedUsername && target_user_id) {
            const targetUser = await findUserById(target_user_id);
            if (targetUser) resolvedUsername = targetUser.username;
        }

        if (!resolvedUsername) {
            return res.status(400).json({ error: 'Nome de usuário alvo é obrigatório.' });
        }

        const result = await sendFriendRequest(userId, resolvedUsername);
        return res.status(200).json({
            message: result.autoAccepted ? 'Pedido aceito mutuamente! Vocês agora são amigos.' : 'Pedido de amizade enviado com sucesso!',
            ...result
        });
    } catch (error: any) {
        console.warn('Aviso ao enviar pedido de amizade:', error?.message);
        return res.status(400).json({ error: error?.message || 'Erro ao enviar pedido de amizade.' });
    }
});

// Responder a pedido de amizade (POST /friends/respond)
routes.post('/friends/respond', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const { friendship_id, action } = req.body;

        if (!userId) return res.status(401).json({ error: 'Não autorizado.' });
        if (!friendship_id || !action) {
            return res.status(400).json({ error: 'friendship_id e action são obrigatórios.' });
        }

        const result = await respondFriendRequest(userId, Number(friendship_id), action);
        return res.status(200).json(result);
    } catch (error: any) {
        console.warn('Aviso ao responder pedido de amizade:', error?.message);
        return res.status(400).json({ error: error?.message || 'Erro ao processar resposta.' });
    }
});

// Obter histórico de mensagens diretas (GET /dms/:otherUserId)
routes.get('/dms/:otherUserId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const otherUserId = Number(req.params.otherUserId);
        const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 50;
        const beforeId = req.query.beforeId ? Number(req.query.beforeId) : undefined;

        if (!userId || isNaN(otherUserId)) {
            return res.status(400).json({ error: 'IDs de usuário inválidos.' });
        }

        const messages = await getDirectMessages(userId, otherUserId, limit, beforeId);
        return res.status(200).json({ messages });
    } catch (error) {
        console.error('Erro ao buscar mensagens diretas:', error);
        return res.status(500).json({ error: 'Erro ao carregar mensagens diretas.' });
    }
});

// Upload de Anexos de Mídia para o Chat (POST /api/messages/media - Sprint: Compartilhamento de Mídia)
routes.post(
    ['/api/messages/media', '/messages/media', '/upload/media'],
    ensureAuthenticated,
    (req: Request, res: Response, next) => {
        uploadChatMediaMulter.single('file')(req, res, (err: any) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ error: 'A imagem selecionada excede o limite de 10MB.' });
                    }
                    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
                }
                return res.status(400).json({ error: err.message || 'Arquivo de mídia inválido.' });
            }
            next();
        });
    },
    async (req: Request, res: Response) => {
        try {
            let publicUrl = '';

            // 1. Upload via Multer (multipart/form-data)
            if (req.file) {
                publicUrl = await uploadChatMediaBuffer(
                    req.file.originalname,
                    req.file.buffer,
                    req.file.mimetype
                );
            }
            // 2. Upload via JSON Base64 (application/json)
            else if (req.body?.fileData) {
                const fileName = req.body.fileName || 'imagem.png';
                publicUrl = await uploadChatMediaFile(fileName, req.body.fileData);
            } else {
                return res.status(400).json({ error: 'Nenhum arquivo de imagem fornecido para upload.' });
            }

            return res.status(200).json({
                message: 'Mídia enviada com sucesso!',
                url: publicUrl,
                media_url: publicUrl
            });
        } catch (error: any) {
            console.error('❌ Erro no upload de mídia do chat:', error);
            return res.status(500).json({ error: error?.message || 'Falha ao processar upload de mídia.' });
        }
    }
);

// Enviar mensagem direta (POST /dms/:otherUserId)
routes.post('/dms/:otherUserId', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const senderId = Number(req.userId);
        const receiverId = Number(req.params.otherUserId);
        const { content, media_url, mediaUrl } = req.body;

        if (!senderId || isNaN(receiverId)) {
            return res.status(400).json({ error: 'IDs de usuário inválidos.' });
        }

        const sanitizedContent = sanitizePlainText(content);
        const targetMediaUrl = media_url || mediaUrl || null;

        if (!sanitizedContent && !targetMediaUrl) {
            return res.status(400).json({ error: 'A mensagem deve conter texto ou uma mídia em anexo.' });
        }

        const message = await saveDirectMessage(senderId, receiverId, sanitizedContent, targetMediaUrl);
        return res.status(201).json({ message });
    } catch (error: any) {
        console.error('Erro ao enviar mensagem direta:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao enviar mensagem direta.' });
    }
});

// ==========================================
// Rotas do Sistema de Convites (Server Invites Sprint)
// ==========================================

// Gerar novo convite para o servidor (POST /servers/:serverId/invites)
routes.post('/servers/:serverId/invites', ensureAuthenticated, ensureServerMember, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const serverIdParam = req.params.serverId;
        const serverId = Number(Array.isArray(serverIdParam) ? serverIdParam[0] : serverIdParam);
        const { expires_in_days, max_uses } = req.body;

        if (isNaN(serverId) || !userId) {
            return res.status(400).json({ error: 'ID do servidor ou usuário inválido.' });
        }

        const expiresInDays = expires_in_days !== undefined ? Number(expires_in_days) : 7;
        const maxUsesLimit = max_uses !== undefined && max_uses !== null ? Number(max_uses) : null;

        const invite = await createServerInvite(serverId, userId, expiresInDays, maxUsesLimit);

        const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
        const inviteUrl = `${origin}/?invite=${invite.code}`;

        return res.status(201).json({
            message: 'Convite gerado com sucesso!',
            invite: {
                id: invite.id,
                code: invite.code,
                server_id: invite.server_id,
                created_by: invite.created_by,
                expires_at: invite.expires_at,
                max_uses: invite.max_uses,
                uses: invite.uses,
                created_at: invite.created_at,
                inviteUrl
            }
        });
    } catch (error: any) {
        console.error('Erro ao gerar convite do servidor:', error);
        return res.status(500).json({ error: error?.message || 'Erro interno ao gerar convite.' });
    }
});

// Visualizar detalhes de um convite / Preview (GET /invites/:code)
routes.get('/invites/:code', async (req: Request, res: Response) => {
    try {
        const codeParam = req.params.code;
        const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

        if (!code) {
            return res.status(400).json({ error: 'Código de convite é obrigatório.' });
        }

        const invite = await getInviteByCode(code);
        if (!invite) {
            return res.status(404).json({ error: 'Convite não encontrado ou inválido.' });
        }

        return res.status(200).json({
            valid: invite.is_valid,
            code: invite.code,
            expires_at: invite.expires_at,
            is_expired: invite.is_expired,
            is_max_uses_reached: invite.is_max_uses_reached,
            server: {
                id: invite.server_id,
                nome: invite.server_nome,
                icon_url: invite.server_icon_url,
                banner_url: invite.server_banner_url,
                total_members: invite.total_members
            },
            inviter: {
                username: invite.inviter_username,
                display_name: invite.inviter_display_name
            }
        });
    } catch (error: any) {
        console.error('Erro ao buscar detalhes do convite:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao consultar convite.' });
    }
});

// Aceitar convite e entrar no servidor (POST /invites/:code)
routes.post('/invites/:code', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const codeParam = req.params.code;
        const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

        if (!code || !userId) {
            return res.status(400).json({ error: 'Código de convite e autenticação são obrigatórios.' });
        }

        const result = await acceptServerInvite(code, userId);

        // Notifica via Socket.IO em tempo real (broadcast para atualização instantânea dos membros)
        try {
            const { io } = require('./server');
            if (io && result.server) {
                const joiningUser = await findUserById(userId);
                io.emit('member-joined', {
                    serverId: result.server.id,
                    server: result.server,
                    user: {
                        user_id: userId,
                        username: joiningUser?.username || 'Usuário',
                        nickname: joiningUser?.display_name || joiningUser?.username || 'Usuário',
                        avatar_url: joiningUser?.avatar_url || null,
                        joined_at: new Date().toISOString(),
                        roles: [{ nome: '@everyone', cor_hex: '#94a3b8' }]
                    }
                });
            }
        } catch (sockErr) {
            console.warn('Aviso ao emitir evento Socket.IO member-joined:', sockErr);
        }

        return res.status(200).json({
            message: result.alreadyMember 
                ? 'Você já é membro deste servidor!' 
                : 'Você entrou no servidor com sucesso!',
            alreadyMember: result.alreadyMember,
            server: result.server
        });
    } catch (error: any) {
        console.error('Erro ao aceitar convite:', error);
        return res.status(400).json({ error: error?.message || 'Falha ao processar convite.' });
    }
});

// ==========================================
// Moderação e Edição de Mensagens (DELETE & PATCH /api/messages/:id)
// ==========================================

// Excluir mensagem com verificação de cargo de Moderação / Admin / Autor (DELETE /api/messages/:id)
routes.delete(['/api/messages/:id', '/messages/:id'], ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const msgIdParam = req.params.id;
        const messageId = Number(Array.isArray(msgIdParam) ? msgIdParam[0] : msgIdParam);

        if (isNaN(messageId) || isNaN(userId)) {
            return res.status(400).json({ error: 'ID da mensagem inválido.' });
        }

        const msg = await getMessageById(messageId);
        if (!msg) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        const canDelete = await canUserModerateMessage(userId, messageId);
        if (!canDelete) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir esta mensagem.' });
        }

        await deleteMessage(messageId);

        // Notifica via Socket.IO para remover em tempo real na tela de todos
        try {
            const { io } = require('./server');
            if (io && msg.channel_id) {
                io.to(msg.channel_id).emit('message-deleted', {
                    id: messageId,
                    channel_id: msg.channel_id
                });
            }
        } catch (sockErr) {
            console.warn('Aviso ao emitir message-deleted via Socket.IO:', sockErr);
        }

        return res.status(200).json({ success: true, message: 'Mensagem excluída com sucesso.', id: messageId });
    } catch (error: any) {
        console.error('Erro ao excluir mensagem:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao excluir mensagem.' });
    }
});

// Editar mensagem (PATCH /api/messages/:id)
routes.patch(['/api/messages/:id', '/messages/:id'], ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.userId);
        const msgIdParam = req.params.id;
        const messageId = Number(Array.isArray(msgIdParam) ? msgIdParam[0] : msgIdParam);
        const text = sanitizePlainText(req.body?.text || '').substring(0, 2000);

        if (isNaN(messageId) || isNaN(userId) || !text) {
            return res.status(400).json({ error: 'ID e conteúdo da mensagem são obrigatórios.' });
        }

        const existing = await getMessageById(messageId);
        if (!existing) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        if (existing.user_id !== userId) {
            return res.status(403).json({ error: 'Apenas o autor pode editar esta mensagem.' });
        }

        const updated = await updateMessage(messageId, userId, text);

        // Notifica via Socket.IO
        try {
            const { io } = require('./server');
            if (io && updated && updated.channel_id) {
                io.to(updated.channel_id).emit('message-updated', updated);
            }
        } catch (sockErr) {
            console.warn('Aviso ao emitir message-updated via Socket.IO:', sockErr);
        }

        return res.status(200).json({ success: true, message: updated });
    } catch (error: any) {
        console.error('Erro ao editar mensagem:', error);
        return res.status(500).json({ error: error?.message || 'Erro ao editar mensagem.' });
    }
});

export { routes };
