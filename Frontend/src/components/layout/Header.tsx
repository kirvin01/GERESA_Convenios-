// src/components/layout/Header.tsx
import {
    AppBar, Toolbar, Box, Typography, Chip, IconButton,
    List, ListItem, ListItemText,
} from '@mui/material';
import Tooltip, { tooltipClasses, type TooltipProps } from '@mui/material/Tooltip';
import { alpha, styled } from '@mui/material/styles';
import {
    AccountCircle as AccountCircleIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Storage as StorageIcon,
    CloudDownload as CloudDownloadIcon, // Ícono para la nube/descarga
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import logo from '../../assets/logo.webp';
import { configFedService, type ConfigFed } from '../../services/servicesFED/configFedService';

// Estilo para un Tooltip más grande
const LargeTooltip = styled(
    ({ className, ...props }: TooltipProps & { className?: string }) => (
        <Tooltip {...props} classes={{ popper: className }} />
    )
)(({ theme }) => ({
    [`& .MuiTooltip-tooltip`]: {
        maxWidth: 350,
        fontSize: '0.875rem',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: theme.shadows[4],

        '& .MuiList-root': {
            marginTop: theme.spacing(1),
        },

        '& .MuiListItem-root': {
            padding: '4px 0',
        },
    },
}));

interface HeaderProps {
    currentUser: string;
    onLogout: () => void;
    onToggleSidebar: () => void;
}

export function Header({ currentUser, onLogout, onToggleSidebar }: HeaderProps) {
    const [fuentesStr, setFuentesStr] = useState<string>('Cargando...');
    const [detalleFuentes, setDetalleFuentes] = useState<ConfigFed[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFuentesDatos = async () => {
        try {
            setLoading(true);
            // Usamos la función que obtiene todo el detalle
            const { fuente, detalle } = await configFedService.getFuentesConDetalle();
            setFuentesStr(fuente);
            setDetalleFuentes(detalle);
        } catch (error) {
            console.error('Error al cargar fuentes:', error);
            setFuentesStr('DBFED2026 | Tabla Config');
            setDetalleFuentes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFuentesDatos();
        // Recargar cada 5 minutos
        const interval = setInterval(loadFuentesDatos, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // URL para el logo de Excel
    const excelReportUrl = "https://cloud.diresacusco.gob.pe/s/N9wD9oHtyrjBjtt";

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                background: 'linear-gradient(135deg, #0d47a1 0%, #1565C0 60%, #1976D2 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            <Toolbar sx={{ gap: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                {/* --- SECCIÓN IZQUIERDA: Logo y Título --- */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={onToggleSidebar}
                        sx={{ display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box
                        component="img"
                        src={logo}
                        alt="Logo"
                        sx={{
                            width: 38,
                            height: 38,
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.25)',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            padding: '4px',
                        }}
                    />
                    
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ lineHeight: 1.1 }}>
                            GERENCIA REGIONAL DE SALUD CUSCO
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: { xs: 'none', sm: 'block' } }}>
                            Sistema de Información en Salud
                        </Typography>
                    </Box>
                </Box>

                {/* --- SECCIÓN CENTRAL: Fuente de Datos --- */}
                <LargeTooltip 
                    title={
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                                Fuentes de Datos Activas
                            </Typography>
                            {detalleFuentes.length > 0 ? (
                                <List dense sx={{ p: 0 }}>
                                    {detalleFuentes.map((f) => (
                                        <ListItem key={f.id} sx={{ px: 0, py: 0.5 }}>
                                            <ListItemText 
                                                primary={f.fuente}
                                                secondary={f.fecha_formateada ? `Última actualización: ${f.fecha_formateada}` : 'Fecha no disponible'}
                                                primaryTypographyProps={{ 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: 'bold',
                                                    color: '#90caf9' 
                                                }}
                                                secondaryTypographyProps={{ 
                                                    fontSize: '0.75rem',
                                                    color: '#ccc'
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2">No hay fuentes configuradas</Typography>
                            )}
                        </Box>
                    } 
                    arrow
                    placement="bottom"
                >
                    <Chip
                        icon={<StorageIcon sx={{ fontSize: '18px !important' }} />}
                        label={loading ? "Cargando fuentes..." : fuentesStr}
                        size="medium" // Un poco más grande
                        variant="outlined"
                        sx={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.5)',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiChip-label': { 
                                fontSize: '0.85rem', 
                                fontWeight: 600,
                                letterSpacing: '0.3px',
                            },
                            '& .MuiChip-icon': {
                                fontSize: '20px',
                            },
                            display: { xs: 'none', md: 'flex' },
                            cursor: 'pointer',
                            height: '32px', // Altura fija
                        }}
                    />
                </LargeTooltip>

                {/* --- SECCIÓN DERECHA: Usuario, Excel y Logout --- */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        icon={<AccountCircleIcon sx={{ color: 'rgba(255,255,255,0.85) !important', fontSize: '18px !important' }} />}
                        label={currentUser}
                        size="small"
                        sx={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.35)',
                            fontWeight: 600,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            display: { xs: 'none', sm: 'flex' },
                        }}
                    />
                    
                    {/* Nuevo Botón/Logo de Excel */}
                    <Tooltip title="Ingresar a la nube de datos nominales (Excel)" placement="bottom" arrow>
                        <IconButton
                            component="a"
                            href={excelReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.25)',
                                bgcolor: 'rgba(255,255,255,0.08)',
                                '&:hover': { bgcolor: alpha('#1b5e20', 0.6) }, // Color verde oscuro al pasar
                            }}
                        >
                            <CloudDownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Cerrar sesión">
                        <IconButton
                            onClick={onLogout}
                            size="small"
                            sx={{
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.25)',
                                bgcolor: 'rgba(255,255,255,0.08)',
                                '&:hover': { bgcolor: alpha('#d32f2f', 0.5) },
                            }}
                        >
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
}