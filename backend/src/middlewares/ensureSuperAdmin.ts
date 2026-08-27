import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../db';

/**
 * Middleware de Segurança: Validação Estrita de Super Admin
 * Valida diretamente no banco de dados se o usuário logado possui is_super_admin === true.
 * Nenhuma checagem hardcoded ou de frontend substitui esta camada de autorização.
 */
export async function ensureSuperAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = Number(req.userId);
        if (!userId || isNaN(userId)) {
            return res.status(401).json({ error: 'Acesso negado: autenticação necessária.' });
        }

        const user = await findUserById(userId);
        if (!user || user.is_super_admin !== true) {
            console.warn(`⛔ [Segurança RBAC] Usuário [${userId}] tentou acessar rota de Super Admin sem privilégios de fundador.`);
            return res.status(403).json({ error: 'Acesso negado: privilégios de Super Admin necessários.' });
        }

        if (user.is_banned === true) {
            return res.status(403).json({ error: 'Sua conta foi banida permanentemente.' });
        }

        return next();
    } catch (err) {
        console.error('Erro no middleware ensureSuperAdmin:', err);
        return res.status(500).json({ error: 'Erro interno ao verificar privilégios de Super Admin.' });
    }
}
