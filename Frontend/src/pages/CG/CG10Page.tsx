// src/components/CG10Page.tsx
// Convenio de Gestión CG-10

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Container, Grid,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Chip, Avatar,
  Collapse, IconButton, TextField, InputAdornment,
  Divider, ToggleButton, ToggleButtonGroup, Tooltip,
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
  ChildCare as ChildCareIcon,
  AccountTree as AccountTreeIcon,
  Hub as HubIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import {
  cgCG10Service,
  type FiltrosCG10,
  type SubindicadoresCols,
  type TablaCompletaCG10,
  type TablaRedesCG10,
  type ProvinciaRowCG10,
  type DistritoRowCG10,
  type RedRowCG10,
  type MicroredRowCG10,
  type EstablecimientoRowCG10,
  type ResumenRowCG10,
} from '../../services/servicesCG/cgCG10Service';

// ── Constantes de subindicadores ──────────────────────────────────────────────

const SUBIND = [
  { key: 'ho', label: 'Higiene Oral',   short: 'HO', color: '#7B1FA2' },
  { key: 'an', label: 'Asesoría Nutricional',       short: 'AN', color: '#1565C0' },
  { key: 'fb', label: 'Flúor Barniz',                short: 'FB', color: '#E65100' },
  { key: 'pd', label: 'Profilaxis Dental',     short: 'PD', color: '#2E7D32' },
  { key: 'as', label: 'Sellantes',      short: 'AS', color: '#00695C' },
] as const;


type ModoVista = 'territorial' | 'redes';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtPct = (v: number | null | undefined) =>
  v == null ? '—' : `${Number(v).toFixed(2)}%`;

const pctColor = (v: number | null | undefined): 'success' | 'warning' | 'error' | 'default' => {
  if (v == null) return 'default';
  if (v >= 80)  return 'success';
  if (v >= 50)  return 'warning';
  return 'error';
};

// ── Columnas subindicadores para DataGrid ─────────────────────────────────────

const colsSubind = SUBIND.map<GridColDef>((s) => ({
  field: `${s.key}_pct`,
  headerName: s.short,
  width: 80,
  headerAlign: 'center',
  align: 'center',
  type: 'number',

  renderHeader: () => (
    <Tooltip title={s.label}>
      <Typography
        variant="caption"
        fontWeight={700}
        color={s.color}
      >
        {s.short} %
      </Typography>
    </Tooltip>
  ),

  renderCell: (p) => (
    <Chip
      label={fmtPct(p.value as number)}
      color={pctColor(p.value as number)}
      size="small"
      sx={{
        fontWeight: 700,
        minWidth: 60,
        fontSize: '0.7rem',
      }}
    />
  ),
}));

const columnasPlanasTerritorial: GridColDef[] = [
  { field: 'DEPARTAMENTO', headerName: 'Depto.',      width: 90,  sortable: false },
  { field: 'PROVINCIA',    headerName: 'Provincia',   width: 110, sortable: false },
  { field: 'DISTRITO',     headerName: 'Distrito',    flex: 1, minWidth: 130, sortable: false },
  { field: 'denominador',  headerName: 'Denom.',      width: 80,  type: 'number', headerAlign: 'center', align: 'center' },
  { field: 'numerador',    headerName: 'Numer.',      width: 75,  type: 'number', headerAlign: 'center', align: 'center' },
  {
    field: 'avance_pct', headerName: 'Avance %', width: 105, headerAlign: 'center', align: 'center',
    renderCell: (p) => <Chip label={fmtPct(p.value as number)} color={pctColor(p.value as number)}
      size="small" sx={{ fontWeight: 700, minWidth: 72 }} />,
  },
  ...colsSubind,
];

const columnasPlanaRedes: GridColDef[] = [
  { field: 'RED',             headerName: 'Red',            width: 130, sortable: false },
  { field: 'MICRORED',        headerName: 'Microred',       width: 140, sortable: false },
  { field: 'ESTABLECIMIENTO', headerName: 'Establecimiento', flex: 1, minWidth: 140, sortable: false },
  { field: 'denominador',     headerName: 'Denom.',         width: 80,  type: 'number', headerAlign: 'center', align: 'center' },
  { field: 'numerador',       headerName: 'Numer.',         width: 75,  type: 'number', headerAlign: 'center', align: 'center' },
  {
    field: 'avance_pct', headerName: 'Avance %', width: 105, headerAlign: 'center', align: 'center',
    renderCell: (p) => <Chip label={fmtPct(p.value as number)} color={pctColor(p.value as number)}
      size="small" sx={{ fontWeight: 700, minWidth: 72 }} />,
  },
  ...colsSubind,
];

// ── Sub-componente: mini chips de subindicadores en fila ──────────────────────

function SubindChips({ row, small = false }: { row: SubindicadoresCols; small?: boolean }) {
  return (
    <Box display="flex" gap={0.5} flexWrap="wrap">
      {SUBIND.map((s) => {
        const pct = row[`${s.key}_pct` as keyof SubindicadoresCols] as number;
        return (
          <Tooltip key={s.key} title={`${s.label}: ${fmtPct(pct)}`}>
            <Chip
              label={`${s.short} ${fmtPct(pct)}`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: small ? '0.65rem' : '0.7rem',
                bgcolor: alpha(s.color, 0.12),
                color: s.color,
                border: `1px solid ${alpha(s.color, 0.3)}`,
                height: small ? 18 : 22,
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}

// ── Sub-componente: fila provincia colapsable ─────────────────────────────────

function ProvinciaFila({
  prov, distritos, busqueda,
}: {
  prov: ProvinciaRowCG10; distritos: DistritoRowCG10[]; busqueda: string;
}) {
  const [open, setOpen] = useState(true);
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
          display: 'grid', gridTemplateColumns: '36px 110px 1fr 90px 80px 110px 1fr',
          alignItems: 'center', px: 1, py: 0.75,
          bgcolor: alpha('#1565C0', 0.09), cursor: 'pointer',
          borderBottom: '1px solid', borderColor: alpha('#1565C0', 0.14),
          '&:hover': { bgcolor: alpha('#1565C0', 0.14) },
        }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="body2" fontWeight={700} color="primary.dark" sx={{ fontSize: '0.78rem' }}>
          {prov.DEPARTAMENTO}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="primary.dark">Total {prov.PROVINCIA}</Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{prov.denominador}</Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{prov.numerador}</Typography>
        <Box display="flex" justifyContent="center">
          <Chip label={fmtPct(prov.avance_pct)} color={pctColor(prov.avance_pct)}
            size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
        </Box>
        <SubindChips row={prov} small />
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {filas.map((d) => (
          <Box
            key={d.DISTRITO}
            sx={{
              display: 'grid', gridTemplateColumns: '36px 110px 1fr 90px 80px 110px 1fr',
              alignItems: 'center', px: 1, py: 0.45,
              borderBottom: '1px solid', borderColor: alpha('#000', 0.04),
              '&:hover': { bgcolor: alpha('#1565C0', 0.04) },
            }}
          >
            <Box />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{d.DEPARTAMENTO}</Typography>
            <Typography variant="body2" sx={{ pl: 1, fontSize: '0.8rem' }}>{d.DISTRITO}</Typography>
            <Typography variant="body2" textAlign="center">{d.denominador}</Typography>
            <Typography variant="body2" textAlign="center">{d.numerador}</Typography>
            <Box display="flex" justifyContent="center">
              <Chip label={fmtPct(d.avance_pct)} color={pctColor(d.avance_pct)}
                size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
            </Box>
            <SubindChips row={d} small />
          </Box>
        ))}
      </Collapse>
    </>
  );
}

// ── Sub-componente: fila Red colapsable ───────────────────────────────────────

function RedFila({
  red, microredes, establecimientos, busqueda,
}: {
  red: RedRowCG10; microredes: MicroredRowCG10[];
  establecimientos: EstablecimientoRowCG10[]; busqueda: string;
}) {
  const [open, setOpen] = useState(true);
  const mrDeRed = useMemo(() => microredes.filter((m) => m.RED === red.RED), [microredes, red.RED]);

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
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'grid', gridTemplateColumns: '36px 1fr 1fr 90px 80px 110px 1fr',
          alignItems: 'center', px: 1, py: 0.75,
          bgcolor: alpha('#00695C', 0.09), cursor: 'pointer',
          borderBottom: '1px solid', borderColor: alpha('#00695C', 0.14),
          '&:hover': { bgcolor: alpha('#00695C', 0.14) },
        }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="body2" fontWeight={700} color="success.dark">{red.RED}</Typography>
        <Typography variant="body2" fontWeight={700} color="success.dark">Total Red</Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{red.denominador}</Typography>
        <Typography variant="body2" fontWeight={700} textAlign="center">{red.numerador}</Typography>
        <Box display="flex" justifyContent="center">
          <Chip label={fmtPct(red.avance_pct)} color={pctColor(red.avance_pct)}
            size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
        </Box>
        <SubindChips row={red} small />
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {mrDeRed.map((mr) => (
          <MicroredFila
            key={`${mr.RED}-${mr.MICRORED}`}
            microred={mr} establecimientos={establecimientos} busqueda={busqueda}
          />
        ))}
      </Collapse>
    </>
  );
}

function MicroredFila({
  microred, establecimientos, busqueda,
}: {
  microred: MicroredRowCG10; establecimientos: EstablecimientoRowCG10[]; busqueda: string;
}) {
  const [open, setOpen] = useState(true);
  const filas = useMemo(() => {
    const q = busqueda.toUpperCase();
    return establecimientos.filter(
      (e) => e.RED === microred.RED && e.MICRORED === microred.MICRORED &&
        (!q || e.ESTABLECIMIENTO.toUpperCase().includes(q) || e.MICRORED.toUpperCase().includes(q)),
    );
  }, [establecimientos, microred.RED, microred.MICRORED, busqueda]);

  if (busqueda && filas.length === 0) return null;

  return (
    <>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'grid', gridTemplateColumns: '36px 36px 1fr 90px 80px 110px 1fr',
          alignItems: 'center', px: 1, py: 0.55,
          bgcolor: alpha('#00695C', 0.04), cursor: 'pointer',
          borderBottom: '1px solid', borderColor: alpha('#00695C', 0.08),
          '&:hover': { bgcolor: alpha('#00695C', 0.08) },
        }}
      >
        <Box />
        <IconButton size="small" sx={{ p: 0 }}>
          {open ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="body2" fontWeight={600} color="success.dark" sx={{ fontSize: '0.8rem' }}>
          {microred.MICRORED}
        </Typography>
        <Typography variant="body2" fontWeight={600} textAlign="center">{microred.denominador}</Typography>
        <Typography variant="body2" fontWeight={600} textAlign="center">{microred.numerador}</Typography>
        <Box display="flex" justifyContent="center">
          <Chip label={fmtPct(microred.avance_pct)} color={pctColor(microred.avance_pct)}
            size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
        </Box>
        <SubindChips row={microred} small />
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {filas.map((e) => (
          <Box
            key={`${e.MICRORED}-${e.ESTABLECIMIENTO}`}
            sx={{
              display: 'grid', gridTemplateColumns: '36px 36px 1fr 90px 80px 110px 1fr',
              alignItems: 'center', px: 1, py: 0.4,
              borderBottom: '1px solid', borderColor: alpha('#000', 0.04),
              '&:hover': { bgcolor: alpha('#00695C', 0.04) },
            }}
          >
            <Box /><Box />
            <Typography variant="body2" sx={{ pl: 1, fontSize: '0.78rem' }}>{e.ESTABLECIMIENTO}</Typography>
            <Typography variant="body2" textAlign="center">{e.denominador}</Typography>
            <Typography variant="body2" textAlign="center">{e.numerador}</Typography>
            <Box display="flex" justifyContent="center">
              <Chip label={fmtPct(e.avance_pct)} color={pctColor(e.avance_pct)}
                size="small" sx={{ fontWeight: 700, minWidth: 72 }} />
            </Box>
            <SubindChips row={e} small />
          </Box>
        ))}
      </Collapse>
    </>
  );
}

// ── KPI Cards de subindicadores ───────────────────────────────────────────────

function SubindicadoresKPIs({ total }: { total: SubindicadoresCols }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, borderRadius: 3,
        border: '1px solid', borderColor: alpha('#1565C0', 0.12),
        boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5}>
        Avance por Subindicador
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1.5}>
        {SUBIND.map((s) => {
          const pct = total[`${s.key}_pct` as keyof SubindicadoresCols] as number;
          const cumple = total[`${s.key}_cumple` as keyof SubindicadoresCols] as number;
          return (
            <Box
              key={s.key}
              sx={{
                flex: '1 1 130px',
                p: 1.5, borderRadius: 2,
                bgcolor: alpha(s.color, 0.07),
                border: `1px solid ${alpha(s.color, 0.20)}`,
              }}
            >
              <Typography variant="caption" fontWeight={700} color={s.color} display="block">
                {s.label}
              </Typography>
              <Typography variant="h5" fontWeight={900} color={s.color} lineHeight={1.2} mt={0.5}>
                {fmtPct(pct)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cumple?.toLocaleString()} / {total.denominador?.toLocaleString()}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

// ── Gráfico Radar de subindicadores ──────────────────────────────────────────

function GraficoRadar({ total }: { total: SubindicadoresCols }) {
  const data = SUBIND.map((s) => ({
    subject: s.label,
    'Avance %': total[`${s.key}_pct` as keyof SubindicadoresCols] as number ?? 0,
  }));
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, borderRadius: 3, height: '100%',
        border: '1px solid', borderColor: alpha('#1565C0', 0.12),
        boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
        Radar de Subindicadores
      </Typography>
      <ResponsiveContainer width="100%" height={190}>
        <RadarChart data={data}>
          <PolarGrid stroke={alpha('#000', 0.1)} />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
          <Radar name="Avance %" dataKey="Avance %" stroke="#1565C0" fill={alpha('#1565C0', 0.25)} />
          <RTooltip formatter={(v) => [`${v}%`, 'Avance']} />
        </RadarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

// ── Gráfico de tendencia mensual ──────────────────────────────────────────────

function GraficoTendencia({ resumen }: { resumen: ResumenRowCG10[] }) {
  if (!resumen.length) return null;
  const data = resumen.map((r) => ({
    name:        r.Desc_Mes.slice(0, 3),
    'Avance %':  r.avance_pct,
    Denominador: r.total_denominador,
    Numerador:   r.total_numerador,
  }));
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, borderRadius: 3,
        border: '1px solid', borderColor: alpha('#1565C0', 0.12),
        boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5}>
        Tendencia Anual — Avance %
      </Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis unit="%" tick={{ fontSize: 10 }} />
          <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v ?? 0}%`, 'Avance']} />
          <Bar dataKey="Avance %" fill="#2E7D32" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

// ── Cabecera de tabla jerárquica ──────────────────────────────────────────────

function CabeceraTabla({ modo }: { modo: ModoVista }) {
  const headers = modo === 'territorial'
    ? ['', 'DEPTO.', 'PROVINCIA / DISTRITO', 'Denom.', 'Numer.', 'Avance %', 'Subindicadores']
    : ['', 'RED / MICRORED', 'ESTABLECIMIENTO', 'Denom.', 'Numer.', 'Avance %', 'Subindicadores'];
  const color = modo === 'territorial' ? '#1565C0' : '#00695C';
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: modo === 'territorial'
          ? '36px 110px 1fr 90px 80px 110px 1fr'
          : '36px 1fr 1fr 90px 80px 110px 1fr',
        px: 1, py: 1,
        bgcolor: alpha(color, 0.06),
        borderBottom: '2px solid', borderColor: alpha(color, 0.15),
      }}
    >
      {headers.map((h, i) => (
        <Typography key={i} variant="caption" fontWeight={700} color="#1A2332"
          textAlign={i >= 3 && i <= 5 ? 'center' : 'left'} sx={{ fontSize: '0.77rem' }}>
          {h}
        </Typography>
      ))}
    </Box>
  );
}

// ── Fila total general ────────────────────────────────────────────────────────

function FilaTotalGeneral({ total, color }: { total: SubindicadoresCols; color: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 1fr 90px 80px 110px 1fr',
        alignItems: 'center', px: 1, py: 1,
        bgcolor: color, borderTop: '2px solid', borderColor: alpha('#000', 0.2),
      }}
    >
      <Box />
      <Typography variant="body2" fontWeight={900} color="#fff">TOTAL GENERAL</Typography>
      <Box />
      <Typography variant="body2" fontWeight={900} color="#fff" textAlign="center">
        {total.denominador?.toLocaleString()}
      </Typography>
      <Typography variant="body2" fontWeight={900} color="#fff" textAlign="center">
        {total.numerador?.toLocaleString()}
      </Typography>
      <Typography variant="body1" fontWeight={900} color="#fff" textAlign="center">
        {fmtPct(total.avance_pct)}
      </Typography>
      <Box display="flex" gap={0.5} flexWrap="wrap">
        {SUBIND.map((s) => {
          const pct = total[`${s.key}_pct` as keyof SubindicadoresCols] as number;
          return (
            <Chip key={s.key} label={`${s.short} ${fmtPct(pct)}`} size="small"
              sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff',
                height: 18, border: '1px solid rgba(255,255,255,0.35)' }} />
          );
        })}
      </Box>
    </Box>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function CG10Page() {
  // ── Estado de modo ──
  const [modoVista, setModoVista] = useState<ModoVista>('territorial');

  // ── Filtros comunes ──
  const [filtros,      setFiltros]      = useState<FiltrosCG10 | null>(null);
  const [anio,         setAnio]         = useState<number>(0);
  const [mes,          setMes]          = useState<string>('');
  const [grupo,        setGrupo]        = useState<string>('');
  const [busqueda,     setBusqueda]     = useState<string>('');
  const [vista,        setVista]        = useState<'jerarquica' | 'plana'>('jerarquica');

  // ── Filtros territoriales ──
  const [departamento, setDepartamento] = useState<string>('');
  const [provincia,    setProvincia]    = useState<string>('');

  // ── Filtros de redes ──
  const [red,      setRed]      = useState<string>('');
  const [microred, setMicrored] = useState<string>('');

  // ── Datos ──
  const [tabla,          setTabla]          = useState<TablaCompletaCG10 | null>(null);
  const [tablaRedes,     setTablaRedes]     = useState<TablaRedesCG10 | null>(null);
  const [resumen,        setResumen]        = useState<ResumenRowCG10[]>([]);
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [loadingTabla,   setLoadingTabla]   = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [notification,   setNotification]  = useState<{ severity: 'error' | 'info'; message: string } | null>(null);

  // ── Cargar filtros ──
  useEffect(() => {
    const ctrl = new AbortController();
    cgCG10Service.getFiltros(ctrl.signal)
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

  // ── Cargar resumen ──
  useEffect(() => {
    if (!anio) return;
    const ctrl = new AbortController();
    setLoadingResumen(true);
    cgCG10Service.getResumen(
      {
        anio,
        departamento: modoVista === 'territorial' ? departamento || undefined : undefined,
        red:          modoVista === 'redes'        ? red          || undefined : undefined,
        grupo:        grupo || undefined,
      },
      ctrl.signal,
    )
      .then((r) => setResumen(r.data))
      .catch((e: Error) => { if (e.name !== 'AbortError') setResumen([]); })
      .finally(() => setLoadingResumen(false));
    return () => ctrl.abort();
  }, [anio, departamento, red, grupo, modoVista]);

  // ── Cargar tabla territorial ──
  const cargarTablaCompleta = useCallback((signal?: AbortSignal) => {
    if (!anio || !mes || modoVista !== 'territorial') return;
    setLoadingTabla(true);
    setNotification(null);
    cgCG10Service.getTablaCompleta(
      { anio, mes, departamento: departamento || undefined, provincia: provincia || undefined, grupo: grupo || undefined },
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
  }, [anio, mes, departamento, provincia, grupo, modoVista]);

  // ── Cargar tabla redes ──
  const cargarTablaRedes = useCallback((signal?: AbortSignal) => {
    if (!anio || !mes || modoVista !== 'redes') return;
    setLoadingTabla(true);
    setNotification(null);
    cgCG10Service.getTablaRedes(
      { anio, mes, red: red || undefined, microred: microred || undefined, grupo: grupo || undefined },
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
  }, [anio, mes, red, microred, grupo, modoVista]);

  useEffect(() => {
    const ctrl = new AbortController();
    if (modoVista === 'territorial') cargarTablaCompleta(ctrl.signal);
    else cargarTablaRedes(ctrl.signal);
    return () => ctrl.abort();
  }, [modoVista, cargarTablaCompleta, cargarTablaRedes]);

  // ── Cambio de modo ──
  const handleModoVista = (_: React.MouseEvent<HTMLElement>, nuevo: ModoVista | null) => {
    if (!nuevo) return;
    setModoVista(nuevo);
    setTabla(null);
    setTablaRedes(null);
    setNotification(null);
    setBusqueda('');
  };

  // ── Selects dependientes ──
  const provinciasFiltradas = useMemo(
    () => filtros?.provincias.filter((p) => !departamento || p.departamento === departamento) ?? [],
    [filtros, departamento],
  );
  const microredesFiltradas = useMemo(
    () => filtros?.microredes.filter((m) => !red || m.red === red) ?? [],
    [filtros, red],
  );

  // ── Filas planas ──
  const filasPlanasTerritorial = useMemo(() => {
    if (!tabla) return [];
    const q = busqueda.toUpperCase();
    return tabla.distritos
      .filter((d) => !q || d.DISTRITO.toUpperCase().includes(q) || d.PROVINCIA.toUpperCase().includes(q))
      .map((d, i) => ({ ...d, id: i }));
  }, [tabla, busqueda]);

  const filasRedes = useMemo(() => {
    if (!tablaRedes) return [];
    const q = busqueda.toUpperCase();
    return tablaRedes.establecimientos
      .filter((e) => !q || e.ESTABLECIMIENTO.toUpperCase().includes(q) || e.MICRORED.toUpperCase().includes(q))
      .map((e, i) => ({ ...e, id: i }));
  }, [tablaRedes, busqueda]);

  const totalActual = modoVista === 'territorial' ? tabla?.total : tablaRedes?.total;
  const mesActual   = modoVista === 'territorial' ? tabla?.mes   : tablaRedes?.mes;
  const anioActual  = modoVista === 'territorial' ? tabla?.anio  : tablaRedes?.anio;
  const colorModo   = modoVista === 'territorial' ? '#1565C0'    : '#00695C';

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
        <Avatar sx={{ bgcolor: alpha('#F57F17', 0.12), color: '#F57F17', width: 44, height: 44 }}>
          <ChildCareIcon />
        </Avatar>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h4" fontWeight={700}>CG-10</Typography>
            <Chip label="Convenio de Gestión" size="small" variant="outlined"
              sx={{ borderColor: alpha('#F57F17', 0.5), color: '#E65100', fontWeight: 600 }} />
          </Box>
          <Typography color="text.secondary">
            Porcentaje de niñas y niños (6 meses a 6 años, 11 meses y 29 días) que reciben procedimientos estomatológicos preventivos. 
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* ── Toggle de vista ── */}
      <Box display="flex" justifyContent="center" mb={3}>
        <ToggleButtonGroup
          value={modoVista} exclusive onChange={handleModoVista}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid', borderColor: alpha('#1565C0', 0.20),
            borderRadius: 3, overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(21,101,192,0.10)',
            '& .MuiToggleButton-root': {
              px: 3, py: 1.2, fontWeight: 600, fontSize: '0.88rem',
              textTransform: 'none', border: 'none', gap: 0.8, color: 'text.secondary',
              '&.Mui-selected': { bgcolor: colorModo, color: '#fff', '&:hover': { bgcolor: colorModo } },
              '&:hover': { bgcolor: alpha(colorModo, 0.06) },
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
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary"
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

          {/* Grupo etario */}
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Grupo etario</InputLabel>
              <Select value={grupo} label="Grupo etario" onChange={(e) => setGrupo(e.target.value as string)}>
                <MenuItem value="">Todos</MenuItem>
                {filtros?.grupos.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtros condicionales */}
          {modoVista === 'territorial' && (
            <>
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Departamento</InputLabel>
                  <Select value={departamento} label="Departamento"
                    onChange={(e) => { setDepartamento(e.target.value as string); setProvincia(''); }}>
                    <MenuItem value="">Todos</MenuItem>
                    {filtros?.departamentos.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
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
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Red</InputLabel>
                  <Select value={red} label="Red"
                    onChange={(e) => { setRed(e.target.value as string); setMicrored(''); }}>
                    <MenuItem value="">Todas</MenuItem>
                    {filtros?.redes.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
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
      {totalActual && (
        <Grid container spacing={2} mb={3}>

          {/* KPI avance global */}
          <Grid item xs={12} sm={6} md={3}>
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
                {fmtPct(totalActual.avance_pct)}
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.25)' }} />
              <Box display="flex" justifyContent="space-around">
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>Denominador</Typography>
                  <Typography variant="h6" fontWeight={700}>{totalActual.denominador?.toLocaleString()}</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>Numerador</Typography>
                  <Typography variant="h6" fontWeight={700}>{totalActual.numerador?.toLocaleString()}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Radar subindicadores */}
          <Grid item xs={12} sm={6} md={3}>
            <GraficoRadar total={totalActual} />
          </Grid>

          {/* KPIs subindicadores */}
          <Grid item xs={12} md={4}>
            <SubindicadoresKPIs total={totalActual} />
          </Grid>

          {/* Tendencia */}
          <Grid item xs={12} md={2}>
            {loadingResumen
              ? <Box display="flex" justifyContent="center" alignItems="center" height={240}><CircularProgress size={28} /></Box>
              : <GraficoTendencia resumen={resumen} />
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
            border: '2px dashed', borderColor: alpha('#F57F17', 0.25),
            color: 'text.secondary',
          }}
        >
          <ChildCareIcon sx={{ fontSize: 52, color: alpha('#F57F17', 0.2), mb: 1 }} />
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
            border: '1px solid', borderColor: alpha(colorModo, 0.12),
            boxShadow: `0 4px 24px ${alpha(colorModo, 0.08)}`,
          }}
        >
          {/* Cabecera tabla */}
          <Box
            sx={{
              px: 2.5, py: 1.5,
              bgcolor: alpha(colorModo, 0.03),
              borderBottom: '1px solid', borderColor: alpha(colorModo, 0.10),
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
                  {tablaRedes.establecimientos.length} establecimientos · {tablaRedes.microredes.length} microredes
                </Typography>
              )}
              <Chip
                label={`${mesActual} ${anioActual}`} size="small"
                color={modoVista === 'territorial' ? 'primary' : 'success'} variant="outlined"
              />
            </Box>
            <Box display="flex" gap={1}>
              {(['jerarquica', 'plana'] as const).map((v) => (
                <Chip key={v}
                  label={v === 'jerarquica' ? 'Vista jerárquica' : 'Vista plana'}
                  size="small"
                  variant={vista === v ? 'filled' : 'outlined'}
                  color={vista === v ? (modoVista === 'territorial' ? 'primary' : 'success') : 'default'}
                  onClick={() => setVista(v)} sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* ═══════════ ORGANIZACIÓN TERRITORIAL ═══════════ */}
          {modoVista === 'territorial' && tabla && (
            <>
              {vista === 'jerarquica' && (
                <>
                  <CabeceraTabla modo="territorial" />
                  <Box sx={{ maxHeight: 560, overflowY: 'auto' }}>
                    {tabla.provincias.map((prov) => (
                      <ProvinciaFila
                        key={`${prov.DEPARTAMENTO}-${prov.PROVINCIA}`}
                        prov={prov} distritos={tabla.distritos} busqueda={busqueda}
                      />
                    ))}
                  </Box>
                  {tabla.total && <FilaTotalGeneral total={tabla.total} color="#1565C0" />}
                </>
              )}
              {vista === 'plana' && (
                <Box sx={{ height: 580 }}>
                  <DataGrid
                    rows={filasPlanasTerritorial} columns={columnasPlanasTerritorial}
                    density="compact" disableColumnMenu
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': { bgcolor: alpha('#1565C0', 0.05), borderBottom: `2px solid ${alpha('#1565C0', 0.15)}` },
                      '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.78rem', color: '#1A2332' },
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

          {/* ═══════════ REDES INTEGRADAS DE SALUD ═══════════ */}
          {modoVista === 'redes' && tablaRedes && (
            <>
              {vista === 'jerarquica' && (
                <>
                  <CabeceraTabla modo="redes" />
                  <Box sx={{ maxHeight: 560, overflowY: 'auto' }}>
                    {tablaRedes.redes.map((r) => (
                      <RedFila
                        key={r.RED} red={r}
                        microredes={tablaRedes.microredes}
                        establecimientos={tablaRedes.establecimientos}
                        busqueda={busqueda}
                      />
                    ))}
                  </Box>
                  {tablaRedes.total && <FilaTotalGeneral total={tablaRedes.total} color="#00695C" />}
                </>
              )}
              {vista === 'plana' && (
                <Box sx={{ height: 580 }}>
                  <DataGrid
                    rows={filasRedes} columns={columnasPlanaRedes}
                    density="compact" disableColumnMenu
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': { bgcolor: alpha('#00695C', 0.05), borderBottom: `2px solid ${alpha('#00695C', 0.15)}` },
                      '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.78rem', color: '#1A2332' },
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