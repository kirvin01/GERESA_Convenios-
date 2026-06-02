// src/services/fedMC0201Service.ts
// Servicio para el reporte FED MC-02_01 — Vacunación en niños (CNV)

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/mc0201`;

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

export interface VacRow {
  denominador:            number;
  numerador:              number;
  avance_pct:             number;
  num_vac_antineumococica: number;
  num_vac_antipolio:      number;
  num_vac_pentavalente:   number;
  num_vac_rotavirus:      number;
  num_esq4M:              number;
  num_esq6M:              number;
  num_dosaje_Hb:          number;
}

// ── Organización Territorial ──────────────────────────────────────────────────

export interface ProvinciaRow extends VacRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
}

export interface DistritoRow extends VacRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  DISTRITO:     string;
}

export interface TablaCompletaData {
  anio:       number;
  mes:        string;
  total:      VacRow;
  provincias: ProvinciaRow[];
  distritos:  DistritoRow[];
}

// ── Redes Integradas de Salud ─────────────────────────────────────────────────

export interface RedRow extends VacRow {
  RED: string;
}

export interface MicroredRow extends VacRow {
  RED:     string;
  MICRORED: string;
}

export interface EstablecimientoRow extends VacRow {
  RED:             string;
  MICRORED:        string;
  ESTABLECIMIENTO: string;
}

export interface TablaRedesData {
  anio:             number;
  mes:              string;
  total:            VacRow;
  redes:            RedRow[];
  microredes:       MicroredRow[];
  establecimientos: EstablecimientoRow[];
}

// ── Resumen ───────────────────────────────────────────────────────────────────

export interface ResumenRow {
  año:                   number;
  MES:                   string;
  total_denominador:     number;
  total_numerador:       number;
  avance_pct:            number;
  total_antineumococica: number;
  total_antipolio:       number;
  total_pentavalente:    number;
  total_rotavirus:       number;
  total_esq4M:           number;
  total_esq6M:           number;
  total_dosaje_Hb:       number;
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

export const fedMC0201Service = {
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