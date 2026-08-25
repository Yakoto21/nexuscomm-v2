import { Request, Response, NextFunction } from 'express';
import { pool, getMemberRoles, RolePermissions } from '../db';

/**
 * Middleware para garantir que o usuário autenticado é membro ou dono do servidor.
 */
export async function ensureServerMember(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = Number(req.userId);
        const serverId = Number(req.params.serverId);

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        if (isNaN(serverId)) {
            return res.status(400).json({ error: 'ID de servidor inválido.' });
        }

        // 1. Verifica se o servidor existe e se o usuário é o dono
        const serverRes = await pool.query('SELECT dono_id FROM servers WHERE id = $1', [serverId]);
        if (serverRes.rows.length === 0) {
            return res.status(404).json({ error: 'Servidor não encontrado.' });
        }

        if (serverRes.rows[0].dono_id === userId) {
            return next();
        }

        // 2. Verifica se o usuário é membro do servidor
        const memberRes = await pool.query(
            'SELECT 1 FROM server_members WHERE user_id = $1 AND server_id = $2',
            [userId, serverId]
        );

        if (memberRes.rows.length === 0) {
            return res.status(403).json({ error: 'Acesso negado: você não é membro deste servidor.' });
        }

        return next();
    } catch (error) {
        console.error('Erro no middleware ensureServerMember:', error);
        return res.status(500).json({ error: 'Erro interno ao validar permissões de servidor.' });
    }
}

/**
 * Middleware de autorização baseada em cargos (RBAC) e posse de servidor.
 */
export function ensureServerPermission(requiredPermission: keyof RolePermissions) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = Number(req.userId);
            const serverId = Number(req.params.serverId);

            if (!userId) {
                return res.status(401).json({ error: 'Usuário não autenticado.' });
            }

            if (isNaN(serverId)) {
                return res.status(400).json({ error: 'ID de servidor inválido.' });
            }

            // 1. Verifica se o servidor existe
            const serverRes = await pool.query('SELECT dono_id FROM servers WHERE id = $1', [serverId]);
            if (serverRes.rows.length === 0) {
                return res.status(404).json({ error: 'Servidor não encontrado.' });
            }

            // O dono do servidor tem permissão irrestrita (Super Admin)
            if (serverRes.rows[0].dono_id === userId) {
                return next();
            }

            // 2. Obtém todos os cargos do usuário neste servidor
            const roles = await getMemberRoles(userId, serverId);
            if (!roles || roles.length === 0) {
                return res.status(403).json({ error: 'Acesso negado: você não possui cargos neste servidor.' });
            }

            // 3. Verifica se qualquer um dos cargos possui a permissão requerida ou permissão geral de gerenciar servidor
            const hasPermission = roles.some((role: any) => {
                const perms = role.permissoes || {};
                return perms[requiredPermission] === true || perms.can_manage_server === true;
            });

            if (!hasPermission) {
                return res.status(403).json({
                    error: `Acesso negado: você não possui a permissão necessária (${requiredPermission}) neste servidor.`
                });
            }

            return next();
        } catch (error) {
            console.error(`Erro no middleware ensureServerPermission (${requiredPermission}):`, error);
            return res.status(500).json({ error: 'Erro interno ao validar permissões de cargo.' });
        }
    };
}
