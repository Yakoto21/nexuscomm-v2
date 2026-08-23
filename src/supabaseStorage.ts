import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Extrai URL do Supabase do .env ou do DATABASE_URL se disponível
let supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl && process.env.DATABASE_URL) {
    const match = process.env.DATABASE_URL.match(/postgres\.([a-z0-9]+):/i);
    if (match && match[1]) {
        supabaseUrl = `https://${match[1]}.supabase.co`;
    }
}

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SERVICE_KEY || 
                    process.env.SUPABASE_ANON_KEY || 
                    process.env.SUPABASE_KEY || 
                    '';

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log(`📦 Supabase Storage inicializado para: ${supabaseUrl}`);
    } catch (err) {
        console.warn('⚠️ Não foi possível inicializar o cliente Supabase:', err);
    }
}

const BUCKET_NAME = 'server_media';
const USER_AVATARS_BUCKET = 'user_avatars';

// Garante pastas locais para fallback seguro se os buckets não estiverem acessíveis
const localUploadsDir = path.join(__dirname, '../public/uploads/server_media');
const localUserAvatarsDir = path.join(__dirname, '../public/uploads/user_avatars');

[localUploadsDir, localUserAvatarsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch (e) {
            // Silêncio
        }
    }
});

/**
 * Inicializa e garante que os buckets públicos 'server_media' e 'user_avatars' existam no Supabase Storage
 */
export async function initSupabaseBucket() {
    if (!supabase) {
        console.log('ℹ️ Supabase Storage operando em modo híbrido (URL / Storage local fallback).');
        return;
    }

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.warn('⚠️ Aviso ao listar buckets do Supabase Storage:', error.message);
            return;
        }

        const requiredBuckets = [BUCKET_NAME, USER_AVATARS_BUCKET];

        for (const bName of requiredBuckets) {
            const bucketExists = buckets?.some(b => b.name === bName);
            if (!bucketExists) {
                const { error: createError } = await supabase.storage.createBucket(bName, {
                    public: true,
                    fileSizeLimit: 10485760 // 10MB
                });

                if (createError) {
                    console.warn(`⚠️ Não foi possível criar bucket [${bName}] automaticamente no Supabase:`, createError.message);
                } else {
                    console.log(`🎉 Bucket público [${bName}] criado com sucesso no Supabase Storage!`);
                }
            } else {
                console.log(`✅ Bucket público [${bName}] verificado no Supabase Storage.`);
            }
        }
    } catch (err) {
        console.warn('⚠️ Erro ao verificar buckets no Supabase:', err);
    }
}

/**
 * Faz upload de imagem (Base64 ou Buffer) para o Supabase Storage ou armazena localmente
 */
export async function uploadServerMediaFile(
    serverId: number | string,
    fileType: 'icon' | 'banner',
    base64DataOrUrl: string
): Promise<string> {
    if (!base64DataOrUrl) return '';

    // Se já for uma URL HTTP válida (não base64), retorna direto
    if (base64DataOrUrl.startsWith('http://') || base64DataOrUrl.startsWith('https://')) {
        return base64DataOrUrl;
    }

    // Processa Base64
    const matches = base64DataOrUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/png';
    let buffer: Buffer;

    if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
    } else {
        // Se for string base64 pura
        buffer = Buffer.from(base64DataOrUrl, 'base64');
    }

    const ext = mimeType.split('/')[1] || 'png';
    const fileName = `${fileType}s/${serverId}_${Date.now()}.${ext}`;

    // 1. Tenta upload direto para o Supabase Storage
    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, buffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (!error && data) {
                const { data: publicUrlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(fileName);

                if (publicUrlData && publicUrlData.publicUrl) {
                    console.log(`☁️ [Supabase Storage] Upload concluído para ${fileName}: ${publicUrlData.publicUrl}`);
                    return publicUrlData.publicUrl;
                }
            } else if (error) {
                console.warn(`⚠️ Erro no upload do Supabase Storage (${error.message}). Utilizando fallback...`);
            }
        } catch (err) {
            console.warn('⚠️ Falha ao tentar upload no Supabase:', err);
        }
    }

    // 2. Fallback: Salva na pasta pública estática
    try {
        const localFileName = `${fileType}_${serverId}_${Date.now()}.${ext}`;
        const localFilePath = path.join(localUploadsDir, localFileName);
        fs.writeFileSync(localFilePath, buffer);
        const localPublicUrl = `/uploads/server_media/${localFileName}`;
        console.log(`💾 [Local Media Storage] Arquivo salvo em: ${localPublicUrl}`);
        return localPublicUrl;
    } catch (localErr) {
        console.warn('⚠️ Erro no armazenamento local, retornando Data URI como fallback:', localErr);
        return base64DataOrUrl;
    }
}

/**
 * Faz upload de avatar pessoal de usuário para o bucket 'user_avatars' no Supabase Storage
 */
export async function uploadUserAvatar(
    userId: number | string,
    base64DataOrUrl: string
): Promise<string> {
    if (!base64DataOrUrl) return '';

    // Se já for uma URL HTTP válida (não base64), retorna direto
    if (base64DataOrUrl.startsWith('http://') || base64DataOrUrl.startsWith('https://')) {
        return base64DataOrUrl;
    }

    // Processa Base64
    const matches = base64DataOrUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/png';
    let buffer: Buffer;

    if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
    } else {
        buffer = Buffer.from(base64DataOrUrl, 'base64');
    }

    const ext = mimeType.split('/')[1] || 'png';
    const fileName = `avatar_${userId}_${Date.now()}.${ext}`;

    // 1. Tenta upload direto para o bucket user_avatars do Supabase Storage
    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(USER_AVATARS_BUCKET)
                .upload(fileName, buffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (!error && data) {
                const { data: publicUrlData } = supabase.storage
                    .from(USER_AVATARS_BUCKET)
                    .getPublicUrl(fileName);

                if (publicUrlData && publicUrlData.publicUrl) {
                    console.log(`☁️ [Supabase user_avatars] Upload concluído para ${fileName}: ${publicUrlData.publicUrl}`);
                    return publicUrlData.publicUrl;
                }
            } else if (error) {
                console.warn(`⚠️ Erro no upload user_avatars no Supabase (${error.message}). Utilizando fallback...`);
            }
        } catch (err) {
            console.warn('⚠️ Falha ao tentar upload de avatar no Supabase:', err);
        }
    }

    // 2. Fallback: Salva na pasta pública estática local
    try {
        const localFilePath = path.join(localUserAvatarsDir, fileName);
        fs.writeFileSync(localFilePath, buffer);
        const localPublicUrl = `/uploads/user_avatars/${fileName}`;
        console.log(`💾 [Local User Avatar Storage] Arquivo salvo em: ${localPublicUrl}`);
        return localPublicUrl;
    } catch (localErr) {
        console.warn('⚠️ Erro no armazenamento local de avatar, retornando Data URI:', localErr);
        return base64DataOrUrl;
    }
}
