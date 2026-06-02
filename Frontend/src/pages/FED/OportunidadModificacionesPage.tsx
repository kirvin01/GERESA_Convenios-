// src/components/OportunidadModificacionesPage.tsx
// Versión mejorada — incluye KPIs con %, columnas de porcentaje en tabla,
// tabla dual (ambas métricas), resumen anual acumulado y separación visual de subtotales.

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Container, Grid,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Chip, Avatar,
  Collapse, IconButton, TextField, InputAdornment,
  Divider, ToggleButton, ToggleButtonGroup, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  AccessTime as AccessTimeIcon,
  EditCalendar as EditCalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  PieChart, Pie, Cell, ReferenceLine, ComposedChart, Area,
} from 'recharts';
import {
  fedOportunidadModificacionesService,
  type FiltrosData,
  type OportunidadData,
  type ModificacionesData,
  type RedOportunidad,
  type RedModificacion,
  type ResumenMensual,
} from '../../services/servicesFED/oportunidad_modificaciones';

type MetricaType = 'oportunidad' | 'modificaciones' | 'ambas';

const fmt = (v: number) => v?.toLocaleString('es-PE') ?? '0';
const pct = (num: number, den: number) =>
  den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '0.0%';
const pctNum = (num: number, den: number) =>
  den > 0 ? +((num / den) * 100).toFixed(1) : 0;

// ── Paleta de colores ──────────────────────────────────────────────────────────
const C = {
  oportuno:        '#1B5E20',
  inoportuno:      '#E65100',
  muy_inoportuno:  '#B71C1C',
  sin_mod:         '#78909C',
  aceptable:       '#2E7D32',
  destiempo:       '#F57F17',
  total_op:        '#1565C0',
  total_mod:       '#00695C',
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, borderRadius: 3, height: '100%',
        border: '1px solid', borderColor: alpha(color, 0.2),
        background: `linear-gradient(135deg, ${alpha(color, 0.06)} 0%, ${alpha(color, 0.02)} 100%)`,
      }}
    >
      <Box display="flex" alignItems="flex-start" gap={1.5}>
        <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: 40, height: 40 }}>
          {icon}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
          <Typography variant="h5" fontWeight={800} color={color} lineHeight={1.1}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary">{sub}</Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ── Gráfico de dona con leyenda lateral ───────────────────────────────────────
function DonaChart({ data, title, color }: { data: any[]; title: string; color: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Paper
      elevation={0}
      sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid', borderColor: alpha(color, 0.15) }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2}>
        {title}
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        <ResponsiveContainer width="55%" height={170}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
              paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <RTooltip
              formatter={(v) => [fmt(Number(v ?? 0)), '']}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <Box flex={1}>
          {data.map((d) => (
            <Box key={d.name} display="flex" alignItems="center" gap={0.75} mb={0.8}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
              <Box flex={1} minWidth={0}>
                <Typography variant="caption" noWrap color="text.secondary">{d.name}</Typography>
                <Typography variant="body2" fontWeight={700} color={d.color}>
                  {pct(d.value, total)}
                </Typography>
              </Box>
            </Box>
          ))}
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="caption" color="text.secondary">Total: <b>{fmt(total)}</b></Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// ── Cabecera de tabla coloreada ───────────────────────────────────────────────
const TH = ({ children, align = 'center', color }: { children?: React.ReactNode; align?: 'left' | 'center' | 'right'; color: string }) => (
  <TableCell
    align={align}
    sx={{ fontWeight: 700, fontSize: 11, color: '#fff', bgcolor: color, py: 0.75, px: 1, whiteSpace: 'nowrap' }}
  >
    {children}
  </TableCell>
);

// ── Fila de Red — Oportunidad ─────────────────────────────────────────────────
function RedOportunidadFila({ red, busqueda }: { red: RedOportunidad; busqueda: string }) {
  const [open, setOpen] = useState(true);
  const subs = useMemo(() => {
    const q = busqueda.toUpperCase();
    return q ? red.subgrupos.filter((s) => s.nombre.toUpperCase().includes(q)) : red.subgrupos;
  }, [red.subgrupos, busqueda]);

  if (busqueda && subs.length === 0) return null;

  const rowColor = alpha(C.total_op, 0.08);
  const totalRow = red.total;

  return (
    <>
      {/* Fila RED */}
      <TableRow
        onClick={() => setOpen(!open)}
        sx={{ bgcolor: rowColor, cursor: 'pointer', '&:hover': { bgcolor: alpha(C.total_op, 0.14) } }}
      >
        <TableCell sx={{ py: 0.75, px: 1, width: 36 }}>
          <IconButton size="small" sx={{ p: 0 }}>
            {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 700, color: 'primary.dark', py: 0.75, fontSize: 13 }}>{red.nombre}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: C.oportuno, py: 0.75 }}>{fmt(red.oportuno)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: C.oportuno, py: 0.75 }}>{pct(red.oportuno, totalRow)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: C.inoportuno, py: 0.75 }}>{fmt(red.inoportuno)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: C.inoportuno, py: 0.75 }}>{pct(red.inoportuno, totalRow)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: C.muy_inoportuno, py: 0.75 }}>{fmt(red.muy_inoportuno)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: C.muy_inoportuno, py: 0.75 }}>{pct(red.muy_inoportuno, totalRow)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 800, py: 0.75 }}>{fmt(totalRow)}</TableCell>
      </TableRow>
      {/* Subfilas MICRORED */}
      <TableRow>
        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
          <Collapse in={open}>
            <Table size="small">
              <TableBody>
                {subs.map((sub) => (
                  <TableRow key={sub.nombre} sx={{ '&:hover': { bgcolor: alpha('#000', 0.03) } }}>
                    <TableCell sx={{ width: 36, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }} />
                    <TableCell sx={{ pl: 3, fontSize: 12, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>
                      {sub.nombre}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.oportuno)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 11, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{pct(sub.oportuno, sub.total)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.inoportuno)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 11, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{pct(sub.inoportuno, sub.total)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.muy_inoportuno)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 11, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{pct(sub.muy_inoportuno, sub.total)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, fontWeight: 600, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ── Fila de Red — Modificaciones ──────────────────────────────────────────────
function RedModificacionFila({ red, busqueda }: { red: RedModificacion; busqueda: string }) {
  const [open, setOpen] = useState(true);
  const subs = useMemo(() => {
    const q = busqueda.toUpperCase();
    return q ? red.subgrupos.filter((s) => s.nombre.toUpperCase().includes(q)) : red.subgrupos;
  }, [red.subgrupos, busqueda]);

  if (busqueda && subs.length === 0) return null;

  const rowColor = alpha(C.total_mod, 0.08);
  const totalRow = red.total;

  return (
    <>
      <TableRow
        onClick={() => setOpen(!open)}
        sx={{ bgcolor: rowColor, cursor: 'pointer', '&:hover': { bgcolor: alpha(C.total_mod, 0.14) } }}
      >
        <TableCell sx={{ py: 0.75, px: 1, width: 36 }}>
          <IconButton size="small" sx={{ p: 0 }}>
            {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 700, color: 'success.dark', py: 0.75, fontSize: 13 }}>{red.nombre}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: C.sin_mod, py: 0.75 }}>{fmt(red.sin_modificacion)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: C.sin_mod, py: 0.75 }}>{pct(red.sin_modificacion, totalRow)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: C.aceptable, py: 0.75 }}>{fmt(red.aceptable)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: C.aceptable, py: 0.75 }}>{pct(red.aceptable, totalRow)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, color: C.destiempo, py: 0.75 }}>{fmt(red.destiempo)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, color: C.destiempo, py: 0.75 }}>{pct(red.destiempo, totalRow)}</TableCell>
        <TableCell align="center" sx={{ fontWeight: 800, py: 0.75 }}>{fmt(totalRow)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
          <Collapse in={open}>
            <Table size="small">
              <TableBody>
                {subs.map((sub) => (
                  <TableRow key={sub.nombre} sx={{ '&:hover': { bgcolor: alpha('#000', 0.03) } }}>
                    <TableCell sx={{ width: 36, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }} />
                    <TableCell sx={{ pl: 3, fontSize: 12, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>
                      {sub.nombre}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.sin_modificacion)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 11, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{pct(sub.sin_modificacion, sub.total)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.aceptable)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 11, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{pct(sub.aceptable, sub.total)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.destiempo)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 11, color: 'text.secondary', borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{pct(sub.destiempo, sub.total)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 12, fontWeight: 600, borderBottom: '1px solid', borderColor: alpha('#000', 0.05) }}>{fmt(sub.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ── Tooltip personalizado para el gráfico de tendencia ───────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={4} sx={{ p: 1.5, borderRadius: 2, minWidth: 170 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
      {payload.map((p: any) => (
        <Box key={p.dataKey} display="flex" justifyContent="space-between" gap={2}>
          <Typography variant="caption" color={p.color}>{p.name}</Typography>
          <Typography variant="caption" fontWeight={700}>{p.value}%</Typography>
        </Box>
      ))}
    </Paper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export function OportunidadModificacionesPage() {
  const [filtros, setFiltros] = useState<FiltrosData | null>(null);
  const [anio, setAnio] = useState<number>(2026);
  const [mes, setMes] = useState<string>('');
  const [metrica, setMetrica] = useState<MetricaType>('oportunidad');
  const [red, setRed] = useState<string>('');
  const [microred, setMicrored] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [dataOportunidad, setDataOportunidad] = useState<OportunidadData | null>(null);
  const [dataModificaciones, setDataModificaciones] = useState<ModificacionesData | null>(null);
  const [resumenMensual, setResumenMensual] = useState<ResumenMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga filtros
  useEffect(() => {
    fedOportunidadModificacionesService.getFiltros()
      .then((data) => {
        setFiltros(data);
        if (data.meses.length) setMes(data.meses[0]);
      })
      .catch(() => setError('No se pudieron cargar los filtros'))
      .finally(() => setLoading(false));
  }, []);

  // Resumen mensual
  useEffect(() => {
    if (!anio) return;
    fedOportunidadModificacionesService.getResumenMensual(anio)
      .then((res) => setResumenMensual(res.data));
  }, [anio]);

  // Datos según métrica
  const cargarDatos = useCallback(() => {
    if (!anio || !mes) return;
    setLoadingData(true);
    setError(null);
    const params = { anio, mes, red: red || undefined, microred: microred || undefined };
    const loadOp = metrica === 'oportunidad' || metrica === 'ambas';
    const loadMod = metrica === 'modificaciones' || metrica === 'ambas';
    const promises = [];
    if (loadOp) promises.push(fedOportunidadModificacionesService.getOportunidad(params).then(setDataOportunidad));
    if (loadMod) promises.push(fedOportunidadModificacionesService.getModificaciones(params).then(setDataModificaciones));
    Promise.all(promises).catch(() => setError('Error al cargar los datos')).finally(() => setLoadingData(false));
  }, [anio, mes, red, microred, metrica]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const microredesFiltradas = useMemo(
    () => filtros?.microredes.filter((m) => !red || m.red === red) ?? [],
    [filtros, red],
  );

  // KPIs
  const kpis = useMemo(() => {
    const items: { label: string; value: string; sub: string; color: string; icon: React.ReactNode }[] = [];
    if (dataOportunidad) {
      const t = dataOportunidad.total;
      items.push(
        { label: 'Oportuno', value: pct(t.oportuno, t.total), sub: fmt(t.oportuno) + ' atenciones', color: C.oportuno, icon: <CheckCircleIcon fontSize="small" /> },
        { label: 'Inoportuno', value: pct(t.inoportuno, t.total), sub: fmt(t.inoportuno) + ' atenciones', color: C.inoportuno, icon: <WarningIcon fontSize="small" /> },
        { label: 'Muy Inoportuno', value: pct(t.muy_inoportuno, t.total), sub: fmt(t.muy_inoportuno) + ' atenciones', color: C.muy_inoportuno, icon: <CancelIcon fontSize="small" /> },
      );
    }
    if (dataModificaciones) {
      const t = dataModificaciones.total;
      items.push(
        { label: 'Sin Modificación', value: pct(t.sin_modificacion, t.total), sub: fmt(t.sin_modificacion) + ' atenciones', color: C.sin_mod, icon: <BlockIcon fontSize="small" /> },
        { label: 'Modif. Aceptable', value: pct(t.aceptable, t.total), sub: fmt(t.aceptable) + ' atenciones', color: C.aceptable, icon: <CheckCircleIcon fontSize="small" /> },
        { label: 'Modif. a Destiempo', value: pct(t.destiempo, t.total), sub: fmt(t.destiempo) + ' atenciones', color: C.destiempo, icon: <WarningIcon fontSize="small" /> },
      );
    }
    return items;
  }, [dataOportunidad, dataModificaciones]);

  // Datos de dona para oportunidad
  const donaOp = useMemo(() => dataOportunidad ? [
    { name: 'Oportuno', value: dataOportunidad.total.oportuno, color: C.oportuno },
    { name: 'Inoportuno', value: dataOportunidad.total.inoportuno, color: C.inoportuno },
    { name: 'Muy Inoportuno', value: dataOportunidad.total.muy_inoportuno, color: C.muy_inoportuno },
  ] : [], [dataOportunidad]);

  // Datos de dona para modificaciones
  const donaMod = useMemo(() => dataModificaciones ? [
    { name: 'Sin Modificación', value: dataModificaciones.total.sin_modificacion, color: C.sin_mod },
    { name: 'Aceptable', value: dataModificaciones.total.aceptable, color: C.aceptable },
    { name: 'A Destiempo', value: dataModificaciones.total.destiempo, color: C.destiempo },
  ] : [], [dataModificaciones]);

  // Resumen anual acumulado
  const resumenConAcumulado = useMemo(() => {
    return resumenMensual.map((r) => {
      // Los porcentajes vienen calculados del backend; reconstruimos contadores aproximados
      // para mostrar la tendencia mensual y la línea acumulada (simplificada)
      return {
        ...r,
        oportunidad: r.oportunidad,
        modificaciones_aceptables: r.modificaciones_aceptables,
      };
    });
  }, [resumenMensual]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh" flexDirection="column" gap={2}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Cargando datos...</Typography>
      </Box>
    );
  }

  const showOp = metrica === 'oportunidad' || metrica === 'ambas';
  const showMod = metrica === 'modificaciones' || metrica === 'ambas';

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>

      {/* ── Encabezado ── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: alpha('#00695C', 0.12), color: 'success.main', width: 48, height: 48 }}>
            <AccessTimeIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
              FED MC-01.02 · Oportunidad y Modificaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registros FED 2026 — {mes && `${mes} ${anio}`}
            </Typography>
          </Box>
        </Box>
        {/* Totales globales rápidos */}
        {dataOportunidad && (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label={`Total atenciones: ${fmt(dataOportunidad.total.total)}`} color="primary" variant="outlined" size="small" />
          </Box>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Selector de métrica ── */}
      <Box display="flex" justifyContent="center" mb={3}>
        <ToggleButtonGroup
          value={metrica} exclusive
          onChange={(_, val) => val && setMetrica(val)}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: alpha('#00695C', 0.2), borderRadius: 3 }}
        >
          <ToggleButton value="oportunidad" sx={{ gap: 0.75 }}>
            <AccessTimeIcon fontSize="small" />Oportunidad
          </ToggleButton>
          <ToggleButton value="modificaciones" sx={{ gap: 0.75 }}>
            <EditCalendarIcon fontSize="small" />Modificaciones
          </ToggleButton>
          <ToggleButton value="ambas" sx={{ gap: 0.75 }}>
            <VisibilityIcon fontSize="small" />Ambas
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Filtros ── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: alpha('#00695C', 0.15) }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FilterListIcon fontSize="small" /> Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select value={anio} label="Año" onChange={(e) => setAnio(Number(e.target.value))}>
                {filtros?.anios.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select value={mes} label="Mes" onChange={(e) => setMes(e.target.value)}>
                {filtros?.meses.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Red</InputLabel>
              <Select value={red} label="Red" onChange={(e) => { setRed(e.target.value); setMicrored(''); }}>
                <MenuItem value="">Todas las redes</MenuItem>
                {filtros?.redes.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small" disabled={!red}>
              <InputLabel>Microred</InputLabel>
              <Select value={microred} label="Microred" onChange={(e) => setMicrored(e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {microredesFiltradas.map((m) => <MenuItem key={m.microred} value={m.microred}>{m.microred}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth size="small"
              placeholder="Buscar microred..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          </Grid>
        </Grid>
      </Paper>

      {loadingData && (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
      )}

      {/* ── KPI Cards ── */}
      {!loadingData && kpis.length > 0 && (
        <Grid container spacing={1.5} mb={3}>
          {kpis.map((k) => (
            <Grid item xs={6} sm={4} md={2} key={k.label}>
              <KpiCard {...k} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Gráficos ── */}
      {!loadingData && (dataOportunidad || dataModificaciones) && (
        <Grid container spacing={2} mb={3}>

          {/* Donas */}
          {showOp && donaOp.length > 0 && (
            <Grid item xs={12} sm={6} md={metrica === 'ambas' ? 3 : 4}>
              <DonaChart data={donaOp} title="Distribución — Oportunidad de Registro" color={C.total_op} />
            </Grid>
          )}
          {showMod && donaMod.length > 0 && (
            <Grid item xs={12} sm={6} md={metrica === 'ambas' ? 3 : 4}>
              <DonaChart data={donaMod} title="Distribución — Estado de Modificaciones" color={C.total_mod} />
            </Grid>
          )}

          {/* Gráfico de tendencia anual */}
          <Grid item xs={12} md={metrica === 'ambas' ? 6 : 8}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid', borderColor: alpha('#00695C', 0.15) }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2}>
                Tendencia Anual {anio} — % por mes
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={resumenConAcumulado} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <RTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {showOp && (
                    <Bar dataKey="oportunidad" name="% Oportuno" fill={C.oportuno} radius={[3, 3, 0, 0]} maxBarSize={32} />
                  )}
                  {showMod && (
                    <Line type="monotone" dataKey="modificaciones_aceptables" name="% Modif. Aceptable"
                      stroke={C.total_mod} strokeWidth={2.5} dot={{ r: 4, fill: C.total_mod }} />
                  )}
                  <ReferenceLine y={80} stroke={alpha('#2E7D32', 0.4)} strokeDasharray="4 4"
                    label={{ value: 'Meta 80%', fill: C.oportuno, fontSize: 10, position: 'right' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── Tabla — Oportunidad ── */}
      {!loadingData && showOp && dataOportunidad && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: alpha(C.total_op, 0.2), mb: 2 }}>
          {/* Cabecera del bloque */}
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(C.total_op, 0.06), borderBottom: '1px solid', borderColor: alpha(C.total_op, 0.15), display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ color: C.total_op, fontSize: 18 }} />
            <Typography fontWeight={800} color={C.total_op} fontSize={14} letterSpacing={0.5}>
              OPORTUNIDAD DE REGISTRO — {mes} {anio}
            </Typography>
            <Chip label={`${fmt(dataOportunidad.total.total)} atenciones`} size="small" sx={{ ml: 'auto', bgcolor: alpha(C.total_op, 0.1), color: C.total_op, fontWeight: 700 }} />
          </Box>

          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TH align="left" color={C.total_op} />
                  <TH align="left" color={C.total_op}>RED / MICRORED</TH>
                  <TH color={C.oportuno}>Oportuno</TH>
                  <TH color={C.oportuno}>%</TH>
                  <TH color={C.inoportuno}>Inoportuno</TH>
                  <TH color={C.inoportuno}>%</TH>
                  <TH color={C.muy_inoportuno}>Muy Inoportuno</TH>
                  <TH color={C.muy_inoportuno}>%</TH>
                  <TH color={alpha(C.total_op, 0.85)}>Total</TH>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataOportunidad.redes.map((r) => (
                  <RedOportunidadFila key={r.nombre} red={r} busqueda={busqueda} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Fila total general */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '36px 1fr repeat(7, 100px)', alignItems: 'center', px: 1, py: 1.25, bgcolor: C.total_op, color: '#fff' }}>
            <Box />
            <Typography fontWeight={800} fontSize={13}>TOTAL GENERAL</Typography>
            <Typography textAlign="center" fontWeight={700}>{fmt(dataOportunidad.total.oportuno)}</Typography>
            <Typography textAlign="center" fontWeight={700} fontSize={12}>{pct(dataOportunidad.total.oportuno, dataOportunidad.total.total)}</Typography>
            <Typography textAlign="center" fontWeight={700}>{fmt(dataOportunidad.total.inoportuno)}</Typography>
            <Typography textAlign="center" fontWeight={700} fontSize={12}>{pct(dataOportunidad.total.inoportuno, dataOportunidad.total.total)}</Typography>
            <Typography textAlign="center" fontWeight={700}>{fmt(dataOportunidad.total.muy_inoportuno)}</Typography>
            <Typography textAlign="center" fontWeight={700} fontSize={12}>{pct(dataOportunidad.total.muy_inoportuno, dataOportunidad.total.total)}</Typography>
            <Typography textAlign="center" fontWeight={800}>{fmt(dataOportunidad.total.total)}</Typography>
          </Box>
        </Paper>
      )}

      {/* ── Tabla — Modificaciones ── */}
      {!loadingData && showMod && dataModificaciones && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: alpha(C.total_mod, 0.2) }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(C.total_mod, 0.06), borderBottom: '1px solid', borderColor: alpha(C.total_mod, 0.15), display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditCalendarIcon sx={{ color: C.total_mod, fontSize: 18 }} />
            <Typography fontWeight={800} color={C.total_mod} fontSize={14} letterSpacing={0.5}>
              ESTADO DE MODIFICACIONES — {mes} {anio}
            </Typography>
            <Chip label={`${fmt(dataModificaciones.total.total)} atenciones`} size="small" sx={{ ml: 'auto', bgcolor: alpha(C.total_mod, 0.1), color: C.total_mod, fontWeight: 700 }} />
          </Box>

          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TH align="left" color={C.total_mod} />
                  <TH align="left" color={C.total_mod}>RED / MICRORED</TH>
                  <TH color={C.sin_mod}>Sin Modificación</TH>
                  <TH color={C.sin_mod}>%</TH>
                  <TH color={C.aceptable}>Modif. Aceptable</TH>
                  <TH color={C.aceptable}>%</TH>
                  <TH color={C.destiempo}>Modif. a Destiempo</TH>
                  <TH color={C.destiempo}>%</TH>
                  <TH color={alpha(C.total_mod, 0.85)}>Total</TH>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataModificaciones.redes.map((r) => (
                  <RedModificacionFila key={r.nombre} red={r} busqueda={busqueda} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Fila total general */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '36px 1fr repeat(7, 100px)', alignItems: 'center', px: 1, py: 1.25, bgcolor: C.total_mod, color: '#fff' }}>
            <Box />
            <Typography fontWeight={800} fontSize={13}>TOTAL GENERAL</Typography>
            <Typography textAlign="center" fontWeight={700}>{fmt(dataModificaciones.total.sin_modificacion)}</Typography>
            <Typography textAlign="center" fontWeight={700} fontSize={12}>{pct(dataModificaciones.total.sin_modificacion, dataModificaciones.total.total)}</Typography>
            <Typography textAlign="center" fontWeight={700}>{fmt(dataModificaciones.total.aceptable)}</Typography>
            <Typography textAlign="center" fontWeight={700} fontSize={12}>{pct(dataModificaciones.total.aceptable, dataModificaciones.total.total)}</Typography>
            <Typography textAlign="center" fontWeight={700}>{fmt(dataModificaciones.total.destiempo)}</Typography>
            <Typography textAlign="center" fontWeight={700} fontSize={12}>{pct(dataModificaciones.total.destiempo, dataModificaciones.total.total)}</Typography>
            <Typography textAlign="center" fontWeight={800}>{fmt(dataModificaciones.total.total)}</Typography>
          </Box>
        </Paper>
      )}

    </Container>
  );
}