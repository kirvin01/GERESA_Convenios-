// src/services/fedOportunidadModificacionesService.ts

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/oportunidad-modificaciones`;

export interface FiltrosData {
  anios: number[];
  meses: string[];
  redes: string[];
  microredes: { red: string; microred: string }[];
}

export interface SubgrupoOportunidad {
  nombre: string;
  oportuno: number;
  inoportuno: number;
  muy_inoportuno: number;
  total: number;
}

export interface RedOportunidad {
  nombre: string;
  oportuno: number;
  inoportuno: number;
  muy_inoportuno: number;
  total: number;
  subgrupos: SubgrupoOportunidad[];
}

export interface OportunidadData {
  anio: number;
  mes: string;
  tipo: 'oportunidad';
  redes: RedOportunidad[];
  total: {
    oportuno: number;
    inoportuno: number;
    muy_inoportuno: number;
    total: number;
  };
}

export interface SubgrupoModificacion {
  nombre: string;
  sin_modificacion: number;
  aceptable: number;
  destiempo: number;
  total: number;
}

export interface RedModificacion {
  nombre: string;
  sin_modificacion: number;
  aceptable: number;
  destiempo: number;
  total: number;
  subgrupos: SubgrupoModificacion[];
}

export interface ModificacionesData {
  anio: number;
  mes: string;
  tipo: 'modificaciones';
  redes: RedModificacion[];
  total: {
    sin_modificacion: number;
    aceptable: number;
    destiempo: number;
    total: number;
  };
}

export interface ResumenMensual {
  mes: string;
  oportunidad: number;
  modificaciones_aceptables: number;
}

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

export const fedOportunidadModificacionesService = {
  getFiltros: (signal?: AbortSignal) =>
    apiFetch<FiltrosData>(`${BASE}/filtros`, signal),

  getOportunidad: (
    params: { anio: number; mes: string; red?: string; microred?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<OportunidadData>(`${BASE}/oportunidad?${qs}`, signal);
  },

  getModificaciones: (
    params: { anio: number; mes: string; red?: string; microred?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<ModificacionesData>(`${BASE}/modificaciones?${qs}`, signal);
  },

  getResumenMensual: (anio: number, signal?: AbortSignal) =>
    apiFetch<{ data: ResumenMensual[] }>(`${BASE}/resumen-mensual?anio=${anio}`, signal),
};