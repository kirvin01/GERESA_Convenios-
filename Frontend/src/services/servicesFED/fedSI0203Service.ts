// src/services/servicesFED/fedSI0203Service.ts
// Servicio para el reporte FED SI-02_03 — Suplementación con Hierro y Dosaje de Hemoglobina

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/si0203`;

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

/** Columnas métricas comunes a todos los niveles de agrupación */
export interface HbRow {
  denominador:        number;
  numerador:          number;
  avance_pct:         number;
  num_Hb6m:           number;
  num_Hb6m_Dx:        number;
  num_Hierro_Trat1:   number;
  num_Hierro_Trat2:   number;
  num_Hierro_Trat3:   number;
  num_Hb7m:           number;
  num_Hb8m:           number;
  num_Hb9m:           number;
  num_Hb12m:          number;
}

// ── Organización Territorial ──────────────────────────────────────────────────

export interface ProvinciaRow extends HbRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
}

export interface DistritoRow extends HbRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  DISTRITO:     string;
}

export interface TablaCompletaData {
  anio:       number;
  mes:        string;
  total:      HbRow;
  provincias: ProvinciaRow[];
  distritos:  DistritoRow[];
}

// ── Redes Integradas de Salud ─────────────────────────────────────────────────

export interface RedRow extends HbRow {
  RED: string;
}

export interface MicroredRow extends HbRow {
  RED:      string;
  MICRORED: string;
}

export interface EstablecimientoRow extends HbRow {
  RED:             string;
  MICRORED:        string;
  ESTABLECIMIENTO: string;
}

export interface TablaRedesData {
  anio:             number;
  mes:              string;
  total:            HbRow;
  redes:            RedRow[];
  microredes:       MicroredRow[];
  establecimientos: EstablecimientoRow[];
}

// ── Resumen ───────────────────────────────────────────────────────────────────

export interface ResumenRow {
  año:                 number;
  MES:                 string;
  total_denominador:   number;
  total_numerador:     number;
  avance_pct:          number;
  total_Hb6m:          number;
  total_Hb6m_Dx:       number;
  total_Hierro_Trat1:  number;
  total_Hierro_Trat2:  number;
  total_Hierro_Trat3:  number;
  total_Hb7m:          number;
  total_Hb8m:          number;
  total_Hb9m:          number;
  total_Hb12m:         number;
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

export const fedSI0203Service = {

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