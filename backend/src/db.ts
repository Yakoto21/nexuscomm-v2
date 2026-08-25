import crypto from 'crypto';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { initSupabaseBucket } from './supabaseStorage';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// 🔒 SEC-05: Sanitizador Anti-XSS para mensagens e dados de texto puro
export function sanitizePlainText(str: string): string {
    return String(str || '').replace(/<[^>]*>?/gm, '').trim();
}

// Configuração do pool de conexões do PostgreSQL (Supabase / Render)
const isProduction = process.env.NODE_ENV === 'production';
const requiresSSL = connectionString && (connectionString.includes('supabase') || connectionString.includes('sslmode=require') || isProduction);
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' || (isProduction && process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false');

export const pool = new Pool({
    connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/nexuscomm',
    ssl: requiresSSL
        ? {
              rejectUnauthorized: rejectUnauthorized
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

        // Migração automática para adicionar avatar_url e display_name na tabela users
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'avatar_url'
                ) THEN
                    ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'display_name'
                ) THEN
                    ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
                END IF;
            END $$;
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
                media_url TEXT DEFAULT NULL,
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

        // 8. Tabela de Amizades (friendships - Sprint 3)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS friendships (
                id SERIAL PRIMARY KEY,
                user_id_1 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_id_2 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_different_users CHECK (user_id_1 <> user_id_2),
                CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2)
            );
        `);

        // 9. Tabela de Mensagens Diretas (direct_messages - Sprint 3)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS direct_messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                media_url TEXT DEFAULT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 10. Tabela de Convites de Servidores (server_invites - Sprint de Convites)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS server_invites (
                id SERIAL PRIMARY KEY,
                code VARCHAR(12) NOT NULL UNIQUE,
                server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
                created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
                max_uses INTEGER DEFAULT NULL,
                uses INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 11. Migração automática: se a tabela messages foi criada previamente com channel_id INTEGER, converte para VARCHAR(255)
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

        // 12. Habilitação de Segurança em Nível de Linha (RLS) para Friendships e DMs
        await pool.query(`
            ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
            ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'friendships_isolation_policy'
                ) THEN
                    CREATE POLICY friendships_isolation_policy ON friendships
                        FOR ALL
                        USING (
                            auth.uid()::text = user_id_1::text OR auth.uid()::text = user_id_2::text
                        )
                        WITH CHECK (
                            auth.uid()::text = user_id_1::text OR auth.uid()::text = user_id_2::text
                        );
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'dm_isolation_policy'
                ) THEN
                    CREATE POLICY dm_isolation_policy ON direct_messages
                        FOR ALL
                        USING (
                            auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text
                        )
                        WITH CHECK (
                            auth.uid()::text = sender_id::text
                        );
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
            CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id_1);
            CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id_2);
            CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
            CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
            CREATE INDEX IF NOT EXISTS idx_dm_created_at ON direct_messages(created_at);
            CREATE INDEX IF NOT EXISTS idx_server_invites_code ON server_invites(code);
            CREATE INDEX IF NOT EXISTS idx_server_invites_server ON server_invites(server_id);
        `);

        // 12. Migração automática: garante que a coluna media_url exista nas tabelas messages e direct_messages (Sprint 4)
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'messages' AND column_name = 'media_url'
                ) THEN
                    ALTER TABLE messages ADD COLUMN media_url TEXT DEFAULT NULL;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'direct_messages' AND column_name = 'media_url'
                ) THEN
                    ALTER TABLE direct_messages ADD COLUMN media_url TEXT DEFAULT NULL;
                END IF;
            END $$;
        `);

        // 13. Migração automática: garante que a coluna is_edited exista na tabela messages (Sprint 7)
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'messages' AND column_name = 'is_edited'
                ) THEN
                    ALTER TABLE messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
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
            // Garante que todos os donos de servidores existentes estejam em server_members
            await pool.query(`
                INSERT INTO server_members (user_id, server_id)
                SELECT dono_id, id FROM servers
                WHERE dono_id IS NOT NULL
                ON CONFLICT (user_id, server_id) DO NOTHING;
            `);

            // Garante que todos os servidores existentes possuam o cargo @everyone
            const allServers = await pool.query('SELECT id, dono_id FROM servers');
            for (const s of allServers.rows) {
                await ensureEveryoneRoleExists(s.id, s.dono_id);
            }
        }

        // Inicializa os buckets server_media e user_avatars no Supabase Storage
        await initSupabaseBucket();

        console.log('✅ Tabelas relacionais do PostgreSQL (Users, Servers, Channels, Messages, Roles, Members, Media, Avatars) sincronizadas com sucesso!');
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
 * Cria o cargo padrão @everyone, Moderador e Admin para o servidor.
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

        await pool.query(
            `INSERT INTO server_roles (server_id, nome, cor_hex, posicao, hoist, permissoes)
             VALUES ($1, '@everyone', '#94a3b8', 0, FALSE, $2)
             ON CONFLICT DO NOTHING`,
            [serverId, JSON.stringify(everyonePerms)]
        );

        // 2. Cargo padrão Moderador (posicao = 50)
        const modPerms: RolePermissions = {
            can_send_messages: true,
            can_connect_voice: true,
            can_delete_messages: true,
            can_kick_users: true,
            can_manage_channels: false,
            can_manage_server: false,
            can_manage_roles: false
        };

        await pool.query(
            `INSERT INTO server_roles (server_id, nome, cor_hex, posicao, hoist, permissoes)
             VALUES ($1, 'Moderador', '#38bdf8', 50, TRUE, $2)
             ON CONFLICT DO NOTHING`,
            [serverId, JSON.stringify(modPerms)]
        );

        // 3. Se houver dono/criador, adiciona como membro e cria cargo de Dono / Admin (posicao = 100)
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
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                [serverId, JSON.stringify(adminPerms)]
            );

            let adminRoleId = adminRoleRes.rows[0]?.id;
            if (!adminRoleId) {
                const findAdmin = await pool.query(
                    `SELECT id FROM server_roles WHERE server_id = $1 AND nome = 'Admin' LIMIT 1`,
                    [serverId]
                );
                adminRoleId = findAdmin.rows[0]?.id;
            }

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

    const res = await pool.query(
        'SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = $1 LIMIT 1',
        [numericId]
    );
    return res.rows[0] || null;
}

export async function updateUserProfile(
    id: number | string,
    displayName?: string | null,
    avatarUrl?: string | null
) {
    const numericId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (isNaN(numericId)) return null;

    const res = await pool.query(
        `UPDATE users
         SET display_name = COALESCE($1, display_name),
             avatar_url = COALESCE($2, avatar_url)
         WHERE id = $3
         RETURNING id, username, display_name, avatar_url, created_at`,
        [displayName !== undefined ? displayName : null, avatarUrl !== undefined ? avatarUrl : null, numericId]
    );
    return res.rows[0] || null;
}

export async function createUser(username: string, passwordHash: string) {
    const res = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, display_name, avatar_url, created_at',
        [username, passwordHash]
    );
    return res.rows[0];
}

export async function saveMessage(
    channelId: string,
    userId: number | string | null | undefined,
    senderName: string,
    conteudo: string,
    mediaUrl?: string | null
) {
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
    const safeMediaUrl = mediaUrl ? String(mediaUrl) : null;

    const res = await pool.query(
        `INSERT INTO messages (channel_id, user_id, sender_name, conteudo, media_url, is_edited, data_envio)
         VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP)
         RETURNING id, channel_id, user_id, sender_name AS sender, conteudo AS text, media_url, is_edited, data_envio AS timestamp`,
        [safeChannelId, safeUserId, safeSenderName, safeContent, safeMediaUrl]
    );
    return res.rows[0];
}

export async function getMessagesByChannel(channelId: string, limit = 50) {
    const safeChannelId = String(channelId || 'geral');
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const res = await pool.query(
        `SELECT id, channel_id, user_id, sender_name AS sender, conteudo AS text, media_url, is_edited, data_envio AS timestamp
         FROM messages
         WHERE channel_id = $1
         ORDER BY data_envio ASC
         LIMIT $2`,
        [safeChannelId, safeLimit]
    );
    return res.rows;
}

export async function getMessageById(messageId: number | string) {
    const numericId = typeof messageId === 'number' ? messageId : parseInt(String(messageId), 10);
    if (isNaN(numericId)) return null;

    const res = await pool.query(
        `SELECT id, channel_id, user_id, sender_name AS sender, conteudo AS text, media_url, is_edited, data_envio AS timestamp
         FROM messages
         WHERE id = $1
         LIMIT 1`,
        [numericId]
    );
    return res.rows[0] || null;
}

export async function updateMessage(messageId: number | string, userId: number | string, newContent: string) {
    const numMsgId = typeof messageId === 'number' ? messageId : parseInt(String(messageId), 10);
    const numUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    const safeText = String(newContent || '').trim();

    if (isNaN(numMsgId) || isNaN(numUserId) || !safeText) return null;

    const res = await pool.query(
        `UPDATE messages
         SET conteudo = $1, is_edited = TRUE
         WHERE id = $2 AND user_id = $3
         RETURNING id, channel_id, user_id, sender_name AS sender, conteudo AS text, media_url, is_edited, data_envio AS timestamp`,
        [safeText, numMsgId, numUserId]
    );
    return res.rows[0] || null;
}

export async function deleteMessage(messageId: number | string) {
    const numMsgId = typeof messageId === 'number' ? messageId : parseInt(String(messageId), 10);
    if (isNaN(numMsgId)) return null;

    const res = await pool.query(
        `DELETE FROM messages
         WHERE id = $1
         RETURNING id, channel_id, user_id`,
        [numMsgId]
    );
    return res.rows[0] || null;
}

export async function canUserModerateMessage(userId: number | string, messageId: number | string): Promise<boolean> {
    const numUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    const numMsgId = typeof messageId === 'number' ? messageId : parseInt(String(messageId), 10);

    if (isNaN(numUserId) || isNaN(numMsgId)) return false;

    const msg = await getMessageById(numMsgId);
    if (!msg) return false;

    // Se o usuário for o autor da mensagem
    if (msg.user_id === numUserId) return true;

    // Se for canal de servidor, verifica se o usuário é dono ou tem permissão can_delete_messages
    const channelStr = String(msg.channel_id || '');
    const numChannelId = parseInt(channelStr.replace(/^channel_/, ''), 10);

    let serverId: number | null = null;
    let donoId: number | null = null;

    if (!isNaN(numChannelId)) {
        const cRes = await pool.query('SELECT server_id FROM channels WHERE id = $1', [numChannelId]);
        if (cRes.rows.length > 0) serverId = cRes.rows[0].server_id;
    } else {
        const cRes = await pool.query('SELECT server_id FROM channels WHERE nome = $1', [channelStr]);
        if (cRes.rows.length > 0) serverId = cRes.rows[0].server_id;
    }

    if (serverId) {
        const sRes = await pool.query('SELECT dono_id FROM servers WHERE id = $1', [serverId]);
        if (sRes.rows.length > 0) donoId = sRes.rows[0].dono_id;

        if (donoId === numUserId) return true;

        const roles = await getMemberRoles(numUserId, serverId);
        return roles.some(r => r.permissoes?.can_delete_messages || r.permissoes?.can_manage_server);
    }

    return false;
}

// ==========================================
// Hub Social: Sistema de Amigos & DMs (Sprint 3)
// ==========================================

export interface FriendUser {
    id: number;
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
    created_at?: string;
    friendship_id: number;
    status: 'pending' | 'accepted' | 'blocked';
    direction?: 'incoming' | 'outgoing';
    friendship_created_at: string;
}

export async function getFriendships(userId: number | string) {
    const numericId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    if (isNaN(numericId)) return { accepted: [], pending_incoming: [], pending_outgoing: [], blocked: [] };

    const query = `
        SELECT 
            f.id AS friendship_id,
            f.status,
            f.created_at AS friendship_created_at,
            f.user_id_1,
            f.user_id_2,
            u.id AS friend_id,
            u.username,
            u.display_name,
            u.avatar_url,
            u.created_at AS user_created_at
        FROM friendships f
        JOIN users u ON (
            CASE 
                WHEN f.user_id_1 = $1 THEN u.id = f.user_id_2
                ELSE u.id = f.user_id_1
            END
        )
        WHERE f.user_id_1 = $1 OR f.user_id_2 = $1
        ORDER BY f.created_at DESC
    `;

    const res = await pool.query(query, [numericId]);

    const accepted: FriendUser[] = [];
    const pending_incoming: FriendUser[] = [];
    const pending_outgoing: FriendUser[] = [];
    const blocked: FriendUser[] = [];

    for (const row of res.rows) {
        const item: FriendUser = {
            id: row.friend_id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
            created_at: row.user_created_at,
            friendship_id: row.friendship_id,
            status: row.status,
            friendship_created_at: row.friendship_created_at
        };

        if (row.status === 'accepted') {
            accepted.push(item);
        } else if (row.status === 'pending') {
            if (row.user_id_1 === numericId) {
                item.direction = 'outgoing';
                pending_outgoing.push(item);
            } else {
                item.direction = 'incoming';
                pending_incoming.push(item);
            }
        } else if (row.status === 'blocked') {
            blocked.push(item);
        }
    }

    return { accepted, pending_incoming, pending_outgoing, blocked };
}

export async function sendFriendRequest(userId: number | string, targetUsername: string) {
    const numericId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    if (isNaN(numericId)) throw new Error('ID de usuário inválido');

    const cleanUsername = String(targetUsername || '').trim();
    if (!cleanUsername) throw new Error('Nome de usuário obrigatório');

    const targetUser = await findUserByUsername(cleanUsername);
    if (!targetUser) throw new Error(`Usuário "${cleanUsername}" não encontrado`);

    if (targetUser.id === numericId) {
        throw new Error('Você não pode adicionar a si mesmo como amigo');
    }

    // Verifica relacionamento existente em ambas as ordens
    const existing = await pool.query(
        `SELECT id, user_id_1, user_id_2, status 
         FROM friendships 
         WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)
         LIMIT 1`,
        [numericId, targetUser.id]
    );

    if (existing.rows.length > 0) {
        const rel = existing.rows[0];
        if (rel.status === 'accepted') {
            throw new Error(`Você e ${targetUser.username} já são amigos`);
        }
        if (rel.status === 'blocked') {
            throw new Error('Não é possível enviar pedido de amizade para este usuário');
        }
        if (rel.status === 'pending') {
            if (rel.user_id_1 === numericId) {
                throw new Error('Pedido de amizade já enviado anteriormente');
            } else {
                // Se o outro usuário já enviou pedido pendente, auto-aceita!
                const updated = await pool.query(
                    `UPDATE friendships SET status = 'accepted' WHERE id = $1 RETURNING id, status, created_at`,
                    [rel.id]
                );
                return {
                    friendship: updated.rows[0],
                    targetUser: { id: targetUser.id, username: targetUser.username, display_name: targetUser.display_name, avatar_url: targetUser.avatar_url },
                    autoAccepted: true
                };
            }
        }
    }

    const inserted = await pool.query(
        `INSERT INTO friendships (user_id_1, user_id_2, status) 
         VALUES ($1, $2, 'pending') 
         RETURNING id, status, created_at`,
        [numericId, targetUser.id]
    );

    return {
        friendship: inserted.rows[0],
        targetUser: { id: targetUser.id, username: targetUser.username, display_name: targetUser.display_name, avatar_url: targetUser.avatar_url },
        autoAccepted: false
    };
}

export async function respondFriendRequest(userId: number | string, friendshipId: number | string, action: 'accept' | 'decline' | 'block') {
    const numericUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    const numericFriendshipId = typeof friendshipId === 'number' ? friendshipId : parseInt(String(friendshipId), 10);

    if (isNaN(numericUserId) || isNaN(numericFriendshipId)) throw new Error('Parâmetros inválidos');

    const check = await pool.query(
        `SELECT id, user_id_1, user_id_2, status FROM friendships WHERE id = $1 LIMIT 1`,
        [numericFriendshipId]
    );

    if (check.rows.length === 0) {
        throw new Error('Solicitação de amizade não encontrada');
    }

    const rel = check.rows[0];
    if (rel.user_id_1 !== numericUserId && rel.user_id_2 !== numericUserId) {
        throw new Error('Você não tem permissão para responder a esta solicitação');
    }

    if (action === 'accept') {
        const res = await pool.query(
            `UPDATE friendships SET status = 'accepted' WHERE id = $1 RETURNING id, status, created_at`,
            [numericFriendshipId]
        );
        return { success: true, action: 'accepted', friendship: res.rows[0], otherUserId: rel.user_id_1 === numericUserId ? rel.user_id_2 : rel.user_id_1 };
    } else if (action === 'decline') {
        await pool.query(`DELETE FROM friendships WHERE id = $1`, [numericFriendshipId]);
        return { success: true, action: 'declined', otherUserId: rel.user_id_1 === numericUserId ? rel.user_id_2 : rel.user_id_1 };
    } else if (action === 'block') {
        const res = await pool.query(
            `UPDATE friendships SET status = 'blocked' WHERE id = $1 RETURNING id, status, created_at`,
            [numericFriendshipId]
        );
        return { success: true, action: 'blocked', friendship: res.rows[0], otherUserId: rel.user_id_1 === numericUserId ? rel.user_id_2 : rel.user_id_1 };
    } else {
        throw new Error('Ação inválida. Use "accept", "decline" ou "block"');
    }
}

export async function getDirectMessages(user1Id: number | string, user2Id: number | string, limit = 50) {
    const num1 = typeof user1Id === 'number' ? user1Id : parseInt(String(user1Id), 10);
    const num2 = typeof user2Id === 'number' ? user2Id : parseInt(String(user2Id), 10);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    if (isNaN(num1) || isNaN(num2)) return [];

    const res = await pool.query(
        `SELECT 
            dm.id,
            dm.sender_id,
            dm.receiver_id,
            dm.content AS text,
            dm.media_url,
            dm.created_at AS timestamp,
            u.username AS sender_username,
            u.display_name AS sender_display_name,
            u.avatar_url AS sender_avatar_url
         FROM direct_messages dm
         JOIN users u ON u.id = dm.sender_id
         WHERE (dm.sender_id = $1 AND dm.receiver_id = $2)
            OR (dm.sender_id = $2 AND dm.receiver_id = $1)
         ORDER BY dm.created_at ASC
         LIMIT $3`,
        [num1, num2, safeLimit]
    );

    return res.rows;
}

export async function saveDirectMessage(
    senderId: number | string,
    receiverId: number | string,
    content: string,
    mediaUrl?: string | null
) {
    const numSender = typeof senderId === 'number' ? senderId : parseInt(String(senderId), 10);
    const numReceiver = typeof receiverId === 'number' ? receiverId : parseInt(String(receiverId), 10);
    const safeContent = String(content || '').trim();
    const safeMediaUrl = mediaUrl ? String(mediaUrl) : null;

    if (isNaN(numSender) || isNaN(numReceiver)) throw new Error('IDs de remetente ou destinatário inválidos');
    if (!safeContent && !safeMediaUrl) throw new Error('A mensagem deve conter texto ou uma mídia em anexo');

    const res = await pool.query(
        `INSERT INTO direct_messages (sender_id, receiver_id, content, media_url, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, sender_id, receiver_id, content AS text, media_url, created_at AS timestamp`,
        [numSender, numReceiver, safeContent, safeMediaUrl]
    );

    const msg = res.rows[0];
    const sender = await findUserById(numSender);

    return {
        ...msg,
        sender_username: sender?.username || 'Usuário',
        sender_display_name: sender?.display_name || sender?.username || 'Usuário',
        sender_avatar_url: sender?.avatar_url || null
    };
}

/**
 * Valida se um usuário possui acesso a um canal ou sala de servidor.
 * Se o canal pertence a um servidor, verifica se o usuário é membro ou dono desse servidor.
 */
export async function canUserAccessChannel(userId: number | null | undefined, channelIdentifier: string | number): Promise<boolean> {
    if (!userId) return false;
    const channelStr = String(channelIdentifier || '').trim();
    if (!channelStr) return false;

    // Se for sala sandbox pública padrão sem servidor
    if (channelStr === 'sala-publica' || channelStr === 'geral-publico') {
        return true;
    }

    // Tenta identificar se o channelIdentifier é o ID numérico do canal
    const numericChannelId = parseInt(channelStr.replace(/^channel_/, ''), 10);
    
    if (!isNaN(numericChannelId)) {
        const res = await pool.query(
            `SELECT c.server_id, s.dono_id, sm.user_id AS member_id
             FROM channels c
             LEFT JOIN servers s ON c.server_id = s.id
             LEFT JOIN server_members sm ON (c.server_id = sm.server_id AND sm.user_id = $1)
             WHERE c.id = $2`,
            [userId, numericChannelId]
        );

        if (res.rows.length > 0) {
            const row = res.rows[0];
            // Se o canal pertence a um servidor, o usuário DEVE ser o dono ou membro
            if (row.server_id !== null && row.server_id !== undefined) {
                return row.dono_id === userId || row.member_id === userId;
            }
            return true;
        }
    }

    // Se a sala for referenciada pelo nome e pertencer a servidores
    const nameRes = await pool.query(
        `SELECT c.server_id, s.dono_id, sm.user_id AS member_id
         FROM channels c
         LEFT JOIN servers s ON c.server_id = s.id
         LEFT JOIN server_members sm ON (c.server_id = sm.server_id AND sm.user_id = $1)
         WHERE c.nome = $2`,
        [userId, channelStr]
    );

    if (nameRes.rows.length > 0) {
        // Se encontrou canal com esse nome em um servidor
        const allowedInAny = nameRes.rows.some(row => {
            if (!row.server_id) return true;
            return row.dono_id === userId || row.member_id === userId;
        });
        return allowedInAny;
    }

    // Para salas dinâmicas criadas em tempo de execução que não estão no banco (ex: dm_call_X_Y)
    if (channelStr.startsWith('dm_call_')) {
        const parts = channelStr.replace('dm_call_', '').split('_');
        if (parts.length === 2) {
            const u1 = parseInt(parts[0], 10);
            const u2 = parseInt(parts[1], 10);
            return userId === u1 || userId === u2;
        }
    }

    return true;
}

// ==========================================
// Helpers de Convites para Servidores (Server Invites Sprint)
// ==========================================

/**
 * Gera um código alfanumérico único para convite (7 caracteres legíveis).
 */
export function generateInviteCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    const bytes = crypto.randomBytes(7);
    let result = '';
    for (let i = 0; i < 7; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}

/**
 * Cria um convite para o servidor com código único e expiração configurável.
 */
export async function createServerInvite(
    serverId: number,
    createdBy: number,
    expiresInDays = 7,
    maxUses: number | null = null
) {
    let code = generateInviteCode();
    // Tenta até encontrar um código único (caso raríssimo de colisão)
    let attempts = 0;
    while (attempts < 5) {
        const existing = await pool.query('SELECT id FROM server_invites WHERE code = $1 LIMIT 1', [code]);
        if (existing.rows.length === 0) break;
        code = generateInviteCode();
        attempts++;
    }

    const expiresAt = expiresInDays > 0 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    const res = await pool.query(
        `INSERT INTO server_invites (code, server_id, created_by, expires_at, max_uses)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [code, serverId, createdBy, expiresAt, maxUses]
    );

    return res.rows[0];
}

/**
 * Busca um convite pelo código e inclui metadados do servidor e contagem de membros.
 */
export async function getInviteByCode(code: string) {
    const cleanCode = String(code || '').trim();
    if (!cleanCode) return null;

    const res = await pool.query(
        `SELECT 
            si.id AS invite_id,
            si.code,
            si.server_id,
            si.created_by,
            si.expires_at,
            si.max_uses,
            si.uses,
            si.created_at AS invite_created_at,
            s.nome AS server_nome,
            s.icon_url AS server_icon_url,
            s.banner_url AS server_banner_url,
            u.username AS inviter_username,
            u.display_name AS inviter_display_name,
            (SELECT COUNT(*)::int FROM server_members sm WHERE sm.server_id = s.id) AS total_members
         FROM server_invites si
         JOIN servers s ON si.server_id = s.id
         JOIN users u ON si.created_by = u.id
         WHERE si.code = $1
         LIMIT 1`,
        [cleanCode]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];

    // Validação de expiração
    const isExpired = row.expires_at && new Date(row.expires_at).getTime() < Date.now();
    // Validação de limite de uso
    const isMaxUsesReached = row.max_uses !== null && row.uses >= row.max_uses;

    return {
        ...row,
        is_valid: !isExpired && !isMaxUsesReached,
        is_expired: Boolean(isExpired),
        is_max_uses_reached: Boolean(isMaxUsesReached)
    };
}

/**
 * Aceita o convite e insere o usuário no servidor de forma idempotente.
 */
export async function acceptServerInvite(code: string, userId: number) {
    const invite = await getInviteByCode(code);
    if (!invite) {
        throw new Error('Convite não encontrado ou inválido.');
    }

    if (!invite.is_valid) {
        if (invite.is_expired) throw new Error('Este convite expirou.');
        if (invite.is_max_uses_reached) throw new Error('Este convite atingiu o limite máximo de utilizações.');
        throw new Error('Este convite não é mais válido.');
    }

    // 1. Verifica se o usuário já é membro deste servidor
    const checkMember = await pool.query(
        `SELECT user_id FROM server_members WHERE server_id = $1 AND user_id = $2 LIMIT 1`,
        [invite.server_id, userId]
    );

    const isAlreadyMember = checkMember.rows.length > 0;

    if (!isAlreadyMember) {
        // 2. Insere na tabela server_members e atribui cargo @everyone
        await addMemberToServer(userId, invite.server_id);

        // 3. Incrementa o contador de usos do convite
        await pool.query(
            `UPDATE server_invites SET uses = uses + 1 WHERE id = $1`,
            [invite.invite_id]
        );
    }

    // 4. Retorna informações completas do servidor e membro para o front-end
    const serverRes = await pool.query(
        `SELECT id, nome, dono_id, icon_url, banner_url, data_criacao FROM servers WHERE id = $1 LIMIT 1`,
        [invite.server_id]
    );

    return {
        alreadyMember: isAlreadyMember,
        server: serverRes.rows[0]
    };
}

