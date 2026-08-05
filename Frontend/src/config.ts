// src/config.ts
// VITE_API_URL     -> URL base del servidor (sin /api al final)
// VITE_CON_PREFIJO -> SI = agrega /api (proxy inverso), NO = acceso directo al puerto 8000

function conPrefijoApi(): boolean {
    const value = import.meta.env.VITE_CON_PREFIJO?.trim().toUpperCase();
    return value === 'SI' || value === 'S' || value === 'TRUE' || value === '1' || value === 'YES';
}

function resolveBaseUrl(): string {
    let url = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') ?? '';
    if (!url) return '';
    // Produccion: si la pagina se sirve por HTTPS, forzar API por HTTPS (evita mixed content)
    if (
        import.meta.env.PROD &&
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        url.startsWith('http://')
    ) {
        url = url.replace(/^http:\/\//, 'https://');
    }
    return conPrefijoApi() ? `${url}/api` : url;
}

export const API_CONFIG = {
    baseURL: resolveBaseUrl(),
};
