-- Migration 004: Chat Media Attachments (Sprint 4)

-- 1. Adiciona coluna media_url na tabela messages (Canais de Servidor)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
          AND column_name = 'media_url'
    ) THEN
        ALTER TABLE messages ADD COLUMN media_url TEXT DEFAULT NULL;
    END IF;
END $$;

-- 2. Adiciona coluna media_url na tabela direct_messages (Hub Social / DMs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'direct_messages' 
          AND column_name = 'media_url'
    ) THEN
        ALTER TABLE direct_messages ADD COLUMN media_url TEXT DEFAULT NULL;
    END IF;
END $$;
