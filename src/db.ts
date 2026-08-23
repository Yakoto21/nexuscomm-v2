import { Pool } from 'pg';
import dotenv from 'dotenv';
import { initSupabaseBucket } from './supabaseStorage';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Configuração do pool de conexões do PostgreSQL (Supabase / Render)
const isProduction = process.env.NODE_ENV === 'production';
const requiresSSL = connectionString && (connectionString.includes('supabase') || connectionString.includes('sslmode=require') || isProduction);

export const pool = new Pool({
    connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/nexuscomm',
    ssl: requiresSSL
        ? {
              rejectUnauthorized: false
          }
        : undefined
});

// Inicialização e criação automática das tabelas relacionais no PostgreSQL
export async function initDb() {
    try {
        console.log('🐘 Conectando ao banco de dados PostgreSQL...');

        // 1. Tabela de Usuários (Users)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Tabela de Servidores/Comunidades (Servers)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS servers (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                dono_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                icon_url VARCHAR(255),
                banner_url VARCHAR(255),
                data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migração automática para adicionar icon_url e banner_url se a tabela já existia
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'servers' AND column_name = 'icon_url'
                ) THEN
                    ALTER TABLE servers ADD COLUMN icon_url VARCHAR(255);
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'servers' AND column_name = 'banner_url'
                ) THEN
                    ALTER TABLE servers ADD COLUMN banner_url VARCHAR(255);
                END IF;
            END $$;
        `);

        // 3. Tabela de Canais (Channels: texto ou voz)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS channels (
                id SERIAL PRIMARY KEY,
                server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
                nome VARCHAR(255) NOT NULL,
                tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('texto', 'voz')),
                data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Tabela de Mensagens Persistidas (Messages)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                channel_id VARCHAR(255) NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                sender_name VARCHAR(255) NOT NULL,
                conteudo TEXT NOT NULL,
                data_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. Tabela de Cargos do Servidor (server_roles)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS server_roles (
                id SERIAL PRIMARY KEY,
                server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
                nome VARCHAR(100) NOT NULL,
                cor_hex VARCHAR(10) DEFAULT '#94a3b8',
                posicao INTEGER DEFAULT 0,
                hoist BOOLEAN DEFAULT FALSE,
                permissoes JSONB DEFAULT '{"can_manage_server": false, "can_manage_channels": false, "can_kick_users": false, "can_delete_messages": false, "can_send_messages": true, "can_connect_voice": true}'::jsonb,
                data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. Tabela de Membros do Servidor (server_members)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS server_members (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
                nickname VARCHAR(100),
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, server_id)
            );
        `);

        // 7. Tabela de Vínculo Membro-Cargo (member_roles - N:N)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS member_roles (
                user_id INTEGER NOT NULL,
                server_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL REFERENCES server_roles(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, server_id, role_id),
                FOREIGN KEY (user_id, server_id) REFERENCES server_members(user_id, server_id) ON DELETE CASCADE
            );
        `);

        // 8. Migração automática: se a tabela messages foi criada previamente com channel_id INTEGER, converte para VARCHAR(255)
        await pool.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'messages' 
                      AND column_name = 'channel_id' 
                      AND data_type NOT IN ('character varying', 'text', 'varchar')
                ) THEN
                    ALTER TABLE messages ALTER COLUMN channel_id TYPE VARCHAR(255) USING channel_id::varchar;
                END IF;
            END $$;
        `);

        // Criação de índices para performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
            CREATE INDEX IF NOT EXISTS idx_messages_data_envio ON messages(data_envio);
            CREATE INDEX IF NOT EXISTS idx_server_roles_server ON server_roles(server_id);
            CREATE INDEX IF NOT EXISTS idx_server_members_server ON server_members(server_id);
            CREATE INDEX IF NOT EXISTS idx_member_roles_user_server ON member_roles(user_id, server_id);
        `);

        // 9. Cria um servidor padrão de comunidade se nenhum existir
        const serversCountRes = await pool.query('SELECT COUNT(*) FROM servers');
        if (parseInt(serversCountRes.rows[0].count, 10) === 0) {
            const defaultServerRes = await pool.query(
                "INSERT INTO servers (nome) VALUES ('Comunidade NexusComm') RETURNING id"
            );
            const defaultServerId = defaultServerRes.rows[0].id;
            await pool.query(
                "INSERT INTO channels (server_id, nome, tipo) VALUES ($1, 'geral', 'texto'), ($1, 'Voz Principal', 'voz')",
                [defaultServerId]
            );
            await createDefaultServerRoles(defaultServerId);
            console.log('🎉 Servidor padrão [Comunidade NexusComm] e cargos criados com sucesso!');
        } else {
            // Garante que todos os servidores existentes possuam o cargo @everyone
            const allServers = await pool.query('SELECT id, dono_id FROM servers');
            for (const s of allServers.rows) {
                await ensureEveryoneRoleExists(s.id, s.dono_id);
            }
        }

        // Inicializa o bucket server_media no Supabase Storage
        await initSupabaseBucket();

        console.log('✅ Tabelas relacionais do PostgreSQL (Users, Servers, Channels, Messages, Roles, Members, Media) sincronizadas com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao conectar ou inicializar tabelas no PostgreSQL:', err);
    }
}

// ==========================================
// Gestão de Cargos e Permissões Dinâmicas (Discord-Style)
// ==========================================

export interface RolePermissions {
    can_manage_server?: boolean;
    can_manage_channels?: boolean;
    can_kick_users?: boolean;
    can_delete_messages?: boolean;
    can_send_messages?: boolean;
    can_connect_voice?: boolean;
    can_manage_roles?: boolean;
}

/**
 * Cria o cargo padrão @everyone e opcionalmente o cargo de Admin para o dono do servidor.
 */
export async function createDefaultServerRoles(serverId: number, ownerId?: number | null) {
    try {
        // 1. Cargo padrão @everyone (posicao = 0)
        const everyonePerms: RolePermissions = {
            can_send_messages: true,
            can_connect_voice: true,
            can_manage_server: false,
            can_manage_channels: false,
            can_kick_users: false,
            can_delete_messages: false,
            can_manage_roles: false
        };

        const everyoneRes = await pool.query(
            `INSERT INTO server_roles (server_id, nome, cor_hex, posicao, hoist, permissoes)
             VALUES ($1, '@everyone', '#94a3b8', 0, FALSE, $2)
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [serverId, JSON.stringify(everyonePerms)]
        );

        let everyoneRoleId = everyoneRes.rows[0]?.id;
        if (!everyoneRoleId) {
            const findEveryone = await pool.query(
                `SELECT id FROM server_roles WHERE server_id = $1 AND nome = '@everyone' LIMIT 1`,
                [serverId]
            );
            everyoneRoleId = findEveryone.rows[0]?.id;
        }

        // 2. Se houver dono/criador, adiciona como membro e cria cargo de Dono / Admin (posicao = 100)
        if (ownerId) {
            await addMemberToServer(ownerId, serverId);

            const adminPerms: RolePermissions = {
                can_manage_server: true,
                can_manage_channels: true,
                can_kick_users: true,
                can_delete_messages: true,
                can_send_messages: true,
                can_connect_voice: true,
                can_manage_roles: true
            };

            const adminRoleRes = await pool.query(
                `INSERT INTO server_roles (server_id, nome, cor_hex, posicao, hoist, permissoes)
                 VALUES ($1, 'Admin', '#f59e0b', 100, TRUE, $2)
                 RETURNING id`,
                [serverId, JSON.stringify(adminPerms)]
            );

            const adminRoleId = adminRoleRes.rows[0]?.id;
            if (adminRoleId) {
                await assignRoleToMember(ownerId, serverId, adminRoleId);
            }
        }
    } catch (err) {
        console.error(`Erro ao criar cargos padrão para o servidor [${serverId}]:`, err);
    }
}

/**
 * Garante que o cargo @everyone exista em um servidor existente.
 */
export async function ensureEveryoneRoleExists(serverId: number, ownerId?: number | null) {
    const res = await pool.query(
        `SELECT id FROM server_roles WHERE server_id = $1 AND nome = '@everyone' LIMIT 1`,
        [serverId]
    );

    if (res.rows.length === 0) {
        await createDefaultServerRoles(serverId, ownerId);
    }
}

/**
 * Adiciona um usuário como membro de um servidor e atribui automaticamente o cargo @everyone.
 */
export async function addMemberToServer(userId: number, serverId: number, nickname?: string) {
    // 1. Adiciona à tabela server_members
    await pool.query(
        `INSERT INTO server_members (user_id, server_id, nickname)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, server_id) DO NOTHING`,
        [userId, serverId, nickname || null]
    );

    // 2. Localiza o cargo @everyone deste servidor
    const everyoneRoleRes = await pool.query(
        `SELECT id FROM server_roles WHERE server_id = $1 AND nome = '@everyone' LIMIT 1`,
        [serverId]
    );

    if (everyoneRoleRes.rows.length > 0) {
        const everyoneRoleId = everyoneRoleRes.rows[0].id;
        await pool.query(
            `INSERT INTO member_roles (user_id, server_id, role_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, server_id, role_id) DO NOTHING`,
            [userId, serverId, everyoneRoleId]
        );
    }
}

/**
 * Cria um novo cargo personalizado no servidor.
 */
export async function createServerRole(
    serverId: number,
    nome: string,
    corHex = '#94a3b8',
    posicao = 1,
    hoist = false,
    permissoes: RolePermissions = {}
) {
    const defaultPerms: RolePermissions = {
        can_send_messages: true,
        can_connect_voice: true,
        can_manage_server: false,
        can_manage_channels: false,
        can_kick_users: false,
        can_delete_messages: false,
        can_manage_roles: false,
        ...permissoes
    };

    const res = await pool.query(
        `INSERT INTO server_roles (server_id, nome, cor_hex, posicao, hoist, permissoes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [serverId, nome.trim(), corHex, posicao, hoist, JSON.stringify(defaultPerms)]
    );
    return res.rows[0];
}

/**
 * Retorna todos os cargos de um servidor ordenados por hierarquia (posição decrescente).
 */
export async function getServerRoles(serverId: number) {
    const res = await pool.query(
        `SELECT * FROM server_roles WHERE server_id = $1 ORDER BY posicao DESC, id ASC`,
        [serverId]
    );
    return res.rows;
}

/**
 * Atribui um cargo específico a um membro do servidor.
 */
export async function assignRoleToMember(userId: number, serverId: number, roleId: number) {
    // Garante que o membro está registrado no servidor antes de atribuir o cargo
    await pool.query(
        `INSERT INTO server_members (user_id, server_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, server_id) DO NOTHING`,
        [userId, serverId]
    );

    const res = await pool.query(
        `INSERT INTO member_roles (user_id, server_id, role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, server_id, role_id) DO NOTHING
         RETURNING *`,
        [userId, serverId, roleId]
    );
    return res.rows[0] || null;
}

/**
 * Remove um cargo de um membro do servidor.
 */
export async function removeRoleFromMember(userId: number, serverId: number, roleId: number) {
    const res = await pool.query(
        `DELETE FROM member_roles WHERE user_id = $1 AND server_id = $2 AND role_id = $3 RETURNING *`,
        [userId, serverId, roleId]
    );
    return res.rows[0] || null;
}

/**
 * Retorna todos os cargos que um membro possui em um servidor com suas cores e permissões.
 */
export async function getMemberRoles(userId: number, serverId: number) {
    const res = await pool.query(
        `SELECT r.id, r.nome, r.cor_hex, r.posicao, r.hoist, r.permissoes
         FROM member_roles mr
         JOIN server_roles r ON mr.role_id = r.id
         WHERE mr.user_id = $1 AND mr.server_id = $2
         ORDER BY r.posicao DESC`,
        [userId, serverId]
    );
    return res.rows;
}

/**
 * Retorna todos os membros de um servidor com seus cargos agregados.
 */
export async function getServerMembers(serverId: number) {
    const res = await pool.query(
        `SELECT 
            u.id AS user_id,
            u.username,
            sm.nickname,
            sm.joined_at,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', r.id,
                        'nome', r.nome,
                        'cor_hex', r.cor_hex,
                        'posicao', r.posicao,
                        'hoist', r.hoist
                    ) ORDER BY r.posicao DESC
                ) FILTER (WHERE r.id IS NOT NULL), '[]'
            ) AS roles
         FROM server_members sm
         JOIN users u ON sm.user_id = u.id
         LEFT JOIN member_roles mr ON sm.user_id = mr.user_id AND sm.server_id = mr.server_id
         LEFT JOIN server_roles r ON mr.role_id = r.id
         WHERE sm.server_id = $1
         GROUP BY u.id, u.username, sm.nickname, sm.joined_at
         ORDER BY sm.joined_at ASC`,
        [serverId]
    );
    return res.rows;
}

// ==========================================
// Helpers de Usuários e Mensagens
// ==========================================

export async function findUserByUsername(username: string) {
    const res = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
    return res.rows[0] || null;
}

export async function findUserById(id: number | string) {
    const numericId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (isNaN(numericId)) return null;

    const res = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1 LIMIT 1', [numericId]);
    return res.rows[0] || null;
}

export async function createUser(username: string, passwordHash: string) {
    const res = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
        [username, passwordHash]
    );
    return res.rows[0];
}

export async function saveMessage(channelId: string, userId: number | string | null | undefined, senderName: string, conteudo: string) {
    const safeChannelId = String(channelId || 'geral');

    let safeUserId: number | null = null;
    if (userId !== null && userId !== undefined) {
        const parsed = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
        if (!isNaN(parsed) && isFinite(parsed)) {
            safeUserId = parsed;
        }
    }

    const safeSenderName = String(senderName || 'Anônimo');
    const safeContent = String(conteudo || '');

    const res = await pool.query(
        `INSERT INTO messages (channel_id, user_id, sender_name, conteudo, data_envio)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, channel_id, user_id, sender_name AS sender, conteudo AS text, data_envio AS timestamp`,
        [safeChannelId, safeUserId, safeSenderName, safeContent]
    );
    return res.rows[0];
}

export async function getMessagesByChannel(channelId: string, limit = 50) {
    const safeChannelId = String(channelId || 'geral');
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const res = await pool.query(
        `SELECT id, channel_id, user_id, sender_name AS sender, conteudo AS text, data_envio AS timestamp
         FROM messages
         WHERE channel_id = $1
         ORDER BY data_envio ASC
         LIMIT $2`,
        [safeChannelId, safeLimit]
    );
    return res.rows;
}
