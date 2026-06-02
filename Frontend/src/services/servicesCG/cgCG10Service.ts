// src/services/cgCG10Service.ts
// Servicio para el reporte Convenio de Gestión CG-10
// Niños 6m–6a11m29d con paquete integrado de atención

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/cg/cg10`;

// ── Tipos base ────────────────────────────────────────────────────────────────

export interface FiltrosCG10 {
  anios:         number[];
  meses:         string[];
  departamentos: string[];
  provincias:    { departamento: string; provincia: string }[];
  redes:         string[];
  microredes:    { red: string; microred: string }[];
  categorias:    string[];
  grupos:        string[];
}

/** Columnas de subindicadores presentes en todas las filas agregadas */
export interface SubindicadoresCols {
  denominador: number;
  numerador:   number;
  avance_pct:  number;
  ho_cumple:   number;  ho_pct: number;
  an_cumple:   number;  an_pct: number;
  fb_cumple:   number;  fb_pct: number;
  pd_cumple:   number;  pd_pct: number;
  as_cumple:   number;  as_pct: number;
}

// ── Organización Territorial ──────────────────────────────────────────────────

export interface ProvinciaRowCG10 extends SubindicadoresCols {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
}

export interface DistritoRowCG10 extends SubindicadoresCols {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  DISTRITO:     string;
}

export interface TablaCompletaCG10 {
  anio:       number;
  mes:        string;
  total:      SubindicadoresCols;
  provincias: ProvinciaRowCG10[];
  distritos:  DistritoRowCG10[];
}

// ── Redes Integradas de Salud ─────────────────────────────────────────────────

export interface RedRowCG10 extends SubindicadoresCols {
  RED: string;
}

export interface MicroredRowCG10 extends SubindicadoresCols {
  RED:      string;
  MICRORED: string;
}

export interface EstablecimientoRowCG10 extends SubindicadoresCols {
  RED:             string;
  MICRORED:        string;
  ESTABLECIMIENTO: string;
}

export interface TablaRedesCG10 {
  anio:             number;
  mes:              string;
  total:            SubindicadoresCols;
  redes:            RedRowCG10[];
  microredes:       MicroredRowCG10[];
  establecimientos: EstablecimientoRowCG10[];
}

// ── Resumen / Tendencia ───────────────────────────────────────────────────────

export interface ResumenRowCG10 extends SubindicadoresCols {
  anio:              number;
  Desc_Mes:          string;
  total_denominador: number;
  total_numerador:   number;
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

export const cgCG10Service = {
  getFiltros: (signal?: AbortSignal) =>
    apiFetch<FiltrosCG10>(`${BASE}/filtros`, signal),

  getTablaCompleta: (
    params: {
      anio:          number;
      mes:           string;
      departamento?: string;
      provincia?:    string;
      red?:          string;
      microred?:     string;
      categoria?:    string;
      grupo?:        string;
    },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<TablaCompletaCG10>(`${BASE}/tabla-completa?${qs}`, signal);
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
      grupo?:        string;
    },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<TablaRedesCG10>(`${BASE}/tabla-redes?${qs}`, signal);
  },

  getResumen: (
    params: { anio?: number; departamento?: string; red?: string; grupo?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<{ data: ResumenRowCG10[] }>(`${BASE}/resumen?${qs}`, signal);
  },

  getSubindicadores: (
    params: { anio: number; mes: string; departamento?: string; red?: string; grupo?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<SubindicadoresCols>(`${BASE}/subindicadores?${qs}`, signal);
  },
};