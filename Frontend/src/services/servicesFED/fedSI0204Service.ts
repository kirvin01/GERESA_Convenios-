// src/services/servicesFED/fedSI0204Service.ts
// Servicio para el reporte FED SI-02_04
// Niños 6-11 meses con diagnóstico de anemia + tratamiento (SfPo / Multi) y seguimiento Hb

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/si0204`;

// ── Tipos base compartidos ────────────────────────────────────────────────────

export interface FiltrosData {
  anios:         number[];
  meses:         string[];
  departamentos: string[];
  provincias:    { departamento: string; provincia: string }[];
  redes:         string[];
  microredes:    { red: string; microred: string }[];
  categorias:    string[];
}

// Métricas de indicadores específicos SI-02_04
export interface MetricasSI0204 {
  num_supl_inicio:      number;
  num_supl_continuacion: number;
  num_Hb9m:             number;
  num_Hb12m:            number;
  num_SfPo1:            number;
  num_SfPo2:            number;
  num_Multi1:           number;
  num_Multi2:           number;
  num_Multi3:           number;
  num_Multi4:           number;
  num_Multi5:           number;
  num_Multi6:           number;
  num_multi1_SfPo2:     number;
  num_SfPo1_multi2:     number;
  num_Hb9m_SfPo1:       number;
  num_Hb12m_SfPo1:      number;
  num_Hb9m_multi1:      number;
  num_Hb12m_multi1:     number;
}

export interface TotalRow extends MetricasSI0204 {
  denominador: number;
  numerador:   number;
  avance_pct:  number;
}

// ── Organización Territorial ──────────────────────────────────────────────────

export interface ProvinciaRow extends MetricasSI0204 {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  denominador:  number;
  numerador:    number;
  avance_pct:   number;
}

export interface DistritoRow extends MetricasSI0204 {
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

export interface RedRow extends MetricasSI0204 {
  RED:         string;
  denominador: number;
  numerador:   number;
  avance_pct:  number;
}

export interface MicroredRow extends MetricasSI0204 {
  RED:         string;
  MICRORED:    string;
  denominador: number;
  numerador:   number;
  avance_pct:  number;
}

export interface EstablecimientoRow extends MetricasSI0204 {
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
  año:                  number;
  MES:                  string;
  total_denominador:    number;
  total_numerador:      number;
  avance_pct:           number;
  num_supl_inicio:      number;
  num_supl_continuacion: number;
  num_Hb9m:             number;
  num_Hb12m:            number;
  num_SfPo1:            number;
  num_Multi1:           number;
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

export const fedSI0204Service = {
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