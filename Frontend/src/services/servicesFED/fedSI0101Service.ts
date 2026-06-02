// src/services/servicesFED/fedSI0101Service.ts
// Servicio para el reporte FED SI-01_01

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/si0101`;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface FiltrosData {
  anios:         number[];
  meses:         string[];
  departamentos: string[];
  provincias:    { departamento: string; provincia: string }[];
  redes:         string[];
  microredes:    { red: string; microred: string }[];
  categorias:    string[];
}

export interface TotalRow {
  denominador: number;
  numerador:   number;
  avance_pct:  number;
}

// ── Organización Territorial ──────────────────────────────────────────────────

export interface ProvinciaRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  denominador:  number;
  numerador:    number;
  avance_pct:   number;
}

export interface DistritoRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  DISTRITO:     string;
  denominador:  number;
  numerador:    number;
  avance_pct:   number;
}

export interface TablaCompletaData {
  anio:       number;
  mes:        string;
  total:      TotalRow;
  provincias: ProvinciaRow[];
  distritos:  DistritoRow[];
}

// ── Redes Integradas de Salud ─────────────────────────────────────────────────

export interface RedRow {
  RED:         string;
  denominador: number;
  numerador:   number;
  avance_pct:  number;
}

export interface MicroredRow {
  RED:         string;
  MICRORED:    string;
  denominador: number;
  numerador:   number;
  avance_pct:  number;
}

export interface EstablecimientoRow {
  RED:             string;
  MICRORED:        string;
  ESTABLECIMIENTO: string;
  denominador:     number;
  numerador:       number;
  avance_pct:      number;
}

export interface TablaRedesData {
  anio:             number;
  mes:              string;
  total:            TotalRow;
  redes:            RedRow[];
  microredes:       MicroredRow[];
  establecimientos: EstablecimientoRow[];
}

// ── Resumen ───────────────────────────────────────────────────────────────────

export interface ResumenRow {
  año:               number;
  MES:               string;
  total_denominador: number;
  total_numerador:   number;
  avance_pct:        number;
}

// ── Helper fetch con auth ─────────────────────────────────────────────────────

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

// ── Métodos del servicio ──────────────────────────────────────────────────────

export const fedSI0101Service = {
  getFiltros: (signal?: AbortSignal) =>
    apiFetch<FiltrosData>(`${BASE}/filtros`, signal),

  getTablaCompleta: (
    params: {
      anio:          number;
      mes:           string;
      departamento?: string;
      provincia?:    string;
      red?:          string;
      microred?:     string;
      categoria?:    string;
    },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<TablaCompletaData>(`${BASE}/tabla-completa?${qs}`, signal);
  },

  getTablaRedes: (
    params: {
      anio:          number;
      mes:           string;
      red?:          string;
      microred?:     string;
      departamento?: string;
      provincia?:    string;
      categoria?:    string;
    },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<TablaRedesData>(`${BASE}/tabla-redes?${qs}`, signal);
  },

  getResumen: (
    params: { anio?: number; departamento?: string; red?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<{ data: ResumenRow[] }>(`${BASE}/resumen?${qs}`, signal);
  },
};