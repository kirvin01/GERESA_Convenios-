// src/components/FedMC0101Page.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Container, Grid,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Chip, Avatar,
  Collapse, IconButton, TextField, InputAdornment,
  Divider, ToggleButton, ToggleButtonGroup,
  Dialog, DialogContent, Tooltip,
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
} from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import {
  TrendingUp as TrendingUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PregnantWoman as PregnantWomanIcon,
  AccountTree as AccountTreeIcon,
  Hub as HubIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend,
  ReferenceLine,
  Line,
  LabelList,
} from 'recharts';
import {
  fedMC0101Service,
  type FiltrosData,
  type TablaCompletaData,
  type TablaRedesData,
  type ProvinciaRow,
  type DistritoRow,
  type RedRow,
  type MicroredRow,
  type EstablecimientoRow,
  type ResumenRow,
} from '../../services/servicesFED/fedMC0101Service';

// ── Tipos de vista ────────────────────────────────────────────────────────────

type ModoVista = 'territorial' | 'redes';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtPct = (v: number | null | undefined) =>
  v == null ? '—' : `${Number(v).toFixed(2)}%`;

const pctColor = (v: number | null | undefined): 'success' | 'warning' | 'error' | 'default' => {
  if (v == null) return 'default';
  if (v >= 40.70)  return 'success';
  if (v >= 40.69)  return 'warning';
  return 'error';
};

// ── Columnas DataGrid — Organización Territorial ──────────────────────────────

const columnasDetalleTerritorial: GridColDef[] = [
  { field: 'DEPARTAMENTO', headerName: 'Departamento', width: 130, sortable: false },
  { field: 'PROVINCIA',    headerName: 'Provincia',    width: 130, sortable: false },
  { field: 'DISTRITO',     headerName: 'Distrito',     flex: 1, minWidth: 140, sortable: false },
  { field: 'denominador',  headerName: 'Denominador',  width: 120, type: 'number', headerAlign: 'center', align: 'center' },
  { field: 'numerador',    headerName: 'Numerador',    width: 110, type: 'number', headerAlign: 'center', align: 'center' },
  {
    field: 'avance_pct', headerName: 'Avance %', width: 120,
    headerAlign: 'center', align: 'center',
    renderCell: (p) => (
      <Chip label={fmtPct(p.value as number)} color={pctColor(p.value as number)}
        size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
    ),
  },
];

// ── Columnas DataGrid — Redes Integradas de Salud ─────────────────────────────

const columnasDetalleRedes: GridColDef[] = [
  { field: 'RED',             headerName: 'Red',             width: 150, sortable: false },
  { field: 'MICRORED',        headerName: 'Microred',        width: 160, sortable: false },
  { field: 'ESTABLECIMIENTO', headerName: 'Establecimiento', flex: 1, minWidth: 160, sortable: false },
  { field: 'denominador',     headerName: 'Denominador',     width: 120, type: 'number', headerAlign: 'center', align: 'center' },
  { field: 'numerador',       headerName: 'Numerador',       width: 110, type: 'number', headerAlign: 'center', align: 'center' },
  {
    field: 'avance_pct', headerName: 'Avance %', width: 120,
    headerAlign: 'center', align: 'center',
    renderCell: (p) => (
      <Chip label={fmtPct(p.value as number)} color={pctColor(p.value as number)}
        size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
    ),
  },
];

// ── Sub-componente: fila de provincia colapsable ──────────────────────────────

function ProvinciaFila({
  prov, distritos, busqueda,
}: {
  prov: ProvinciaRow; distritos: DistritoRow[]; busqueda: string;
}) {
  const [open, setOpen] = useState(false);
  const filas = useMemo(() => {
    const q = busqueda.toUpperCase();
    return distritos.filter(
      (d) => d.PROVINCIA === prov.PROVINCIA && (!q || d.DISTRITO.toUpperCase().includes(q)),
    );
  }, [distritos, prov.PROVINCIA, busqueda]);

  if (busqueda && filas.length === 0) return null;

  return (
    <>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 1fr 110px 100px 120px',
          alignItems: 'center', px: 1, py: 0.75,
          bgcolor: alpha('#1565C0', 0.10), cursor: 'pointer',
          borderBottom: '1px solid', borderColor: alpha('#1565C0', 0.15),
          '&:hover': { bgcolor: alpha('#1565C0', 0.15) },
        }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="body2" fontWeight={700} color="primary.dark">{prov.DEPARTAMENTO}</Typography>
        <Typography variant="body2" fontWeight={700} color="primary.dark">Total {prov.PROVINCIA}</Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{prov.denominador}</Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{prov.numerador}</Typography>
        <Box display="flex" justifyContent="center">
          <Chip label={fmtPct(prov.avance_pct)} color={pctColor(prov.avance_pct)}
            size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
        </Box>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {filas.map((d) => (
          <Box
            key={d.DISTRITO}
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 1fr 110px 100px 120px',
              alignItems: 'center', px: 1, py: 0.5,
              borderBottom: '1px solid', borderColor: alpha('#000', 0.04),
              '&:hover': { bgcolor: alpha('#1565C0', 0.04) },
            }}
          >
            <Box />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{d.DEPARTAMENTO}</Typography>
            <Typography variant="body2" sx={{ pl: 1 }}>{d.DISTRITO}</Typography>
            <Typography variant="body2" textAlign="center">{d.denominador}</Typography>
            <Typography variant="body2" textAlign="center">{d.numerador}</Typography>
            <Box display="flex" justifyContent="center">
              <Chip label={fmtPct(d.avance_pct)} color={pctColor(d.avance_pct)}
                size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
            </Box>
          </Box>
        ))}
      </Collapse>
    </>
  );
}

// ── Sub-componente: fila de Red colapsable (con Microredes y Establecimientos) ─

function RedFila({
  red, microredes, establecimientos, busqueda,
}: {
  red: RedRow;
  microredes: MicroredRow[];
  establecimientos: EstablecimientoRow[];
  busqueda: string;
}) {
  const [open, setOpen] = useState(false);

  const microredesDeLaRed = useMemo(
    () => microredes.filter((m) => m.RED === red.RED),
    [microredes, red.RED],
  );

  // Si búsqueda activa y ningún establecimiento coincide, no renderizar
  const tieneCoincidencia = useMemo(() => {
    if (!busqueda) return true;
    const q = busqueda.toUpperCase();
    return establecimientos.some(
      (e) => e.RED === red.RED &&
        (e.ESTABLECIMIENTO.toUpperCase().includes(q) || e.MICRORED.toUpperCase().includes(q)),
    );
  }, [establecimientos, red.RED, busqueda]);

  if (!tieneCoincidencia) return null;

  return (
    <>
      {/* ── Subtotal Red ── */}
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 1fr 110px 100px 120px',
          alignItems: 'center', px: 1, py: 0.75,
          bgcolor: alpha('#00695C', 0.10), cursor: 'pointer',
          borderBottom: '1px solid', borderColor: alpha('#00695C', 0.15),
          '&:hover': { bgcolor: alpha('#00695C', 0.15) },
        }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="body2" fontWeight={700} color="success.dark" sx={{ gridColumn: 'span 1' }}>
          {red.RED}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="success.dark">
          Total Red
        </Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{red.denominador}</Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{red.numerador}</Typography>
        <Box display="flex" justifyContent="center">
          <Chip label={fmtPct(red.avance_pct)} color={pctColor(red.avance_pct)}
            size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
        </Box>
      </Box>

      {/* ── Microredes de esta Red ── */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        {microredesDeLaRed.map((mr) => (
          <MicroredFila
            key={`${mr.RED}-${mr.MICRORED}`}
            microred={mr}
            establecimientos={establecimientos}
            busqueda={busqueda}
          />
        ))}
      </Collapse>
    </>
  );
}

// ── Sub-componente: fila de Microred colapsable ───────────────────────────────

function MicroredFila({
  microred, establecimientos, busqueda,
}: {
  microred: MicroredRow;
  establecimientos: EstablecimientoRow[];
  busqueda: string;
}) {
  const [open, setOpen] = useState(false);

  const filas = useMemo(() => {
    const q = busqueda.toUpperCase();
    return establecimientos.filter(
      (e) =>
        e.RED === microred.RED &&
        e.MICRORED === microred.MICRORED &&
        (!q || e.ESTABLECIMIENTO.toUpperCase().includes(q) || e.MICRORED.toUpperCase().includes(q)),
    );
  }, [establecimientos, microred.RED, microred.MICRORED, busqueda]);

  if (busqueda && filas.length === 0) return null;

  return (
    <>
      {/* ── Subtotal Microred ── */}
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px 40px 1fr 110px 100px 120px',
          alignItems: 'center', px: 1, py: 0.6,
          bgcolor: alpha('#00695C', 0.05), cursor: 'pointer',
          borderBottom: '1px solid', borderColor: alpha('#00695C', 0.10),
          '&:hover': { bgcolor: alpha('#00695C', 0.10) },
        }}
      >
        <Box />
        <IconButton size="small" sx={{ p: 0 }}>
          {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="body2" fontWeight={600} color="success.dark">
          {microred.MICRORED}
        </Typography>
        <Typography variant="body2" fontWeight={600} textAlign="center">{microred.denominador}</Typography>
        <Typography variant="body2" fontWeight={600} textAlign="center">{microred.numerador}</Typography>
        <Box display="flex" justifyContent="center">
          <Chip label={fmtPct(microred.avance_pct)} color={pctColor(microred.avance_pct)}
            size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
        </Box>
      </Box>

      {/* ── Establecimientos ── */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        {filas.map((e) => (
          <Box
            key={`${e.MICRORED}-${e.ESTABLECIMIENTO}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 40px 1fr 110px 100px 120px',
              alignItems: 'center', px: 1, py: 0.45,
              borderBottom: '1px solid', borderColor: alpha('#000', 0.04),
              '&:hover': { bgcolor: alpha('#00695C', 0.04) },
            }}
          >
            <Box /><Box />
            <Typography variant="body2" sx={{ pl: 1, fontSize: '0.8rem' }}>{e.ESTABLECIMIENTO}</Typography>
            <Typography variant="body2" textAlign="center">{e.denominador}</Typography>
            <Typography variant="body2" textAlign="center">{e.numerador}</Typography>
            <Box display="flex" justifyContent="center">
              <Chip label={fmtPct(e.avance_pct)} color={pctColor(e.avance_pct)}
                size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
            </Box>
          </Box>
        ))}
      </Collapse>
    </>
  );
}

// ── Gráfico de barras genérico ────────────────────────────────────────────────

function GraficoBarras({
  titulo, data,
}: {
  titulo: string;
  data: { name: string; Denominador: number; Numerador: number; 'Avance %': number }[];
}) {
  const [fullscreen, setFullscreen] = useState(false);
  if (!data.length) return null;


  const chart = (height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <RTooltip
          contentStyle={{ fontSize: 10, borderRadius: 8 }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const data = payload[0]?.payload;
              if (data) {
                return (
                  <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                    <Typography variant="caption" display="block" fontWeight={700} mb={0.5}>
                      {label}
                    </Typography>
                    <Typography variant="caption" display="block" fontWeight="bold" color="#1565C0">
                      {`${data['Avance %']?.toFixed(2)}%`}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Denominador: {data.Denominador?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Numerador: {data.Numerador?.toLocaleString()}
                    </Typography>
                  </Box>
                );
              }
            }
            return null;
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Denominador" fill={alpha('#42A5F5', 0.8)} radius={[4,4,0,0]} />
        <Bar dataKey="Numerador"   fill="#1565C0"               radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2, borderRadius: 3, height: '100%',
          border: '1px solid', borderColor: alpha('#1565C0', 0.12),
          boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            {titulo}
          </Typography>
          <Tooltip title="Ver en pantalla completa">
            <IconButton size="small" onClick={() => setFullscreen(true)}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        {chart(210)}
      </Paper>

      <Dialog open={fullscreen} onClose={() => setFullscreen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
              {titulo}
            </Typography>
            <Tooltip title="Cerrar">
              <IconButton size="small" onClick={() => setFullscreen(false)}>
                <FullscreenExitIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {chart(420)}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Gráfico de tendencia mensual ──────────────────────────────────────────────

function GraficoTendencia({
  resumen,
}: {
  resumen: ResumenRow[];
  meta?: number;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  if (!resumen.length) return null;

  const data = resumen.map((r) => ({
    name:        r.MES.slice(0, 3),
    'Avance %':  r.avance_pct,
    Denominador: r.total_denominador,
    Numerador:   r.total_numerador,
  }));

  const chart = (height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 22, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} unit="%" tick={{ fontSize: 10 }} />
        <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v ?? 0}%`, 'Avance']} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine
          y={40.70}
          stroke="#D32F2F"
          strokeWidth={2}
          strokeDasharray="6 6"
          label={{ value: `Meta ${40.70.toFixed(2)}%`, position: 'insideTopRight', fill: '#D32F2F', fontSize: 11, fontWeight: 700 }}
        />
        <Line
          type="monotone"
          dataKey={() => null}
          name={`Meta Verificación ${40.70.toFixed(2)}%`}
          stroke="#D32F2F"
          strokeWidth={2}
          dot={false}
          legendType="line"
        />
        <Bar dataKey="Avance %" fill="#2E7D32" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="Avance %"
            position="top"
            style={{ fontSize: 9, fill: '#2E7D32', fontWeight: 700 }}
            formatter={(value) => {
            const v = typeof value === 'number' ? value : Number(value);
            return `${v.toFixed(1)}%`;
          }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <Paper
        elevation={0}
        sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: alpha('#1565C0', 0.12), boxShadow: '0 4px 24px rgba(21,101,192,0.08)' }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            Tendencia — Avance %
          </Typography>
          <Tooltip title="Ver en pantalla completa">
            <IconButton size="small" onClick={() => setFullscreen(true)}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        {chart(220)}
      </Paper>

      <Dialog open={fullscreen} onClose={() => setFullscreen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
              Tendencia — Avance %
            </Typography>
            <Tooltip title="Cerrar">
              <IconButton size="small" onClick={() => setFullscreen(false)}>
                <FullscreenExitIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {chart(420)}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function FedMC0101Page() {
  // ── Modo de vista principal ──
  const [modoVista, setModoVista] = useState<ModoVista>('territorial');

  // ── Filtros comunes ──
  const [filtros,      setFiltros]      = useState<FiltrosData | null>(null);
  const [anio,         setAnio]         = useState<number>(0);
  const [mes,          setMes]          = useState<string>('');
  const [busqueda,     setBusqueda]     = useState<string>('');
  const [vista,        setVista]        = useState<'jerarquica' | 'plana'>('jerarquica');

  // ── Filtros: Organización Territorial ──
  const [departamento, setDepartamento] = useState<string>('');
  const [provincia,    setProvincia]    = useState<string>('');

  // ── Filtros: Redes Integradas de Salud ──
  const [red,          setRed]          = useState<string>('');
  const [microred,     setMicrored]     = useState<string>('');

  // ── Datos ──
  const [tabla,         setTabla]         = useState<TablaCompletaData | null>(null);
  const [tablaRedes,    setTablaRedes]    = useState<TablaRedesData | null>(null);
  const [resumen,       setResumen]       = useState<ResumenRow[]>([]);
  const [loadingFiltros,setLoadingFiltros]= useState(true);
  const [loadingTabla,  setLoadingTabla]  = useState(false);
  const [loadingResumen,setLoadingResumen]= useState(false);
  const [notification,  setNotification]  = useState<{ severity: 'error' | 'info'; message: string } | null>(null);

  // ── Cargar filtros al montar ──
  useEffect(() => {
    const ctrl = new AbortController();
    fedMC0101Service.getFiltros(ctrl.signal)
      .then((data) => {
        setFiltros(data);
        if (data.anios.length) setAnio(data.anios[0]);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError')
          setNotification({ severity: 'error', message: 'No se pudieron cargar los filtros.' });
      })
      .finally(() => setLoadingFiltros(false));
    return () => ctrl.abort();
  }, []);

  // ── Cargar tendencia anual ──
  useEffect(() => {
    if (!anio) return;
    const ctrl = new AbortController();
    setLoadingResumen(true);
    fedMC0101Service.getResumen(
      {
        anio,
        departamento: modoVista === 'territorial' ? (departamento || undefined) : undefined,
        provincia:    modoVista === 'territorial' ? (provincia    || undefined) : undefined,
        red:          modoVista === 'redes'        ? (red          || undefined) : undefined,
        microred:     modoVista === 'redes'        ? (microred     || undefined) : undefined,
      },
      ctrl.signal,
    )
      .then((r) => setResumen(r.data))
      .catch((e: Error) => { if (e.name !== 'AbortError') setResumen([]); })
      .finally(() => setLoadingResumen(false));
    return () => ctrl.abort();
  }, [anio, departamento, provincia, red, microred, modoVista]);

  // ── Cargar tabla — Organización Territorial ──
  const cargarTablaCompleta = useCallback((signal?: AbortSignal) => {
    if (!anio || !mes || modoVista !== 'territorial') return;
    setLoadingTabla(true);
    setNotification(null);
    fedMC0101Service.getTablaCompleta(
      { anio, mes, departamento: departamento || undefined, provincia: provincia || undefined },
      signal,
    )
      .then((data) => {
        setTabla(data);
        if (!data.distritos.length)
          setNotification({ severity: 'info', message: 'No hay datos para los filtros seleccionados.' });
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        setNotification({ severity: 'error', message: e.message || 'Error al cargar los datos.' });
      })
      .finally(() => setLoadingTabla(false));
  }, [anio, mes, departamento, provincia, modoVista]);

  // ── Cargar tabla — Redes ──
  const cargarTablaRedes = useCallback((signal?: AbortSignal) => {
    if (!anio || !mes || modoVista !== 'redes') return;
    setLoadingTabla(true);
    setNotification(null);
    fedMC0101Service.getTablaRedes(
      { anio, mes, red: red || undefined, microred: microred || undefined },
      signal,
    )
      .then((data) => {
        setTablaRedes(data);
        if (!data.establecimientos.length)
          setNotification({ severity: 'info', message: 'No hay datos para los filtros seleccionados.' });
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        setNotification({ severity: 'error', message: e.message || 'Error al cargar los datos.' });
      })
      .finally(() => setLoadingTabla(false));
  }, [anio, mes, red, microred, modoVista]);

  useEffect(() => {
    const ctrl = new AbortController();
    if (modoVista === 'territorial') cargarTablaCompleta(ctrl.signal);
    else cargarTablaRedes(ctrl.signal);
    return () => ctrl.abort();
  }, [modoVista, cargarTablaCompleta, cargarTablaRedes]);

  // ── Limpiar datos al cambiar de modo ──
  const handleModoVista = (_: React.MouseEvent<HTMLElement>, nuevo: ModoVista | null) => {
    if (!nuevo) return;
    setModoVista(nuevo);
    setTabla(null);
    setTablaRedes(null);
    setNotification(null);
    setBusqueda('');
  };

  // ── Provincias filtradas ──
  const provinciasFiltradas = useMemo(
    () => filtros?.provincias.filter((p) => !departamento || p.departamento === departamento) ?? [],
    [filtros, departamento],
  );

  // ── Microredes filtradas ──
  const microredesFiltradas = useMemo(
    () => filtros?.microredes.filter((m) => !red || m.red === red) ?? [],
    [filtros, red],
  );

  // ── Filas planas para DataGrid — Territorial ──
  const filasPlanasTerritorial = useMemo(() => {
    if (!tabla) return [];
    const q = busqueda.toUpperCase();
    return tabla.distritos
      .filter((d) => !q || d.DISTRITO.toUpperCase().includes(q) || d.PROVINCIA.toUpperCase().includes(q))
      .map((d, i) => ({ ...d, id: i }));
  }, [tabla, busqueda]);

  // ── Filas planas para DataGrid — Redes ──
  const filasRedes = useMemo(() => {
    if (!tablaRedes) return [];
    const q = busqueda.toUpperCase();
    return tablaRedes.establecimientos
      .filter((e) => !q || e.ESTABLECIMIENTO.toUpperCase().includes(q) || e.MICRORED.toUpperCase().includes(q))
      .map((e, i) => ({ ...e, id: i }));
  }, [tablaRedes, busqueda]);

  // ── Datos del gráfico según modo ──
  const datosGrafico = useMemo(() => {
    if (modoVista === 'territorial' && tabla) {
      return tabla.provincias.map((p) => ({
        name: p.PROVINCIA.length > 11 ? `${p.PROVINCIA.slice(0, 11)}…` : p.PROVINCIA,
        Denominador: p.denominador,
        Numerador:   p.numerador,
        'Avance %':  p.avance_pct,
      }));
    }
    if (modoVista === 'redes' && tablaRedes) {
      return tablaRedes.redes.map((r) => ({
        name: r.RED.length > 11 ? `${r.RED.slice(0, 11)}…` : r.RED,
        Denominador: r.denominador,
        Numerador:   r.numerador,
        'Avance %':  r.avance_pct,
      }));
    }
    return [];
  }, [modoVista, tabla, tablaRedes]);

  const totalActual = modoVista === 'territorial' ? tabla?.total : tablaRedes?.total;
  const mesActual   = modoVista === 'territorial' ? tabla?.mes   : tablaRedes?.mes;
  const anioActual  = modoVista === 'territorial' ? tabla?.anio  : tablaRedes?.anio;

  // ── Render ─────────────────────────────────────────────────────────────────

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
        <Avatar sx={{ bgcolor: alpha('#1565C0', 0.1), color: 'primary.main', width: 44, height: 44 }}>
          <PregnantWomanIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>FED MC-01.01</Typography>
          <Typography color="text.secondary">
            Porcentaje de mujeres con parto institucional, procedentes de los distritos de quintiles 1 y 2 de pobreza departamental que durante su gestación recibieron el paquete integrado de servicios.
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* ── Toggle de modo de vista ── */}
      <Box display="flex" justifyContent="center" mb={3}>
        <ToggleButtonGroup
          value={modoVista}
          exclusive
          onChange={handleModoVista}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: alpha('#1565C0', 0.20),
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(21,101,192,0.10)',

            '& .MuiToggleButton-root': {
              px: 3,
              py: 1.2,
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              border: 'none',
              gap: 0.8,
              color: 'text.secondary',

              '&:hover': {
                bgcolor: alpha('#1565C0', 0.06),
              },
            },

            // TERRITORIAL seleccionado
            '& .MuiToggleButton-root[value="territorial"].Mui-selected': {
              bgcolor: '#1565C0',
              color: '#fff',

              '&:hover': {
                bgcolor: '#1565C0',
              },
            },

            // REDES seleccionado
            '& .MuiToggleButton-root[value="redes"].Mui-selected': {
              bgcolor: '#00695C',
              color: '#fff',

              '&:hover': {
                bgcolor: '#00695C',
              },
            },
          }}
        >
          <ToggleButton value="territorial">
            <AccountTreeIcon fontSize="small" />
            Organización Territorial
          </ToggleButton>

          <ToggleButton value="redes">
            <HubIcon fontSize="small" />
            Redes Integradas de Salud
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Filtros ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 3,
          border: '1px solid', borderColor: alpha('#1565C0', 0.12),
          boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
        }}
      >
        <Typography
          variant="subtitle2" fontWeight={600} color="text.secondary"
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <FilterListIcon fontSize="small" /> Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">

          {/* Año */}
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select value={anio || ''} label="Año"
                onChange={(e) => { setAnio(Number(e.target.value)); setTabla(null); setTablaRedes(null); }}>
                {filtros?.anios.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Mes */}
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select value={mes} label="Mes" onChange={(e) => setMes(e.target.value as string)}>
                <MenuItem value=""><em>Selecciona…</em></MenuItem>
                {filtros?.meses.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtros condicionales según modo */}
          {modoVista === 'territorial' && (
            <>
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Departamento</InputLabel>
                  <Select value={departamento} label="Departamento"
                    onChange={(e) => { setDepartamento(e.target.value as string); setProvincia(''); }}>
                    <MenuItem value="">Todos</MenuItem>
                    {filtros?.departamentos.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small" disabled={!departamento}>
                  <InputLabel>Provincia</InputLabel>
                  <Select value={provincia} label="Provincia"
                    onChange={(e) => setProvincia(e.target.value as string)}>
                    <MenuItem value="">Todas</MenuItem>
                    {provinciasFiltradas.map((p) => (
                      <MenuItem key={p.provincia} value={p.provincia}>{p.provincia}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {modoVista === 'redes' && (
            <>
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Red</InputLabel>
                  <Select value={red} label="Red"
                    onChange={(e) => { setRed(e.target.value as string); setMicrored(''); }}>
                    <MenuItem value="">Todas</MenuItem>
                    {filtros?.redes.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={3}>
                <FormControl fullWidth size="small" disabled={!red}>
                  <InputLabel>Microred</InputLabel>
                  <Select value={microred} label="Microred"
                    onChange={(e) => setMicrored(e.target.value as string)}>
                    <MenuItem value="">Todas</MenuItem>
                    {microredesFiltradas.map((m) => (
                      <MenuItem key={m.microred} value={m.microred}>{m.microred}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Buscador */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth size="small"
              placeholder={modoVista === 'territorial' ? 'Buscar distrito…' : 'Buscar establecimiento…'}
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {notification && (
        <Alert severity={notification.severity} sx={{ mb: 2, borderRadius: 2 }}>
          {notification.message}
        </Alert>
      )}

      {/* ── KPIs + Gráficos ── */}
      {(tabla || tablaRedes) && (
        <Grid container spacing={2} mb={3}>

          {/* KPI avance global */}
          <Grid item xs={12} sm={4} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3, borderRadius: 3, height: '100%',
                background: modoVista === 'territorial'
                  ? 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)'
                  : 'linear-gradient(135deg, #00695C 0%, #00897B 100%)',
                color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon sx={{ opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Avance Global · {mesActual} {anioActual}
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={900} letterSpacing={-1} lineHeight={1}>
                {fmtPct(totalActual?.avance_pct)}
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Box display="flex" justifyContent="space-around">
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>Denominador</Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {totalActual?.denominador?.toLocaleString()}
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>Numerador</Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {totalActual?.numerador?.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Gráfico principal */}
          <Grid item xs={12} sm={8} md={5}>
            <GraficoBarras
              titulo={modoVista === 'territorial' ? 'Avance por Provincia' : 'Avance por Red'}
              data={datosGrafico}
            />
          </Grid>

          {/* Gráfico tendencia */}
          <Grid item xs={12} md={4}>
            {loadingResumen
              ? <Box display="flex" justifyContent="center" alignItems="center" height={240}><CircularProgress size={28} /></Box>
              : <GraficoTendencia resumen={resumen} meta={78} />
            }
          </Grid>
        </Grid>
      )}

      {/* ── Tabla ── */}
      {!mes ? (
        <Paper
          elevation={0}
          sx={{
            p: 6, textAlign: 'center', borderRadius: 3,
            border: '2px dashed', borderColor: alpha('#1565C0', 0.2),
            color: 'text.secondary',
          }}
        >
          <PregnantWomanIcon sx={{ fontSize: 52, color: alpha('#1565C0', 0.2), mb: 1 }} />
          <Typography>Selecciona un <strong>Año</strong> y un <strong>Mes</strong> para ver los datos.</Typography>
        </Paper>

      ) : loadingTabla ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={6} gap={2}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">Cargando nominales…</Typography>
        </Box>

      ) : (tabla || tablaRedes) ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3, overflow: 'hidden',
            border: '1px solid',
            borderColor: modoVista === 'territorial' ? alpha('#1565C0', 0.12) : alpha('#00695C', 0.12),
            boxShadow: modoVista === 'territorial'
              ? '0 4px 24px rgba(21,101,192,0.08)'
              : '0 4px 24px rgba(0,105,92,0.08)',
          }}
        >
          {/* Cabecera tabla */}
          <Box
            sx={{
              px: 2.5, py: 1.5,
              bgcolor: modoVista === 'territorial' ? alpha('#1565C0', 0.03) : alpha('#00695C', 0.03),
              borderBottom: '1px solid',
              borderColor: modoVista === 'territorial' ? alpha('#1565C0', 0.10) : alpha('#00695C', 0.10),
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {modoVista === 'territorial' && tabla && (
                <Typography variant="subtitle2" color="text.secondary">
                  {tabla.distritos.length} distritos · {tabla.provincias.length} provincias
                </Typography>
              )}
              {modoVista === 'redes' && tablaRedes && (
                <Typography variant="subtitle2" color="text.secondary">
                  {tablaRedes.establecimientos.length} establecimientos · {tablaRedes.microredes.length} microredes · {tablaRedes.redes.length} redes
                </Typography>
              )}
              <Chip
                label={`${mesActual} ${anioActual}`}
                size="small"
                color={modoVista === 'territorial' ? 'primary' : 'success'}
                variant="outlined"
              />
            </Box>

            {/* Selector de vista jerárquica / plana */}
            <Box display="flex" gap={1}>
              {(['jerarquica', 'plana'] as const).map((v) => (
                <Chip
                  key={v}
                  label={v === 'jerarquica' ? 'Vista jerárquica' : 'Vista plana'}
                  size="small"
                  variant={vista === v ? 'filled' : 'outlined'}
                  color={vista === v ? (modoVista === 'territorial' ? 'primary' : 'success') : 'default'}
                  onClick={() => setVista(v)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* ═══════════════ ORGANIZACIÓN TERRITORIAL ═══════════════ */}
          {modoVista === 'territorial' && tabla && (
            <>
              {vista === 'jerarquica' && (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 1fr 110px 100px 120px',
                      px: 1, py: 1,
                      bgcolor: alpha('#1565C0', 0.06),
                      borderBottom: '2px solid', borderColor: alpha('#1565C0', 0.15),
                    }}
                  >
                    {['', 'DEPARTAMENTO', 'PROVINCIA / DISTRITO', 'Denominador', 'Numerador', 'Avance %'].map((h, i) => (
                      <Typography key={i} variant="caption" fontWeight={700} color="#1A2332"
                        textAlign={i >= 3 ? 'center' : 'left'} sx={{ fontSize: '0.78rem' }}>
                        {h}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
                    {tabla.provincias.map((prov) => (
                      <ProvinciaFila
                        key={`${prov.DEPARTAMENTO}-${prov.PROVINCIA}`}
                        prov={prov} distritos={tabla.distritos} busqueda={busqueda}
                      />
                    ))}
                  </Box>
                  {tabla.total && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 1fr 110px 100px 120px',
                        alignItems: 'center', px: 1, py: 1,
                        bgcolor: '#1565C0', borderTop: '2px solid', borderColor: '#0D47A1',
                      }}
                    >
                      <Box />
                      <Typography variant="body2" fontWeight={900} color="#fff">TOTAL GENERAL</Typography>
                      <Box />
                      <Typography variant="body2" fontWeight={900} color="#fff" textAlign="center">
                        {tabla.total.denominador?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" fontWeight={900} color="#fff" textAlign="center">
                        {tabla.total.numerador?.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" fontWeight={900} color="#fff" textAlign="center">
                        {fmtPct(tabla.total.avance_pct)}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              {vista === 'plana' && (
                <Box sx={{ height: 560 }}>
                  <DataGrid
                    rows={filasPlanasTerritorial} columns={columnasDetalleTerritorial}
                    density="compact" disableColumnMenu
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': { bgcolor: alpha('#1565C0', 0.05), borderBottom: `2px solid ${alpha('#1565C0', 0.15)}` },
                      '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.8rem', color: '#1A2332' },
                      '& .MuiDataGrid-row:hover': { bgcolor: alpha('#1565C0', 0.04) },
                      '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: alpha('#1565C0', 0.015) },
                      '& .MuiDataGrid-cell': { borderColor: alpha('#000', 0.05) },
                      '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${alpha('#000', 0.08)}`, bgcolor: alpha('#1565C0', 0.02) },
                    }}
                  />
                </Box>
              )}
            </>
          )}

          {/* ═══════════════ REDES INTEGRADAS DE SALUD ═══════════════ */}
          {modoVista === 'redes' && tablaRedes && (
            <>
              {vista === 'jerarquica' && (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 1fr 110px 100px 120px',
                      px: 1, py: 1,
                      bgcolor: alpha('#00695C', 0.06),
                      borderBottom: '2px solid', borderColor: alpha('#00695C', 0.15),
                    }}
                  >
                    {['', 'RED / MICRORED', 'ESTABLECIMIENTO', 'Denominador', 'Numerador', 'Avance %'].map((h, i) => (
                      <Typography key={i} variant="caption" fontWeight={700} color="#1A2332"
                        textAlign={i >= 3 ? 'center' : 'left'} sx={{ fontSize: '0.78rem' }}>
                        {h}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
                    {tablaRedes.redes.map((r) => (
                      <RedFila
                        key={r.RED}
                        red={r}
                        microredes={tablaRedes.microredes}
                        establecimientos={tablaRedes.establecimientos}
                        busqueda={busqueda}
                      />
                    ))}
                  </Box>
                  {tablaRedes.total && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 1fr 110px 100px 120px',
                        alignItems: 'center', px: 1, py: 1,
                        bgcolor: '#00695C', borderTop: '2px solid', borderColor: '#004D40',
                      }}
                    >
                      <Box />
                      <Typography variant="body2" fontWeight={900} color="#fff">TOTAL GENERAL</Typography>
                      <Box />
                      <Typography variant="body2" fontWeight={900} color="#fff" textAlign="center">
                        {tablaRedes.total.denominador?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" fontWeight={900} color="#fff" textAlign="center">
                        {tablaRedes.total.numerador?.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" fontWeight={900} color="#fff" textAlign="center">
                        {fmtPct(tablaRedes.total.avance_pct)}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              {vista === 'plana' && (
                <Box sx={{ height: 560 }}>
                  <DataGrid
                    rows={filasRedes} columns={columnasDetalleRedes}
                    density="compact" disableColumnMenu
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': { bgcolor: alpha('#00695C', 0.05), borderBottom: `2px solid ${alpha('#00695C', 0.15)}` },
                      '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.8rem', color: '#1A2332' },
                      '& .MuiDataGrid-row:hover': { bgcolor: alpha('#00695C', 0.04) },
                      '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: alpha('#00695C', 0.015) },
                      '& .MuiDataGrid-cell': { borderColor: alpha('#000', 0.05) },
                      '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${alpha('#000', 0.08)}`, bgcolor: alpha('#00695C', 0.02) },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Paper>
      ) : null}
    </Container>
  );
}