// src/hooks/useApiFetch.ts
import { useCallback } from 'react';
import { authHeader, logout } from '../services/authService';

/**
 * Hook que provee un fetch autenticado. Si recibe 401,
 * ejecuta onUnauthorized (por lo general, el logout del contexto).
 */
export function useApiFetch(onUnauthorized: () => void) {
    const apiFetch = useCallback(
        async (url: string, options: RequestInit = {}): Promise<Response> => {
            const response = await fetch(url, {
                ...options,
                headers: { ...authHeader(), ...options.headers },
            });
            if (response.status === 401) {
                logout();
                onUnauthorized();
                throw new Error('Sesión expirada');
            }
            return response;
        },
        [onUnauthorized]
    );

    return { apiFetch };
}