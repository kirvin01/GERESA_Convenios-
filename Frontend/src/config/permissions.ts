import type { AppRole } from '../services/authService';

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
    admin: ['*'],
    fed: ['fed:read', 'pacientes:read'],
    cg: ['cg:read', 'pacientes:read'],
    atenciones: ['pacientes:read'],
    user: ['pacientes:read'],
};

export function getPermissionsForRole(role: AppRole): string[] {
    return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.atenciones;
}

export function hasPermission(role: AppRole | null, permission: string): boolean {
    if (!role) return false;
    const perms = getPermissionsForRole(role);
    if (perms.includes('*')) return true;
    const [module] = permission.split(':');
    return perms.some((p) => p === permission || p === `${module}:*`);
}

export function getDefaultRoute(role: AppRole | null): string {
    if (!role) return '/login';
    if (role === 'admin' || role === 'atenciones' || role === 'user') return '/pacientes';
    if (role === 'fed') return '/reportesFED/fed01';
    if (role === 'cg') return '/reportesCG/cg10';
    return '/pacientes';
}

export const ROUTE_PERMISSIONS: Record<string, string> = {
    '/pacientes': 'pacientes:read',
    '/admin/usuarios': 'admin:users',
    '/reportesFED/fed01': 'fed:read',
    '/reportesFED/fed02': 'fed:read',
    '/reportesFED/fed03': 'fed:read',
    '/reportesFED/fed04': 'fed:read',
    '/reportesFED/fed05': 'fed:read',
    '/reportesFED/fed06': 'fed:read',
    '/reportesFED/fed07': 'fed:read',
    '/reportesFED/fed08': 'fed:read',
    '/reportesFED/fed09': 'fed:read',
    '/reportesFED/fed10': 'fed:read',
    '/reportesFED/fed11': 'fed:read',
    '/reportesFED/fed12': 'fed:read',
    '/reportesFED/fed13': 'fed:read',
    '/reportesFED/fed14': 'fed:read',
    '/reportesFED/fed015': 'fed:read',
    '/reportesFED/fed016': 'fed:read',
    '/reportesCG/cg10': 'cg:read',
    '/reportesCG/cg11': 'cg:read',
};
