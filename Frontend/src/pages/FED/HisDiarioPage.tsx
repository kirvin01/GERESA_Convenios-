// src/components/HisDiarioPage.tsx
// Variación Diaria: Total Atenciones vs Registros Oportunos HIS

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Container, Grid,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Chip, Avatar,
  Divider, ToggleButton, ToggleButtonGroup,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  FilterList as FilterListIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  Hub as HubIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  LabelList,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  hisDiarioService,
  type FiltrosHIS,
  type DiaRow,
  type MesRow,
  type SistemaRow,
  type RedRow,
} from '../../services/servicesFED/hisDiarioService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNum = (n: number) => n?.toLocaleString('es-PE') ?? '—';
const fmtPct = (n: number) => n != null ? `${Number(n).toFixed(1)}%` : '—';

const pctColor = (v: number): string => {
  if (v >= 80) return '#2E7D32';
  if (v >= 50) return '#E65100';
  return '#C62828';
};

// ── Tooltip personalizado para el gráfico diario ──────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number;
}) {
  if (!active || !payload?.length) return null;
  const atenciones = payload.find((p) => p.name === 'Total Atenciones')?.value ?? 0;
  const registros  = payload.find((p) => p.name === 'Registros Oportunos')?.value ?? 0;
  const pct = atenciones > 0 ? ((registros / atenciones) * 100).toFixed(1) : '0';
  return (
    <Paper elevation={4} sx={{ p: 1.5, borderRadius: 2, minWidth: 200 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        Día {label}
      </Typography>
      <Divider sx={{ my: 0.5 }} />
      {payload.map((p) => (
        <Box key={p.name} display="flex" justifyContent="space-between" gap={2} mt={0.3}>
          <Typography variant="caption" sx={{ color: p.color, fontWeight: 600 }}>{p.name}</Typography>
          <Typography variant="caption" fontWeight={700}>{fmtNum(p.value)}</Typography>
        </Box>
      ))}
      <Divider sx={{ my: 0.5 }} />
      <Box display="flex" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">Oportunidad</Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: pctColor(Number(pct)) }}>
          {pct}%
        </Typography>
      </Box>
    </Paper>
  );
}

// ── Etiqueta sobre cada punto (igual que Excel) ───────────────────────────────

function renderLabel({ x, y, value, color }: { x?: number; y?: number; value?: number; color?: string }) {
  if (value == null || value === 0) return null;
  return (
    <text x={x} y={(y ?? 0) - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill={color ?? '#333'}>
      {fmtNum(value)}
    </text>
  );
}

// ── Gráfico principal (copia fiel del Excel) ──────────────────────────────────

function GraficoDiario({
  data, mes,
}: {
  data: DiaRow[]; mes: string;
}) {
  const chartData = data.map((d) => ({
    dia: d.DIA,
    'Total Atenciones':   d.total_atenciones,
    'Registros Oportunos': d.registrados_mismo_dia,
    pct: d.total_atenciones > 0
      ? Number(((d.registrados_mismo_dia / d.total_atenciones) * 100).toFixed(1))
      : 0,
  }));

  // KPIs rápidos
  const totalAt = data.reduce((s, d) => s + d.total_atenciones, 0);
  const totalReg = data.reduce((s, d) => s + d.registrados_mismo_dia, 0);
  const pctGlobal = totalAt > 0 ? ((totalReg / totalAt) * 100).toFixed(1) : '0';
  const maxAt = Math.max(...data.map((d) => d.total_atenciones));
  const maxReg = Math.max(...data.map((d) => d.registrados_mismo_dia));

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 }, borderRadius: 3,
        border: '1px solid', borderColor: alpha('#1565C0', 0.12),
        boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
      }}
    >
      {/* Cabecera */}
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Variación Diaria — {mes}</Typography>
          <Typography variant="body2" color="text.secondary">
            Total Atenciones HIS vs Registros Oportunos por día
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            label={`Total atenciones: ${fmtNum(totalAt)}`}
            size="small"
            sx={{ bgcolor: alpha('#2E7D32', 0.10), color: '#2E7D32', fontWeight: 700 }}
          />
          <Chip
            label={`Registros oportunos: ${fmtNum(totalReg)}`}
            size="small"
            sx={{ bgcolor: alpha('#1565C0', 0.10), color: '#1565C0', fontWeight: 700 }}
          />
          <Chip
            label={`Oportunidad: ${pctGlobal}%`}
            size="small"
            sx={{
              bgcolor: alpha(pctColor(Number(pctGlobal)), 0.10),
              color: pctColor(Number(pctGlobal)),
              fontWeight: 700,
            }}
          />
        </Box>
      </Box>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 24, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: alpha('#000', 0.15) }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <RTooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />

          {/* Área suave bajo Total Atenciones */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Total Atenciones"
            fill={alpha('#2E7D32', 0.08)}
            stroke="transparent"
          />

          {/* Línea verde gruesa — Total Atenciones */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Total Atenciones"
            stroke="#2E7D32"
            strokeWidth={2.5}
            dot={{ r: 14, fill: '#2E7D32', strokeWidth: 0 }}
            activeDot={{ r: 16 }}
          >
            <LabelList
              dataKey="Total Atenciones"
              content={(props) => renderLabel({ ...props as { x?: number; y?: number; value?: number }, color: '#000000' })}
              position="center"
            />
          </Line>

          {/* Área suave bajo Registros Oportunos */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Registros Oportunos"
            fill={alpha('#1565C0', 0.06)}
            stroke="transparent"
          />

          {/* Línea azul — Registros Oportunos */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Registros Oportunos"
            stroke="#1565C0"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={{ r: 10, fill: '#1565C0', strokeWidth: 0 }}
            activeDot={{ r: 12 }}
          >
            <LabelList
              dataKey="Registros Oportunos"
              content={(props) => renderLabel({ ...props as { x?: number; y?: number; value?: number }, color: '#000000' })}
              position="center"
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>

      {/* Mini métricas por fila */}
      <Box
        display="flex" justifyContent="center" gap={4} mt={2}
        sx={{ borderTop: '1px solid', borderColor: alpha('#000', 0.06), pt: 2 }}
      >
        {[
          { label: 'Días con datos', value: data.length, color: '#546E7A' },
          { label: 'Max atenciones/día', value: fmtNum(maxAt), color: '#2E7D32' },
          { label: 'Max registros/día', value: fmtNum(maxReg), color: '#1565C0' },
          { label: '% Oportunidad global', value: `${pctGlobal}%`, color: pctColor(Number(pctGlobal)) },
        ].map((m) => (
          <Box key={m.label} textAlign="center">
            <Typography variant="h6" fontWeight={800} color={m.color}>{m.value}</Typography>
            <Typography variant="caption" color="text.secondary">{m.label}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

// ── Gráfico comparativo por mes ───────────────────────────────────────────────

function GraficoMeses({ data }: { data: MesRow[] }) {
  if (!data.length) return null;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5, borderRadius: 3,
        border: '1px solid', borderColor: alpha('#1565C0', 0.12),
        boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Comparativa por Mes</Typography>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
          <XAxis dataKey="MES" tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(0, 3)} />
          <YAxis tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <RTooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(v, name) => [fmtNum(Number(v ?? 0)), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="total_atenciones"      name="Total Atenciones"    fill={alpha('#2E7D32', 0.8)} radius={[4,4,0,0]} />
          <Bar dataKey="registrados_mismo_dia" name="Registros Oportunos" fill="#1565C0"               radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

// ── Gráfico por sistema ───────────────────────────────────────────────────────

function GraficoSistemas({ data }: { data: SistemaRow[] }) {
  if (!data.length) return null;
  const top = data.slice(0, 8);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5, borderRadius: 3,
        border: '1px solid', borderColor: alpha('#7B1FA2', 0.12),
        boxShadow: '0 4px 24px rgba(123,31,162,0.07)',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Atenciones por Sistema</Typography>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={top} layout="vertical"
          margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={alpha('#000', 0.06)} />
          <XAxis type="number" tick={{ fontSize: 9 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <YAxis type="category" dataKey="SISTEMA" width={160}
            tick={{ fontSize: 9 }} />
          <RTooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(v, name) => [fmtNum(Number(v ?? 0)), String(name)]}
          />
          <Bar dataKey="total_atenciones" name="Total Atenciones" radius={[0,4,4,0]}>
            {top.map((_, i) => (
              <Cell key={i} fill={`hsl(${200 + i * 18}, 65%, ${45 + i * 2}%)`} />
            ))}
            <LabelList dataKey="total_atenciones"
              position="right" style={{ fontSize: 9, fontWeight: 700, fill: '#555' }}
              formatter={(n) => fmtNum(Number(n ?? 0))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

// ── Gráfico por red ───────────────────────────────────────────────────────────

function GraficoRedes({ data }: { data: RedRow[] }) {
  if (!data.length) return null;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5, borderRadius: 3,
        border: '1px solid', borderColor: alpha('#00695C', 0.12),
        boxShadow: '0 4px 24px rgba(0,105,92,0.07)',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
        Atenciones por Red de Salud
      </Typography>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
          <XAxis dataKey="DESC_RED"
            tick={{ fontSize: 8 }}
            angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <RTooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(v, name) => [fmtNum(Number(v ?? 0)), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="total_atenciones"      name="Total Atenciones"    fill={alpha('#2E7D32', 0.8)} radius={[4,4,0,0]} />
          <Bar dataKey="registrados_mismo_dia" name="Registros Oportunos" fill="#1565C0"               radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

// ── Tabla de datos diarios ────────────────────────────────────────────────────

function TablaDiaria({ data }: { data: DiaRow[] }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3, overflow: 'hidden',
        border: '1px solid', borderColor: alpha('#1565C0', 0.12),
        boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
      }}
    >
      <Box px={2.5} py={1.5}
        sx={{ bgcolor: alpha('#1565C0', 0.03), borderBottom: '1px solid', borderColor: alpha('#1565C0', 0.10) }}>
        <Typography variant="subtitle2" fontWeight={700}>Datos por Día</Typography>
      </Box>
      <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {['Día', 'Total Atenciones', 'Registros Oportunos', '% Oportunidad'].map((h) => (
                <TableCell key={h}
                  sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: alpha('#1565C0', 0.05),
                    color: '#1A2332', whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const pct = row.total_atenciones > 0
                ? Number(((row.registrados_mismo_dia / row.total_atenciones) * 100).toFixed(1))
                : 0;
              return (
                <TableRow key={row.DIA}
                  sx={{ '&:nth-of-type(even)': { bgcolor: alpha('#1565C0', 0.02) },
                    '&:hover': { bgcolor: alpha('#1565C0', 0.05) } }}>
                  <TableCell sx={{ fontWeight: 700 }}>{row.DIA}</TableCell>
                  <TableCell sx={{ color: '#2E7D32', fontWeight: 600 }}>{fmtNum(row.total_atenciones)}</TableCell>
                  <TableCell sx={{ color: '#1565C0', fontWeight: 600 }}>{fmtNum(row.registrados_mismo_dia)}</TableCell>
                  <TableCell>
                    <Chip label={fmtPct(pct)} size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: alpha(pctColor(pct), 0.12), color: pctColor(pct) }} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function HisDiarioPage() {
  // ── Filtros ──
  const [filtros,         setFiltros]         = useState<FiltrosHIS | null>(null);
  const [mes,             setMes]             = useState<string>('');
  const [red,             setRed]             = useState<string>('');
  const [microred,        setMicrored]        = useState<string>('');
  const [establecimiento, setEstablecimiento] = useState<string>('');
  const [sistema,         setSistema]         = useState<string>('');
  const [tipoMetrica,     setTipoMetrica]     = useState<string>('01. TOTAL ATENCIONES');

  // ── Vista auxiliar ──
  const [tabAuxiliar, setTabAuxiliar] = useState<'meses' | 'sistemas' | 'redes' | 'tabla'>('meses');

  // ── Datos ──
  const [graficoData,  setGraficoData]  = useState<DiaRow[]>([]);
  const [resumenMeses, setResumenMeses] = useState<MesRow[]>([]);
  const [porSistema,   setPorSistema]   = useState<SistemaRow[]>([]);
  const [porRed,       setPorRed]       = useState<RedRow[]>([]);

  // ── Loading ──
  const [loadingFiltros,  setLoadingFiltros]  = useState(true);
  const [loadingGrafico,  setLoadingGrafico]  = useState(false);
  const [loadingAuxiliar, setLoadingAuxiliar] = useState(false);
  const [notification,    setNotification]    = useState<{ severity: 'error' | 'info'; message: string } | null>(null);

  // ── Cargar filtros ──
  useEffect(() => {
    const ctrl = new AbortController();
    hisDiarioService.getFiltros(ctrl.signal)
      .then((data) => {
        setFiltros(data);
        if (data.meses.length) setMes(data.meses[data.meses.length - 1]);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError')
          setNotification({ severity: 'error', message: 'No se pudieron cargar los filtros.' });
      })
      .finally(() => setLoadingFiltros(false));
    return () => ctrl.abort();
  }, []);

  // ── Cargar gráfico principal ──
  const cargarGrafico = useCallback((signal?: AbortSignal) => {
    if (!mes) return;
    setLoadingGrafico(true);
    setNotification(null);
    hisDiarioService.getGrafico(
      { mes, red: red || undefined, microred: microred || undefined,
        establecimiento: establecimiento || undefined, sistema: sistema || undefined,
        tipo_metrica: tipoMetrica },
      signal,
    )
      .then((d) => {
        setGraficoData(d.data);
        if (!d.data.length)
          setNotification({ severity: 'info', message: 'Sin datos para los filtros seleccionados.' });
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        setNotification({ severity: 'error', message: e.message });
      })
      .finally(() => setLoadingGrafico(false));
  }, [mes, red, microred, establecimiento, sistema, tipoMetrica]);

  // ── Cargar paneles auxiliares ──
  const cargarAuxiliar = useCallback((signal?: AbortSignal) => {
    setLoadingAuxiliar(true);
    const params = { red: red || undefined, microred: microred || undefined,
      establecimiento: establecimiento || undefined, tipo_metrica: tipoMetrica };

    Promise.all([
      hisDiarioService.getResumenMes(params, signal),
      mes ? hisDiarioService.getPorSistema({ mes, red: red || undefined, microred: microred || undefined, tipo_metrica: tipoMetrica }, signal) : Promise.resolve({ mes: '', data: [] }),
      mes ? hisDiarioService.getPorRed({ mes, sistema: sistema || undefined, tipo_metrica: tipoMetrica }, signal) : Promise.resolve({ mes: '', data: [] }),
    ])
      .then(([meses, sist, redes]) => {
        setResumenMeses(meses.data);
        setPorSistema(sist.data);
        setPorRed(redes.data);
      })
      .catch((e: Error) => { if (e.name !== 'AbortError') console.error(e); })
      .finally(() => setLoadingAuxiliar(false));
  }, [mes, red, microred, establecimiento, sistema, tipoMetrica]);

  useEffect(() => {
    const ctrl = new AbortController();
    cargarGrafico(ctrl.signal);
    cargarAuxiliar(ctrl.signal);
    return () => ctrl.abort();
  }, [cargarGrafico, cargarAuxiliar]);

  // ── Selects dependientes ──
  const microredesFiltradas = useMemo(
    () => filtros?.microredes.filter((m) => !red || m.red === red) ?? [],
    [filtros, red],
  );
  const establecimientosFiltrados = useMemo(
    () => filtros?.establecimientos.filter(
      (e) => (!red || e.red === red) && (!microred || e.microred === microred),
    ) ?? [],
    [filtros, red, microred],
  );

  // ── KPIs del mes ──
  const kpiMesActual = useMemo(
    () => resumenMeses.find((m) => m.MES === mes.toUpperCase()),
    [resumenMeses, mes],
  );

  if (loadingFiltros) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>

      {/* ── Encabezado ── */}
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <Avatar sx={{ bgcolor: alpha('#2E7D32', 0.12), color: '#2E7D32', width: 44, height: 44 }}>
          <ShowChartIcon />
        </Avatar>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h4" fontWeight={700}>Variación Diaria HIS</Typography>
            <Chip label="DBFED2026" size="small" variant="outlined"
              sx={{ borderColor: alpha('#2E7D32', 0.4), color: '#2E7D32', fontWeight: 600 }} />
          </Box>
          <Typography color="text.secondary">
            Total de Atenciones HIS vs Registros Oportunos — por día del mes
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* ── Filtros ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 3,
          border: '1px solid', borderColor: alpha('#2E7D32', 0.15),
          boxShadow: '0 4px 24px rgba(46,125,50,0.07)',
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary"
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FilterListIcon fontSize="small" /> Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">

          {/* Mes */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select value={mes} label="Mes" onChange={(e) => setMes(e.target.value as string)}>
                {filtros?.meses.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Red */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Red</InputLabel>
              <Select value={red} label="Red"
                onChange={(e) => { setRed(e.target.value as string); setMicrored(''); setEstablecimiento(''); }}>
                <MenuItem value="">Todas</MenuItem>
                {filtros?.redes.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Microred */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small" disabled={!red}>
              <InputLabel>Microred</InputLabel>
              <Select value={microred} label="Microred"
                onChange={(e) => { setMicrored(e.target.value as string); setEstablecimiento(''); }}>
                <MenuItem value="">Todas</MenuItem>
                {microredesFiltradas.map((m) => (
                  <MenuItem key={m.microred} value={m.microred}>{m.microred}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Establecimiento */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small" disabled={!microred}>
              <InputLabel>Establecimiento</InputLabel>
              <Select value={establecimiento} label="Establecimiento"
                onChange={(e) => setEstablecimiento(e.target.value as string)}>
                <MenuItem value="">Todos</MenuItem>
                {establecimientosFiltrados.map((e) => (
                  <MenuItem key={e.establecimiento} value={e.establecimiento}>{e.establecimiento}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sistema */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sistema</InputLabel>
              <Select value={sistema} label="Sistema" onChange={(e) => setSistema(e.target.value as string)}>
                <MenuItem value="">Todos</MenuItem>
                {filtros?.sistemas.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Tipo métrica */}
          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Métrica</InputLabel>
              <Select value={tipoMetrica} label="Métrica"
                onChange={(e) => setTipoMetrica(e.target.value as string)}>
                <MenuItem value="01. TOTAL ATENCIONES">Total Atenciones</MenuItem>
                <MenuItem value="02. REGISTROS OPORTUNOS">Registros Oportunos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {notification && (
        <Alert severity={notification.severity} sx={{ mb: 2, borderRadius: 2 }}>
          {notification.message}
        </Alert>
      )}

      {/* ── KPIs rápidos del mes ── */}
      {kpiMesActual && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total Atenciones', value: fmtNum(kpiMesActual.total_atenciones), color: '#2E7D32', icon: <CalendarIcon /> },
            { label: 'Registros Oportunos', value: fmtNum(kpiMesActual.registrados_mismo_dia), color: '#1565C0', icon: <ShowChartIcon /> },
            { label: '% Oportunidad', value: fmtPct(kpiMesActual.pct_oportunos), color: pctColor(kpiMesActual.pct_oportunos), icon: <BarChartIcon /> },
            { label: 'Redes activas', value: String(porRed.length), color: '#00695C', icon: <HubIcon /> },
            { label: 'Sistemas activos', value: String(porSistema.length), color: '#7B1FA2', icon: <AccountBalanceIcon /> },
          ].map((kpi) => (
            <Grid item xs={6} sm={4} md={2.4} key={kpi.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2, borderRadius: 3, textAlign: 'center',
                  border: '1px solid', borderColor: alpha(kpi.color, 0.20),
                  boxShadow: `0 2px 12px ${alpha(kpi.color, 0.08)}`,
                }}
              >
                <Avatar sx={{ bgcolor: alpha(kpi.color, 0.10), color: kpi.color, mx: 'auto', mb: 1 }}>
                  {kpi.icon}
                </Avatar>
                <Typography variant="h5" fontWeight={800} color={kpi.color}>{kpi.value}</Typography>
                <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Gráfico principal ── */}
      {loadingGrafico ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={320} gap={2}>
          <CircularProgress size={36} sx={{ color: '#2E7D32' }} />
          <Typography color="text.secondary">Cargando variación diaria…</Typography>
        </Box>
      ) : !mes ? (
        <Paper
          elevation={0}
          sx={{
            p: 6, textAlign: 'center', borderRadius: 3,
            border: '2px dashed', borderColor: alpha('#2E7D32', 0.2),
            color: 'text.secondary',
          }}
        >
          <ShowChartIcon sx={{ fontSize: 52, color: alpha('#2E7D32', 0.2), mb: 1 }} />
          <Typography>Selecciona un <strong>Mes</strong> para ver el gráfico.</Typography>
        </Paper>
      ) : graficoData.length > 0 ? (
        <Box mb={3}>
          <GraficoDiario data={graficoData} mes={mes} />
        </Box>
      ) : null}

      {/* ── Paneles secundarios ── */}
      {(resumenMeses.length > 0 || porSistema.length > 0 || porRed.length > 0) && (
        <>
          {/* Selector de panel */}
          <Box display="flex" justifyContent="flex-start" mb={2}>
            <ToggleButtonGroup
              value={tabAuxiliar} exclusive
              onChange={(_, v) => v && setTabAuxiliar(v)}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid', borderColor: alpha('#1565C0', 0.15),
                borderRadius: 2, overflow: 'hidden',
                '& .MuiToggleButton-root': {
                  px: 2, py: 0.8, fontSize: '0.82rem',
                  textTransform: 'none', border: 'none', gap: 0.5,
                  color: 'text.secondary', fontWeight: 500,
                  '&.Mui-selected': { bgcolor: '#1565C0', color: '#fff', fontWeight: 700 },
                  '&:hover': { bgcolor: alpha('#1565C0', 0.06) },
                },
              }}
            >
              <ToggleButton value="meses"><BarChartIcon fontSize="small" />Por Mes</ToggleButton>
              <ToggleButton value="sistemas"><AccountBalanceIcon fontSize="small" />Por Sistema</ToggleButton>
              <ToggleButton value="redes"><HubIcon fontSize="small" />Por Red</ToggleButton>
              <ToggleButton value="tabla"><TableChartIcon fontSize="small" />Tabla diaria</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {loadingAuxiliar ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {tabAuxiliar === 'meses'   && <GraficoMeses   data={resumenMeses} />}
              {tabAuxiliar === 'sistemas' && <GraficoSistemas data={porSistema}   />}
              {tabAuxiliar === 'redes'   && <GraficoRedes   data={porRed}        />}
              {tabAuxiliar === 'tabla'   && <TablaDiaria    data={graficoData}   />}
            </>
          )}
        </>
      )}
    </Container>
  );
}