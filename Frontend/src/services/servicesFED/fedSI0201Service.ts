// src/services/servicesFED/fedSI0201Service.ts
import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/si0201`;

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

export interface ResumenRow {
  año:               number;
  MES:               string;
  total_denominador: number;
  total_numerador:   number;
  avance_pct:        number;
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

export const fedSI0201Service = {
  getFiltros: (signal?: AbortSignal) =>
    apiFetch<FiltrosData>(`${BASE}/filtros`, signal),

  getTablaCompleta: (
    params: {
      anio:          number;
      mes:           string;
      departamento?: string;
      provincia?:    string;
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
    },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<TablaRedesData>(`${BASE}/tabla-redes?${qs}`, signal);
  },

  getResumen: (
    params: {
      anio?:         number;
      departamento?: string;
      red?:          string;
    },
    signal?: AbortSignal,
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return apiFetch<ResumenRow[]>(`${BASE}/resumen?${qs}`, signal);
  },
};