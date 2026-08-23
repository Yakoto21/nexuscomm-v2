import { Pool } from 'pg';
import dotenv from 'dotenv';

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
                data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
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

        // Criação de índices para buscas rápidas de mensagens por canal e usuários
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
            CREATE INDEX IF NOT EXISTS idx_messages_data_envio ON messages(data_envio);
        `);

        console.log('✅ Tabelas do PostgreSQL (Users, Servers, Channels, Messages) verificadas e sincronizadas com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao conectar ou inicializar tabelas no PostgreSQL:', err);
    }
}

// ==========================================
// Helpers de Banco de Dados
// ==========================================

export async function findUserByUsername(username: string) {
    const res = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
    return res.rows[0] || null;
}

export async function findUserById(id: number) {
    const res = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] || null;
}

export async function createUser(username: string, passwordHash: string) {
    const res = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
        [username, passwordHash]
    );
    return res.rows[0];
}

export async function saveMessage(channelId: string, userId: number | null, senderName: string, conteudo: string) {
    const res = await pool.query(
        `INSERT INTO messages (channel_id, user_id, sender_name, conteudo, data_envio)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, channel_id, user_id, sender_name AS sender, conteudo AS text, data_envio AS timestamp`,
        [channelId, userId, senderName, conteudo]
    );
    return res.rows[0];
}

export async function getMessagesByChannel(channelId: string, limit = 50) {
    const res = await pool.query(
        `SELECT id, channel_id, user_id, sender_name AS sender, conteudo AS text, data_envio AS timestamp
         FROM messages
         WHERE channel_id = $1
         ORDER BY data_envio ASC
         LIMIT $2`,
        [channelId, limit]
    );
    return res.rows;
}
