// src/services/servicesFED/fedSI0102Service.ts
// Servicio para el reporte FED SI-01_02 — Anemia en gestantes (seguimiento Hb + tratamiento)

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/si0102`;

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

/** Columnas base presentes en todos los niveles de agregación */
export interface AnemiaRow {
  denominador:                  number;
  numerador:                    number;
  avance_pct:                   number;
  denominador_apn:              number;
  denominador_apn_hb1:          number;
  denominador_apn_hb1_Dx:       number;
  denominador_apn_Hb1_Dx_trat1: number;
  numerador_Hb2:                number;
  numerador_trat2:              number;
  numerador_Hb2_Trat2:          number;
  numerador_Hb3:                number;
  numerador_trat3:              number;
  numerador_Hb3_Trat3:          number;
  numerador_trat4:              number;
  numerador_Hb3_Trat4:          number;
}

// ── Organización Territorial ──────────────────────────────────────────────────

export interface ProvinciaRow extends AnemiaRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
}

export interface DistritoRow extends AnemiaRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  DISTRITO:     string;
}

export interface TablaCompletaData {
  anio:       number;
  mes:        string;
  total:      AnemiaRow;
  provincias: ProvinciaRow[];
  distritos:  DistritoRow[];
}

// ── Redes Integradas de Salud ─────────────────────────────────────────────────

export interface RedRow extends AnemiaRow {
  RED: string;
}

export interface MicroredRow extends AnemiaRow {
  RED:      string;
  MICRORED: string;
}

export interface EstablecimientoRow extends AnemiaRow {
  RED:             string;
  MICRORED:        string;
  ESTABLECIMIENTO: string;
}

export interface TablaRedesData {
  anio:             number;
  mes:              string;
  total:            AnemiaRow;
  redes:            RedRow[];
  microredes:       MicroredRow[];
  establecimientos: EstablecimientoRow[];
}

// ── Resumen ───────────────────────────────────────────────────────────────────

export interface ResumenRow {
  año:                    number;
  MES:                    string;
  total_denominador:      number;
  total_numerador:        number;
  avance_pct:             number;
  total_apn:              number;
  total_apn_hb1:          number;
  total_apn_hb1_Dx:       number;
  total_apn_Hb1_Dx_trat1: number;
  total_Hb2:              number;
  total_Hb2_Trat2:        number;
  total_Hb3:              number;
  total_Hb3_Trat3:        number;
  total_Hb3_Trat4:        number;
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

export const fedSI0102Service = {
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