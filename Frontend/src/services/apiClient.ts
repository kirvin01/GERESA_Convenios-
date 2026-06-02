import { authHeader } from './authService';

let onUnauthorized: (() => void) | null = null;
const inflight = new Map<string, Promise<unknown>>();

export function setUnauthorizedHandler(fn: () => void) {
    onUnauthorized = fn;
}

function requestKey(url: string, method: string, body?: unknown) {
    return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
}

export async function apiFetch<T>(
    url: string,
    options: RequestInit = {},
    { dedupe = true }: { dedupe?: boolean } = {},
): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();
    const key = requestKey(url, method, options.body);

    if (dedupe && method === 'GET' && inflight.has(key)) {
        return inflight.get(key) as Promise<T>;
    }

    const promise = (async () => {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...authHeader(),
                ...(options.headers as Record<string, string>),
            },
        });

        if (response.status === 401) {
            onUnauthorized?.();
            throw new Error('Sesión expirada');
        }

        if (!response.ok) {
            let message = 'Error del servidor';
            try {
                const err = await response.json();
                message = err?.detail || message;
            } catch {
                // respuesta no JSON
            }
            throw new Error(message);
        }

        return response.json() as Promise<T>;
    })();

    if (dedupe && method === 'GET') {
        inflight.set(key, promise);
        promise.finally(() => inflight.delete(key));
    }

    return promise;
}
