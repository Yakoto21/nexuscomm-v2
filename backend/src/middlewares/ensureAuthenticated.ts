import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export function ensureAuthenticated(
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

        // Injeta o ID do usuário decodificado no objeto de requisição
        req.userId = decoded.id || decoded.sub;

        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}
