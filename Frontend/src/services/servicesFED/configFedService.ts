// src/services/configFedService.ts

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/config/fed`;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ConfigFed {
    id: number;
    fuente: string;
    fecha: string | null;
    fecha_formateada?: string | null;
}

export interface ConfigFedResponse {
    success: boolean;
    data: ConfigFed[];
    total?: number;
    message?: string;
}

// ── Helper fetch ─────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, {
        headers: { ...authHeader() },
        signal,
    });
    
    if (response.status === 401) throw new Error('Sesión expirada');
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? 'Error del servidor');
    }
    
    return response.json() as Promise<T>;
}

// ── Servicio de Configuración FED ─────────────────────────────────────────────

export const configFedService = {
    /**
     * Obtiene TODAS las fuentes de datos
     */
    getAllFuentes: async (signal?: AbortSignal): Promise<ConfigFedResponse> => {
        try {
            const response = await apiFetch<ConfigFedResponse>(`${BASE}/all`, signal);
            return response;
        } catch (error) {
            console.error('Error al obtener fuentes FED:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    },

    /**
     * Obtiene las fuentes como string para mostrar en el header
     */
    getFuentesHeader: async (signal?: AbortSignal): Promise<string> => {
        try {
            const response = await configFedService.getAllFuentes(signal);
            if (response.success && response.data.length > 0) {
                // Formato: "HISMINSA | CNV | PADRON"
                const fuentes = response.data.map(f => f.fuente).join(' | ');
                return fuentes;
            }
            return 'DBFED2026 | Tabla Config';
        } catch (error) {
            return 'DBFED2026 | Tabla Config';
        }
    },

    /**
     * Obtiene las fuentes con sus fechas para tooltip detallado
     */
    getFuentesConDetalle: async (signal?: AbortSignal): Promise<{ fuente: string; detalle: ConfigFed[] }> => {
        try {
            const response = await configFedService.getAllFuentes(signal);
            if (response.success && response.data.length > 0) {
                const fuentesStr = response.data.map(f => f.fuente).join(' | ');
                return {
                    fuente: fuentesStr,
                    detalle: response.data
                };
            }
            return {
                fuente: 'DBFED2026 | Tabla Config',
                detalle: []
            };
        } catch (error) {
            return {
                fuente: 'DBFED2026 | Tabla Config',
                detalle: []
            };
        }
    }
};