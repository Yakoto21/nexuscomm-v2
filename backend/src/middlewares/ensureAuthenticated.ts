import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../db';

// Estendendo a interface Request do Express para incluir userId
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

interface IPayload {
    id?: string;
    sub?: string;
}

export async function ensureAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    // Verifica se o cabeçalho Authorization foi enviado
    if (!authHeader) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    // O header vem no formato "Bearer <token>"
    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({ error: 'Token mal formatado.' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não configurado nas variáveis de ambiente.');
            return res.status(500).json({ error: 'Erro de configuração no servidor de autenticação.' });
        }
        
        // Valida e decodifica o token JWT
        const decoded = jwt.verify(token, jwtSecret) as IPayload;
        const rawUserId = decoded.id || decoded.sub;

        if (!rawUserId) {
            return res.status(401).json({ error: 'Token inválido: identificador de usuário ausente.' });
        }

        const numericUserId = Number(rawUserId);
        if (isNaN(numericUserId)) {
            return res.status(401).json({ error: 'Token inválido: ID de usuário incorreto.' });
        }

        // Validação em tempo real no banco de dados para revogação imediata de contas banidas ou inexistentes
        const user = await findUserById(numericUserId);
        if (!user) {
            return res.status(401).json({ error: 'Usuário associado a este token não foi encontrado.' });
        }

        if (user.is_banned === true) {
            return res.status(403).json({ error: 'Sua conta foi suspensa ou banida permanentemente por um administrador.' });
        }

        // Injeta o ID do usuário decodificado no objeto de requisição
        req.userId = String(numericUserId);

        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}
