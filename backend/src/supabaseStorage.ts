import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// 1. Extração e sanitização da URL do Supabase
let supabaseUrl = process.env.SUPABASE_URL || '';
if (!supabaseUrl && process.env.DATABASE_URL) {
    const match = process.env.DATABASE_URL.match(/postgres\.([a-z0-9]+):/i);
    if (match && match[1]) {
        supabaseUrl = `https://${match[1]}.supabase.co`;
    }
}

// Sanitiza URL: remove espaços e barras finais duplicadas
if (supabaseUrl) {
    supabaseUrl = supabaseUrl.trim().replace(/\/+$/, '');
}

// 2. Extração da chave com prioridade estrita para permissões administrativas (service_role no backend)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabaseKey = (serviceRoleKey || anonKey || '').trim();
const keyType = serviceRoleKey ? 'service_role' : (anonKey ? 'anon_key' : 'none');

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
    try {
        const maskedKey = supabaseKey.length > 12 ? `${supabaseKey.substring(0, 12)}...` : '***';
        console.log(`🔌 [Supabase Storage] Inicializando cliente... URL: [${supabaseUrl}] | Chave: [${keyType}] (${maskedKey})`);
        
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        
        console.log(`📦 [Supabase Storage] Cliente Supabase inicializado com sucesso para: ${supabaseUrl}`);

        if (!serviceRoleKey) {
            console.warn('⚠️ [Supabase Storage] ATENÇÃO: Nenhuma SUPABASE_SERVICE_ROLE_KEY foi configurada no backend. Operações de Storage podem ser bloqueadas por RLS (Row Level Security).');
        }
    } catch (err: any) {
        console.error('❌ [Supabase Storage] Falha crítica ao instanciar cliente Supabase:', {
            message: err?.message,
            name: err?.name,
            code: err?.code,
            cause: err?.cause,
            stack: err?.stack
        });
    }
} else {
    console.warn(`⚠️ [Supabase Storage] Cliente não inicializado! SUPABASE_URL: [${supabaseUrl || 'NÃO DEFINIDA'}], SUPABASE_KEY: [${supabaseKey ? 'DEFINIDA' : 'NÃO DEFINIDA'}]`);
}

export const BUCKET_NAME = 'server_media';
export const USER_AVATARS_BUCKET = 'user_avatars';
export const CHAT_MEDIA_BUCKET = 'chat_media';

/**
 * Inicializa e garante que os buckets públicos 'server_media', 'user_avatars' e 'chat_media' existam no Supabase Storage
 */
export async function initSupabaseBucket() {
    if (!supabase) {
        console.warn('⚠️ [Supabase Storage] Inicialização de buckets ignorada: cliente Supabase não está configurado.');
        return;
    }

    console.log('🔄 [Supabase Storage] Verificando existência de buckets...');

    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('❌ [Supabase Storage] Erro ao listar buckets:', {
                message: error.message,
                name: error.name,
                cause: (error as any).cause,
                details: error
            });
            return;
        }

        const bucketNames = buckets?.map(b => b.name) || [];
        console.log(`📋 [Supabase Storage] Buckets existentes no Supabase: [${bucketNames.join(', ')}]`);

        const requiredBuckets = [BUCKET_NAME, USER_AVATARS_BUCKET, CHAT_MEDIA_BUCKET];

        for (const bName of requiredBuckets) {
            const bucketExists = buckets?.some(b => b.name === bName);
            if (!bucketExists) {
                console.log(`⚙️ [Supabase Storage] Criando bucket público [${bName}]...`);
                const { data: createData, error: createError } = await supabase.storage.createBucket(bName, {
                    public: true,
                    fileSizeLimit: 10485760 // 10MB
                });

                if (createError) {
                    console.error(`❌ [Supabase Storage] Erro ao criar bucket [${bName}]:`, {
                        message: createError.message,
                        name: createError.name,
                        cause: (createError as any).cause,
                        details: createError
                    });
                } else {
                    console.log(`🎉 [Supabase Storage] Bucket público [${bName}] criado com sucesso!`, createData);
                }
            } else {
                console.log(`✅ [Supabase Storage] Bucket público [${bName}] verificado e pronto.`);
            }
        }
    } catch (err: any) {
        console.error('❌ [Supabase Storage] Exceção capturada ao verificar/criar buckets:', {
            message: err?.message,
            name: err?.name,
            code: err?.code,
            cause: err?.cause,
            stack: err?.stack
        });
    }
}

// 🔒 SEC-07: Whitelist estrita de tipos MIME de imagem para prevenir Stored XSS
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validação rigorosa de Magic Bytes para assegurar integridade binária do arquivo
 * Impede que scripts maliciosos ou SVGs sejam mascarados com extensões de imagem.
 */
export function detectImageMagicBytes(buffer: Buffer): { mimeType: string; ext: string } | null {
    if (!buffer || buffer.length < 12) return null;

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return { mimeType: 'image/png', ext: 'png' };
    }

    // JPEG / JPG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { mimeType: 'image/jpeg', ext: 'jpg' };
    }

    // GIF: GIF87a ou GIF89a (47 49 46 38)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return { mimeType: 'image/gif', ext: 'gif' };
    }

    // WEBP: RIFF (bytes 0-3) e WEBP (bytes 8-11)
    if (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
        return { mimeType: 'image/webp', ext: 'webp' };
    }

    return null;
}

/**
 * Valida se uma string é uma URL HTTP/HTTPS segura, bloqueando esquemas maliciosos como javascript: ou data:
 */
export function isSafeHttpUrl(urlString: string): boolean {
    try {
        const parsed = new URL(urlString);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Valida estritamente os cabeçalhos Base64 e a assinatura binária de imagem
 */
function parseAndValidateBase64Image(base64Data: string): { mimeType: string; ext: string; buffer: Buffer } {
    const matches = base64Data.match(/^data:([a-zA-Z0-9-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Formato Base64 inválido. O anexo deve seguir o padrão data:image/...;base64,...');
    }

    const declaredMime = matches[1].toLowerCase().trim();
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(declaredMime)) {
        throw new Error('Tipo de arquivo não permitido. Apenas imagens seguras (JPG, PNG, WEBP e GIF) são aceitas.');
    }

    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
        throw new Error('O arquivo excede o limite máximo permitido de 10MB.');
    }

    const magic = detectImageMagicBytes(buffer);
    if (!magic) {
        throw new Error('Assinatura de arquivo inválida. O conteúdo não corresponde a uma imagem autêntica suportada.');
    }

    return { mimeType: magic.mimeType, ext: magic.ext, buffer };
}

/**
 * Realiza o upload direto de um arquivo para um bucket do Supabase Storage sem fallback local silencioso
 */
async function uploadToBucket(
    bucketName: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    if (!supabase) {
        throw new Error('Supabase Storage não está inicializado. Verifique as credenciais SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend.');
    }

    try {
        console.log(`📤 [Supabase Storage] Enviando arquivo [${fileName}] para o bucket [${bucketName}] (${buffer.byteLength} bytes)...`);
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: true
            });

        if (error) {
            console.error(`❌ [Supabase Storage] Erro no upload para [${bucketName}/${fileName}]:`, {
                message: error.message,
                name: error.name,
                details: error
            });
            throw new Error(`Falha no upload do Supabase Storage (${bucketName}): ${error.message}`);
        }

        if (!data) {
            throw new Error(`Falha no upload do Supabase Storage (${bucketName}): Nenhum dado retornado.`);
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error(`Falha ao obter URL pública para o arquivo [${bucketName}/${fileName}].`);
        }

        console.log(`☁️ [Supabase Storage] Upload concluído com sucesso para [${bucketName}/${fileName}]: ${publicUrlData.publicUrl}`);
        return publicUrlData.publicUrl;
    } catch (err: any) {
        console.error(`❌ [Supabase Storage] Exceção durante upload para [${bucketName}/${fileName}]:`, {
            message: err?.message,
            name: err?.name,
            code: err?.code,
            cause: err?.cause,
            stack: err?.stack,
            error: err
        });
        throw (err instanceof Error ? err : new Error(`Falha na comunicação com o Supabase Storage: ${String(err)}`));
    }
}

/**
 * Faz upload de imagem de servidor (Ícone ou Banner) com nome de alta entropia (UUID)
 */
export async function uploadServerMediaFile(
    serverId: number | string,
    fileType: 'icon' | 'banner',
    base64DataOrUrl: string
): Promise<string> {
    if (!base64DataOrUrl) return '';

    // Se já for uma URL HTTP válida, retorna direto evitando esquemas inseguros
    if (isSafeHttpUrl(base64DataOrUrl)) {
        return base64DataOrUrl;
    }

    const { mimeType, ext, buffer } = parseAndValidateBase64Image(base64DataOrUrl);
    const uniqueId = crypto.randomUUID();
    const fileName = `${fileType}s/${serverId}_${uniqueId}.${ext}`;

    return await uploadToBucket(BUCKET_NAME, fileName, buffer, mimeType);
}

/**
 * Faz upload de avatar pessoal de usuário com nome aleatório não enumerável
 */
export async function uploadUserAvatar(
    userId: number | string,
    base64DataOrUrl: string
): Promise<string> {
    if (!base64DataOrUrl) return '';

    if (isSafeHttpUrl(base64DataOrUrl)) {
        return base64DataOrUrl;
    }

    const { mimeType, ext, buffer } = parseAndValidateBase64Image(base64DataOrUrl);
    const uniqueId = crypto.randomUUID();
    const fileName = `avatar_${userId}_${uniqueId}.${ext}`;

    return await uploadToBucket(USER_AVATARS_BUCKET, fileName, buffer, mimeType);
}

/**
 * Faz upload de anexo de imagem de chat com UUID único contra enumeração
 */
export async function uploadChatMediaFile(
    _originalFileName: string,
    base64DataOrUrl: string
): Promise<string> {
    if (!base64DataOrUrl) return '';

    if (isSafeHttpUrl(base64DataOrUrl)) {
        return base64DataOrUrl;
    }

    const { mimeType, ext, buffer } = parseAndValidateBase64Image(base64DataOrUrl);
    const uniqueId = crypto.randomUUID();
    const fileName = `chat_${uniqueId}.${ext}`;

    return await uploadToBucket(CHAT_MEDIA_BUCKET, fileName, buffer, mimeType);
}

/**
 * Faz upload direto de Buffer de imagem (Multer) com validação de Magic Bytes e UUID aleatório
 */
export async function uploadChatMediaBuffer(
    _originalFileName: string,
    buffer: Buffer,
    _mimeType: string
): Promise<string> {
    if (!buffer || buffer.length === 0) {
        throw new Error('Buffer de imagem vazio ou inválido.');
    }

    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
        throw new Error('O arquivo excede o limite máximo permitido de 10MB.');
    }

    const magic = detectImageMagicBytes(buffer);
    if (!magic) {
        throw new Error('Assinatura binária de arquivo inválida. O arquivo enviado não é uma imagem segura suportada.');
    }

    const uniqueId = crypto.randomUUID();
    const fileName = `chat_${uniqueId}.${magic.ext}`;

    return await uploadToBucket(CHAT_MEDIA_BUCKET, fileName, buffer, magic.mimeType);
}

