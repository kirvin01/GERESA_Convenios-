// src/services/fedSI0103Service.ts
// Servicio para el reporte FED SI-01_03 — Gestantes: Hb1 + suplementación hierro (5 dosis) + Hb2/Hb3

import { API_CONFIG } from '../../config';
import { authHeader } from '../authService';

const BASE = `${API_CONFIG.baseURL}/fed/si0103`;

// ── Tipos base ────────────────────────────────────────────────────────────────

export interface FiltrosData {
  anios:         number[];        // ← Corregido: anios (sin tilde)
  meses:         string[];
  departamentos: string[];
  provincias:    { departamento: string; provincia: string }[];
  redes:         string[];
  microredes:    { red: string; microred: string }[];
  categorias:    string[];
}

/** Métricas clínicas específicas de gestantes SI-01_03 */
export interface MetricasGestante {
  total_denom_Hb1:    number;
  total_denom_Hb1_Dx: number;
  total_num_supl1:    number;
  total_num_supl2:    number;
  total_num_supl3:    number;
  total_num_supl4:    number;
  total_num_supl5:    number;
  total_num_Hb2:      number;
  total_num_Hb3:      number;
}

export interface TotalRow extends MetricasGestante {
  denominador: number;
  numerador:   number;
  avance_pct:  number;
}

// ── Organización Territorial ──────────────────────────────────────────────────

export interface ProvinciaRow extends TotalRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
}

export interface DistritoRow extends TotalRow {
  DEPARTAMENTO: string;
  PROVINCIA:    string;
  DISTRITO:     string;
}

export interface TablaCompletaData {
  anio:       number;
  mes:        string;
  total:      TotalRow;
  provincias: ProvinciaRow[];
  distritos:  DistritoRow[];
}

// ── Redes Integradas de Salud ─────────────────────────────────────────────────

export interface RedRow extends TotalRow {
  RED: string;
}

export interface MicroredRow extends TotalRow {
  RED:      string;
  MICRORED: string;
}

export interface EstablecimientoRow extends TotalRow {
  RED:             string;
  MICRORED:        string;
  ESTABLECIMIENTO: string;
}

export interface TablaRedesData {
  anio:             number;
  mes:              string;
  total:            TotalRow;
  redes:            RedRow[];
  microredes:       MicroredRow[];
  establecimientos: EstablecimientoRow[];
}

// ── Resumen mensual ───────────────────────────────────────────────────────────

export interface ResumenRow extends MetricasGestante {
  año:               number;
  MES:               string;
  total_denominador: number;
  total_numerador:   number;
  avance_pct:        number;
}

// ── Nominal ───────────────────────────────────────────────────────────────────

export interface NominalRow {
  DEPARTAMENTO:    string;
  PROVINCIA:       string;
  DISTRITO:        string;
  RED:             string | null;
  MICRORED:        string | null;
  ESTABLECIMIENTO: string | null;
  CATEGORIA:       string | null;
  año:             number;
  MES:             string;
  renaes:          string | null;
  ubigeo_reniec:   string | null;
  num_doc:         string;
  semanas_gest:    number | null;
  // Fechas de gestación
  fecha_inicio_gestacion: string | null;
  fecha_inicio_semana14:  string | null;
  fecha_parto:            string | null;
  // Hb1 (semana 14)
  fecha_Hb1:          string | null;
  valor_Hb1:          number | null;
  denominador_Hb1:    number;
  fecha_Hb1_Dx:       string | null;
  denominador_hb1_Dx: number;     // ← Nota: minúscula 'h' en 'hb1'
  // Avance principal
  denominador: number;
  numerador:   number;
  // Suplementación hierro (5 dosis) - CORREGIDO: los nombres coinciden con el API
  fecha_suplementacion1:    string | null; 
  numerador_suplementacion1: number;
  fecha_suplementacion2:    string | null; 
  numerador_suplementacion2: number;
  fecha_suplementacion3:    string | null; 
  numerador_suplementacion3: number;
  fecha_suplementacion4:    string | null; 
  numerador_suplementacion4: number;
  fecha_suplementacion5:    string | null; 
  numerador_suplementacion5: number;
  // Controles Hb
  fecha_Hb2: string | null; 
  valor_Hb2: number | null; 
  numerador_Hb2: number;
  fecha_Hb3: string | null; 
  valor_Hb3: number | null; 
  numerador_Hb3: number;
}

export interface NominalResponse {
  total:     number;
  page:      number;
  page_size: number;
  pages:     number;
  data:      NominalRow[];
}

// ── Params compartidos ────────────────────────────────────────────────────────

export interface FiltroParams {
  anio:          number;
  mes:           string;
  departamento?: string;
  provincia?:    string;
  red?:          string;
  microred?:     string;
  categoria?:    string;
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

function toQS(params: Record<string, any>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  return qs.toString();
}

// ── Métodos del servicio ──────────────────────────────────────────────────────

export const fedSI0103Service = {

  getFiltros: (signal?: AbortSignal) =>
    apiFetch<FiltrosData>(`${BASE}/filtros`, signal),

  getTablaCompleta: (params: FiltroParams, signal?: AbortSignal) =>
    apiFetch<TablaCompletaData>(`${BASE}/tabla-completa?${toQS(params)}`, signal),

  getTablaRedes: (
    params: FiltroParams & { establecimiento?: string },
    signal?: AbortSignal,
  ) =>
    apiFetch<TablaRedesData>(`${BASE}/tabla-redes?${toQS(params)}`, signal),

  getResumen: (
    params: { anio?: number; departamento?: string; red?: string },
    signal?: AbortSignal,
  ) =>
    apiFetch<{ data: ResumenRow[] }>(`${BASE}/resumen?${toQS(params)}`, signal),

  getNominal: (
    params: FiltroParams & { establecimiento?: string; page?: number; page_size?: number },
    signal?: AbortSignal,
  ) =>
    apiFetch<NominalResponse>(`${BASE}/nominal?${toQS(params)}`, signal),
};