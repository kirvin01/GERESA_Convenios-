// src/components/layout/Sidebar.tsx
import {
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Typography, Box, Divider, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
    Search as SearchIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    LocalHospital as LocalHospitalIcon,
    PregnantWoman as PregnantWomanIcon,
    Bloodtype as BloodtypeIcon,
    ExpandLess,
    ExpandMore,
    Folder as FolderIcon,
} from '@mui/icons-material';
import Collapse from '@mui/material/Collapse';

const DRAWER_WIDTH = 240;

interface NavItem {
    label: string;
    path?: string;
    icon: React.ReactNode;
    permission?: string;
    badge?: string;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    {
        label: 'Admin Usuarios',
        path: '/admin/usuarios',
        icon: <AdminPanelSettingsIcon />,
        permission: 'admin:users',
        badge: 'Admin',
    },

    {
        label: 'Reportes FED',
        icon: <FolderIcon />,
        permission: 'fed:read',

        children: [
            {
                label: 'MC-01.01',
                path: '/reportesFED/fed01',
                icon: <LocalHospitalIcon />,
            },

            {
                label: 'MC-02.01',
                path: '/reportesFED/fed02',
                icon: <LocalHospitalIcon />,
            },

            {
                label: 'MC-03.01',
                path: '/reportesFED/fed03',
                icon: <LocalHospitalIcon />,
            },

             {
                label: 'SI-01.01',
                path: '/reportesFED/fed04',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'SI-01.02',
                path: '/reportesFED/fed05',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'SI-01.03',
                path: '/reportesFED/fed06',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'SI-02.01',
                path: '/reportesFED/fed07',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'SI-02.02',
                path: '/reportesFED/fed08',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'SI-02.03',
                path: '/reportesFED/fed09',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'SI-02.04',
                path: '/reportesFED/fed10',
                icon: <BloodtypeIcon />,
            },

             {
                label: 'SI-03.01',
                path: '/reportesFED/fed11',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'SI-03.02',
                path: '/reportesFED/fed12',
                icon: <BloodtypeIcon />,
            },

            {
                label: 'VI-01.01',
                path: '/reportesFED/fed13',
                icon: <PregnantWomanIcon />,
            },

            {
                label: 'VI-01.02',
                path: '/reportesFED/fed14',
                icon: <PregnantWomanIcon />,
            },

            {
                label: 'Variación Diaria',
                path: '/reportesFED/fed015',
                icon: <LocalHospitalIcon />,
            },

            {
                label: 'Oportunidad y Modificaciones',
                path: '/reportesFED/fed016',
                icon: <LocalHospitalIcon />,
            },
        ],
    },

    {
        label: 'Reportes CG',
        icon: <FolderIcon />,
        permission: 'cg:read',

        children: [
            {
                label: 'CG-10 Salud Bucal',
                path: '/reportesCG/cg10',
                icon: <LocalHospitalIcon />,
            },

            {
                label: 'CG-11',
                path: '/reportesCG/cg11',
                icon: <LocalHospitalIcon />,
            },
        ],
    },

    {
        label: 'Consulta Pacientes',
        icon: <FolderIcon />,
        permission: 'pacientes:read',

        children: [
            {
                label: 'Consulta Pacientes',
                path: '/pacientes',
                icon: <SearchIcon />,
            },
        ],
    },

    
];

interface SidebarProps {
    can: (permission: string) => boolean;
    userIsAdmin: boolean;
    mobileOpen: boolean;
    onClose: () => void;
}

function SidebarContent({ can, userIsAdmin }: { can: (permission: string) => boolean; userIsAdmin: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();

    const visibleItems = navItems.filter((item) => !item.permission || can(item.permission));

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        'Reportes FED': true,
        'Reportes CG': true,
    });

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Brand area below toolbar */}
            <Toolbar />
            <Box sx={{ px: 2, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Menú Principal
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mx: 2 }} />

            <List sx={{ px: 1, pt: 1, flex: 1 }}>
                {visibleItems.map((item) => {
                const hasChildren = !!item.children;

                // MENU CON HIJOS
                if (hasChildren) {
                    return (
                        <Box key={item.label}>
                            <ListItemButton
                                onClick={() =>
                                    setOpenMenus((prev) => ({
                                        ...prev,
                                        [item.label]: !prev[item.label],
                                    }))
                                }
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 38 }}>
                                    {item.icon}
                                </ListItemIcon>

                                <ListItemText primary={item.label} />

                                {openMenus[item.label]
                                    ? <ExpandLess />
                                    : <ExpandMore />}
                            </ListItemButton>

                            <Collapse
                                in={openMenus[item.label]}
                                timeout="auto"
                                unmountOnExit
                            >
                                <List component="div" disablePadding>
                                    {item.children?.map((child) => {
                                        const active =
                                            location.pathname === child.path;

                                        return (
                                            <ListItemButton
                                                key={child.path}
                                                onClick={() =>
                                                    navigate(child.path!)
                                                }
                                                sx={{
                                                    pl: 4,
                                                    borderRadius: 2,
                                                    mb: 0.5,
                                                    bgcolor: active
                                                        ? alpha('#1565C0', 0.1)
                                                        : 'transparent',
                                                }}
                                            >
                                                <ListItemIcon
                                                    sx={{
                                                        minWidth: 32,
                                                        color: active
                                                            ? 'primary.main'
                                                            : 'text.secondary',
                                                    }}
                                                >
                                                    {child.icon}
                                                </ListItemIcon>

                                                <ListItemText
                                                    primary={child.label}
                                                    primaryTypographyProps={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: active
                                                            ? 700
                                                            : 500,
                                                    }}
                                                />
                                            </ListItemButton>
                                        );
                                    })}
                                </List>
                            </Collapse>
                        </Box>
                    );
                }

                // MENU NORMAL
                const active = location.pathname.startsWith(item.path || '');

                return (
                    <ListItemButton
                        key={item.path}
                        onClick={() => navigate(item.path!)}
                        sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            bgcolor: active
                                ? alpha('#1565C0', 0.1)
                                : 'transparent',
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 38,
                                color: active
                                    ? 'primary.main'
                                    : 'text.secondary',
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>

                        <ListItemText
                            primary={item.label}
                        />
                    </ListItemButton>
                );
            })}
            </List>

            <Divider sx={{ mx: 2 }} />
            <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="caption" color="text.disabled">
                    v1.0.0
                </Typography>
            </Box>
        </Box>
    );
}

export function Sidebar({ can, userIsAdmin, mobileOpen, onClose }: SidebarProps) {
    return (
        <>
            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
                }}
            >
                <SidebarContent can={can} userIsAdmin={userIsAdmin} />
            </Drawer>

            {/* Desktop persistent drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        borderRight: '1px solid #e8ecf0',
                        bgcolor: '#fafbfc',
                    },
                }}
            >
                <SidebarContent can={can} userIsAdmin={userIsAdmin} />
            </Drawer>
        </>
    );
}

export { DRAWER_WIDTH };