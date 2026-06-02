// src/components/layout/Footer.tsx
import { Box, Typography } from '@mui/material';

export function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                py: 1.5,
                px: 3,
                mt: 'auto',
                borderTop: '1px solid #e8ecf0',
                bgcolor: '#fafbfc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
            }}
        >
            <Typography variant="caption" color="text.disabled">
                © {new Date().getFullYear()} Gerencia Regional de Salud Cusco — Dirección de Estadística, Informática y Telecomunicaciones
            </Typography>
            <Typography variant="caption" color="text.disabled">
                Sistema de Historial de Atenciones v1.0
            </Typography>
        </Box>
    );
}