import { useState, useEffect, useCallback, useMemo } from 'react';
import { InfoCard } from '../components/ui/InfoCard';
import type { Paciente, Atencion, NotificationState } from '../types';
import {
    Box, Button, Typography, Paper, TextField, InputAdornment,
    Alert, CircularProgress, IconButton, Modal, Container,
    Grid, FormControl, InputLabel, Select, MenuItem, Chip,
    Avatar, Divider, Tooltip,
} from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    type GridRenderCellParams,
    type GridPaginationModel,
} from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import {
    Search as SearchIcon,
    Badge as BadgeIcon,
    EventNote as EventNoteIcon,
    Person as PersonIcon,
    Cake as CakeIcon,
    Wc as WcIcon,
    FilterList as FilterListIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { API_CONFIG } from '../config';
import { authHeader } from '../services/authService';
/*
interface Paciente {
    Abrev_Tipo_Doc: string;
    Numero_Documento: string;
    Fecha_Nacimiento: string;
    Genero: string;
    EDAD: number;
    id: string;
}

interface Atencion {
    N: string;
    Id_Cita: string;
    F_ATENCION: string;
    Codigo_Item: string;
    Descripcion_Item: string;
    LAB1: string;
    LAB2: string;
    LAB3: string;
    F_REGISTRO: string;
    F_MODIFICACION: string | null;
    ESTABLECIMIENTO: string;
    'DISTRITO | PROVINCIA': string;
    SISTEMA: string | null;
    REGISTRADOR: string;
    id: string;
}

interface NotificationState {
    key: number;
    severity: 'error' | 'info' | 'warning';
    message: string;
} */

const columnsAtenciones: GridColDef[] = [
    { field: 'N', headerName: '#', width: 50, sortable: false },
    { field: 'F_ATENCION', headerName: 'Fecha', width: 100, sortable: false },
    { field: 'Codigo_Item', headerName: 'Código', width: 90, sortable: false },
    { field: 'Descripcion_Item', headerName: 'Descripción', flex: 1, minWidth: 220, sortable: false },
    { field: 'LAB1', headerName: 'Lab 1', width: 55, sortable: false },
    { field: 'LAB2', headerName: 'Lab 2', width: 55, sortable: false },
    { field: 'LAB3', headerName: 'Lab 3', width: 55, sortable: false },
    { field: 'F_REGISTRO', headerName: 'F. Registro', width: 150, sortable: false },
    { field: 'ESTABLECIMIENTO', headerName: 'Establecimiento', flex: 1, minWidth: 180, sortable: false },
    { field: 'DISTRITO | PROVINCIA', headerName: 'Dist. | Prov.', width: 150, sortable: false },
    { field: 'SISTEMA', headerName: 'Sistema', width: 110, sortable: false },
    { field: 'REGISTRADOR', headerName: 'Registrador', width: 180, sortable: false },
];
/*
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
            borderRadius: 2, bgcolor: alpha('#1565C0', 0.04),
            border: '1px solid', borderColor: alpha('#1565C0', 0.1), minWidth: 0,
        }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#1565C0', 0.1), color: 'primary.main' }}>
                {icon}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>{value}</Typography>
            </Box>
        </Box>
    );
} */

export function PatientsPage() {
    const [ndoc, setNdoc] = useState('');
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loadingPacientes, setLoadingPacientes] = useState(false);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
    const [atenciones, setAtenciones] = useState<Atencion[]>([]);
    const [loadingAtenciones, setLoadingAtenciones] = useState(false);
    const [selectedAnio, setSelectedAnio] = useState<number>(new Date().getFullYear());
    const [selectedMes, setSelectedMes] = useState<number>(new Date().getMonth() + 1);
    const [filtroCodigo, setFiltroCodigo] = useState('');
    const [pacientesPaginationModel, setPacientesPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });
    const [atencionesPaginationModel, setAtencionesPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });

    const anios = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
    const meses = [
        { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
    ];

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: { ...authHeader(), ...(options.headers as object) },
        });
        if (response.status === 401) throw new Error('Sesión expirada');
        return response;
    }, []);

    const handleSearchPacientes = async () => {
        if (loadingPacientes || !ndoc) return;
        setLoadingPacientes(true);
        setNotification(null);
        setPacientes([]);
        try {
            const response = await apiFetch(`${API_CONFIG.baseURL}/paciente?ndoc=${encodeURIComponent(ndoc)}`);
            if (!response.ok) throw new Error('Error del servidor');
            const data = await response.json();
            const resultados = data.result || [];
            const pacientesData = resultados.map((p: Paciente, index: number) => ({
                ...p,
                id: `${p.Numero_Documento}-${p.Abrev_Tipo_Doc}-${index}`,
            }));
            setPacientes(pacientesData);
            if (pacientesData.length === 0)
                setNotification({ key: Date.now(), severity: 'info', message: 'No se encontraron pacientes con ese documento.' });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error de conexión con el servidor.';
            setNotification({ key: Date.now(), severity: 'error', message: msg });
        } finally {
            setLoadingPacientes(false);
        }
    };

    const fetchAtenciones = useCallback(async (signal?: AbortSignal) => {
        if (!selectedPaciente) return;
        setLoadingAtenciones(true);
        try {
            const params = new URLSearchParams({
                anio: selectedAnio.toString(),
                mes: selectedMes.toString(),
                ndoc: selectedPaciente.Numero_Documento,
            });
            const response = await apiFetch(`${API_CONFIG.baseURL}/atenciones?${params.toString()}`, { signal });
            if (!response.ok) throw new Error('Error del servidor');
            const data = await response.json();
            const atencionesData = (data.result || []).map((a: Atencion) => ({
                ...a,
                id: `${a.Id_Cita}-${a.Codigo_Item}`,
            }));
            setAtenciones(atencionesData);
            if (atencionesData.length === 0) {
                setNotification({
                    key: Date.now(), severity: 'info',
                    message: `Sin atenciones en ${meses.find(m => m.value === selectedMes)?.label} ${selectedAnio}.`,
                });
            } else {
                setNotification(null);
            }
        } catch (error: unknown) {
            const name = error instanceof Error ? error.name : '';
            const msg = error instanceof Error ? error.message : '';
            if (name === 'AbortError' || msg === 'Sesión expirada') return;
            setNotification({ key: Date.now(), severity: 'error', message: 'Error al cargar atenciones.' });
        } finally {
            setLoadingAtenciones(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFetch, selectedAnio, selectedMes, selectedPaciente]);

    useEffect(() => {
        const controller = new AbortController();
        if (modalOpen && selectedPaciente) fetchAtenciones(controller.signal);
        return () => controller.abort();
    }, [modalOpen, selectedPaciente, selectedAnio, selectedMes, fetchAtenciones]);

    const handleOpenModal = (paciente: Paciente) => {
        setSelectedPaciente(paciente);
        setSelectedAnio(new Date().getFullYear());
        setSelectedMes(new Date().getMonth() + 1);
        setFiltroCodigo('');
        setNotification(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setAtenciones([]);
        setNotification(null);
    };

    const filteredAtenciones = atenciones.filter((a) =>
        a.Codigo_Item.toLowerCase().includes(filtroCodigo.toLowerCase()) ||
        a.Descripcion_Item?.toLowerCase().includes(filtroCodigo.toLowerCase())
    );

    const columnsPacientes: GridColDef[] = useMemo(() => [
        {
            field: 'Abrev_Tipo_Doc', headerName: 'Tipo', width: 80, sortable: false,
            headerAlign: 'center', align: 'center',
            renderCell: (p) => <Chip label={p.value} size="small" color="primary" variant="outlined" />,
        },
        { field: 'Numero_Documento', headerName: 'N° Documento', flex: 1, minWidth: 130, sortable: false, headerAlign: 'center', align: 'center' },
        { field: 'Fecha_Nacimiento', headerName: 'Fec. Nacimiento', flex: 1, minWidth: 130, sortable: false, headerAlign: 'center', align: 'center' },
        {
            field: 'Genero', headerName: 'Género', flex: 1, minWidth: 100, sortable: false,
            headerAlign: 'center', align: 'center',
            renderCell: (p) => (
                <Chip
                    label={p.value === 'M' ? 'Masculino' : 'Femenino'}
                    size="small"
                    sx={{
                        bgcolor: p.value === 'M' ? alpha('#1565C0', 0.1) : alpha('#E91E63', 0.1),
                        color: p.value === 'M' ? '#1565C0' : '#E91E63',
                        fontWeight: 600, border: 'none',
                    }}
                />
            ),
        },
        {
            field: 'EDAD', headerName: 'Edad', type: 'number', width: 70, sortable: false,
            headerAlign: 'center', align: 'center',
            renderCell: (p) => <Typography variant="body2" fontWeight={700} color="primary">{p.value} a.</Typography>,
        },
        {
            field: 'actions', headerName: 'Atenciones', sortable: false,
            headerAlign: 'center', align: 'center', width: 130,
            renderCell: (params: GridRenderCellParams) => (
                <Tooltip title="Ver historial de atenciones">
                    <Button
                        variant="contained" size="small" color="primary"
                        startIcon={<EventNoteIcon fontSize="small" />}
                        onClick={() => handleOpenModal(params.row as Paciente)}
                        sx={{ fontSize: '0.75rem' }}
                    >
                        Ver
                    </Button>
                </Tooltip>
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Consulta de Pacientes
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Busca un paciente por número de documento y revisa su historial de atenciones.
            </Typography>

            {/* Búsqueda */}
            <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3,
                border: '1px solid', borderColor: alpha('#1565C0', 0.12),
                boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
            }}>
                <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon fontSize="small" /> Búsqueda de Pacientes
                </Typography>
                <Box
                    component="form"
                    onSubmit={(e) => { e.preventDefault(); handleSearchPacientes(); }}
                    sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}
                >
                    <TextField
                        fullWidth
                        label="Número de Documento"
                        placeholder="Ingrese DNI..."
                        value={ndoc}
                        onChange={(e) => setNdoc(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <BadgeIcon color="action" fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loadingPacientes || !ndoc}
                        sx={{ minWidth: { xs: '100%', sm: '140px' }, height: 56 }}
                        startIcon={loadingPacientes ? undefined : <SearchIcon />}
                    >
                        {loadingPacientes ? <CircularProgress size={22} color="inherit" /> : 'Buscar'}
                    </Button>
                </Box>

                {notification && !modalOpen && (
                    <Alert severity={notification.severity} sx={{ mt: 2, borderRadius: 2 }} key={notification.key}>
                        {notification.message}
                    </Alert>
                )}
            </Paper>

            {/* Resultados */}
            {pacientes.length > 0 && (
                <Paper elevation={0} sx={{
                    borderRadius: 3, overflow: 'hidden',
                    border: '1px solid', borderColor: alpha('#1565C0', 0.12),
                    boxShadow: '0 4px 24px rgba(21,101,192,0.08)',
                }}>
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha('#1565C0', 0.03), borderBottom: '1px solid', borderColor: alpha('#1565C0', 0.1) }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            {pacientes.length} resultado{pacientes.length !== 1 ? 's' : ''} encontrado{pacientes.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                    <DataGrid
                        rows={pacientes}
                        columns={columnsPacientes}
                        loading={loadingPacientes}
                        onRowDoubleClick={(params) => handleOpenModal(params.row as Paciente)}
                        autoHeight
                        disableColumnMenu
                        disableColumnSelector
                        paginationModel={pacientesPaginationModel}
                        onPaginationModelChange={setPacientesPaginationModel}
                        pageSizeOptions={[5, 10, 20]}
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': { bgcolor: alpha('#1565C0', 0.05), borderBottom: `2px solid ${alpha('#1565C0', 0.15)}` },
                            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.8rem', color: '#1A2332' },
                            '& .MuiDataGrid-row:hover': { bgcolor: alpha('#1565C0', 0.04) },
                            '& .MuiDataGrid-cell': { borderColor: alpha('#000', 0.05) },
                            '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${alpha('#000', 0.08)}` },
                        }}
                    />
                </Paper>
            )}

            {/* ── Modal atenciones ─────────────────────────────────────── */}
            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    // Altura fija para que el DataGrid interno tenga espacio acotado y haga scroll
                    width: { xs: '100%', sm: '96vw' },
                    maxWidth: 1400,
                    height: { xs: '100dvh', sm: '92vh' },
                    bgcolor: 'background.paper',
                    borderRadius: { xs: 0, sm: 3 },
                    boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>

                    {/* Header ── fixed */}
                    <Box sx={{
                        px: { xs: 2, md: 3 }, py: 1.75,
                        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexShrink: 0,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                                <EventNoteIcon fontSize="small" />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ lineHeight: 1.2 }}>
                                    Historial de Atenciones
                                </Typography>
                                {selectedPaciente && (
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                        {selectedPaciente.Abrev_Tipo_Doc}: {selectedPaciente.Numero_Documento}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <IconButton
                            onClick={handleCloseModal}
                            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Info paciente ── fixed */}
                    {selectedPaciente && (
                        <Box sx={{
                            px: { xs: 2, md: 3 }, py: 1.5,
                            bgcolor: alpha('#1565C0', 0.02),
                            borderBottom: '1px solid', borderColor: alpha('#1565C0', 0.1),
                            flexShrink: 0,
                        }}>
                            <Grid container spacing={1.5}>
                                <Grid item xs={6} sm={3}>
                                    <InfoCard
                                        icon={<PersonIcon fontSize="small" />}
                                        label="Documento"
                                        value={`${selectedPaciente.Abrev_Tipo_Doc}: ${selectedPaciente.Numero_Documento}`}
                                    />
                                </Grid>

                                <Grid item xs={6} sm={3}>
                                    <InfoCard
                                        icon={<CakeIcon fontSize="small" />}
                                        label="Nacimiento"
                                        value={selectedPaciente.Fecha_Nacimiento}
                                    />
                                </Grid>

                                <Grid item xs={6} sm={3}>
                                    <InfoCard
                                        icon={<WcIcon fontSize="small" />}
                                        label="Género"
                                        value={selectedPaciente.Genero === 'M' ? 'Masculino' : 'Femenino'}
                                    />
                                </Grid>

                                <Grid item xs={6} sm={3}>
                                    <InfoCard
                                        icon={<BadgeIcon fontSize="small" />}
                                        label="Edad"
                                        value={`${selectedPaciente.EDAD} años`}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Filtros ── fixed */}
                    <Box sx={{
                        px: { xs: 2, md: 3 }, py: 1.5,
                        borderBottom: '1px solid', borderColor: alpha('#000', 0.07),
                        flexShrink: 0,
                    }}>
                        <Grid container spacing={1.5} alignItems="center">
                            <Grid item xs={12} sm={5} md={4}>
                                <TextField
                                    fullWidth size="small"
                                    label="Buscar por código o descripción"
                                    value={filtroCodigo}
                                    onChange={(e) => setFiltroCodigo(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <FilterListIcon fontSize="small" color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={3} md={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Año</InputLabel>
                                    <Select value={selectedAnio} label="Año" onChange={(e) => setSelectedAnio(Number(e.target.value))}>
                                        {anios.map((anio) => <MenuItem key={anio} value={anio}>{anio}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} sm={4} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Mes</InputLabel>
                                    <Select value={selectedMes} label="Mes" onChange={(e) => setSelectedMes(Number(e.target.value))}>
                                        {meses.map((mes) => <MenuItem key={mes.value} value={mes.value}>{mes.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                {!loadingAtenciones && (
                                    <Chip
                                        label={`${filteredAtenciones.length} atención${filteredAtenciones.length !== 1 ? 'es' : ''}`}
                                        color="primary" variant="outlined" size="small"
                                        icon={<EventNoteIcon />}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Notificación ── fixed */}
                    {notification && (
                        <Box sx={{ px: { xs: 2, md: 3 }, pt: 1, flexShrink: 0 }}>
                            <Alert severity={notification.severity} key={notification.key} sx={{ borderRadius: 2 }}>
                                {notification.message}
                            </Alert>
                        </Box>
                    )}

                    {/* DataGrid ── SCROLLABLE: flex: 1 + height: 0 para que no desborde */}
                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        {loadingAtenciones ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, gap: 2 }}>
                                <CircularProgress size={32} />
                                <Typography color="text.secondary">Cargando atenciones...</Typography>
                            </Box>
                        ) : (
                            <DataGrid
                                rows={filteredAtenciones}
                                columns={columnsAtenciones}
                                paginationModel={atencionesPaginationModel}
                                onPaginationModelChange={setAtencionesPaginationModel}
                                pageSizeOptions={[15, 25, 50, 100]}
                                density="compact"
                                // NO autoHeight — dejamos que ocupe el flex restante
                                sx={{
                                    flex: 1,
                                    border: 'none',
                                    '& .MuiDataGrid-columnHeaders': { bgcolor: alpha('#1565C0', 0.06), borderBottom: `2px solid ${alpha('#1565C0', 0.15)}` },
                                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.78rem' },
                                    '& .MuiDataGrid-cell': { fontSize: '0.76rem', borderColor: alpha('#000', 0.04) },
                                    '& .MuiDataGrid-row:hover': { bgcolor: alpha('#1565C0', 0.04) },
                                    '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: alpha('#1565C0', 0.015) },
                                    '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${alpha('#000', 0.08)}`, bgcolor: alpha('#1565C0', 0.02) },
                                    // Hace que el viewport interno del DataGrid ocupe el contenedor
                                    '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
                                }}
                                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                            />
                        )}
                    </Box>

                    {/* Footer ── fixed */}
                    <Divider />
                    <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                        <Button variant="outlined" onClick={handleCloseModal} sx={{ minWidth: 100 }}>
                            Cerrar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Container>
    );
}