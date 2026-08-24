-- ==========================================================
-- SPRINT 3: HUB SOCIAL (Parte 1) - Sistema de Amigos & DMs
-- ==========================================================

-- 1. Tabela de Amizades (Friendships)
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id_1 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_users CHECK (user_id_1 <> user_id_2),
    CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2)
);

-- Índices de performance para busca rápida de amigos e status
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- 2. Tabela de Mensagens Diretas (Direct Messages)
CREATE TABLE IF NOT EXISTS direct_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de performance para consultas de histórico e ordenação cronológica
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at ON direct_messages(created_at);

-- 3. Habilitação de Segurança em Nível de Linha (Row Level Security - RLS)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Política de RLS para Friendships (leitura e escrita restrita aos usuários envolvidos)
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
END $$;

-- Política de RLS para Direct Messages (leitura para ambos, inserção restrita ao remetente)
DO $$
BEGIN
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
