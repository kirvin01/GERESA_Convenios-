// src/services/hisDiarioService.ts
// Servicio para el reporte de Variación Diaria Atención vs Registro HIS

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/his-diario`;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface FiltrosHIS {
  meses:            string[];
  redes:            string[];
  microredes:       { red: string; microred: string }[];
  establecimientos: { red: string; microred: string; establecimiento: string }[];
  sistemas:         string[];
  unidades:         string[];
}

export interface DiaRow {
  DIA:                   number;
  total_atenciones:      number;
  registrados_mismo_dia: number;
}

export interface GraficoData {
  mes:          string;
  tipo_metrica: string;
  data:         DiaRow[];
}

export interface MesRow {
  MES:                   string;
  NRO_MES:               number;
  total_atenciones:      number;
  registrados_mismo_dia: number;
  pct_oportunos:         number;
}

export interface SistemaRow {
  SISTEMA:               string;
  total_atenciones:      number;
  registrados_mismo_dia: number;
  pct_oportunos:         number;
}

export interface RedRow {
  DESC_RED:              string;
  total_atenciones:      number;
  registrados_mismo_dia: number;
  pct_oportunos:         number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers: { ...authHeader() }, signal });
  if (response.status === 401) throw new Error('Sesión expirada');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Error del servidor');
  }
  return response.json() as Promise<T>;
}

// ── Métodos ───────────────────────────────────────────────────────────────────

export const hisDiarioService = {
  getFiltros: (signal?: AbortSignal) =>
    apiFetch<FiltrosHIS>(`${BASE}/filtros`, signal),

  getGrafico: (
    params: {
      mes:              string;
      red?:             string;
      microred?:        string;
      establecimiento?: string;
      sistema?:         string;
      unidad?:          string;
      tipo_metrica?:    string;
    },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<GraficoData>(`${BASE}/grafico?${qs}`, signal);
  },

  getResumenMes: (
    params: { red?: string; microred?: string; establecimiento?: string; sistema?: string; tipo_metrica?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<{ data: MesRow[] }>(`${BASE}/resumen-mes?${qs}`, signal);
  },

  getPorSistema: (
    params: { mes: string; red?: string; microred?: string; establecimiento?: string; tipo_metrica?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<{ mes: string; data: SistemaRow[] }>(`${BASE}/por-sistema?${qs}`, signal);
  },

  getPorRed: (
    params: { mes: string; sistema?: string; tipo_metrica?: string },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<{ mes: string; data: RedRow[] }>(`${BASE}/por-red?${qs}`, signal);
  },
};