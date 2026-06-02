import { Box, Button, Paper, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { getDefaultRoute } from '../config/permissions';

export function ForbiddenPage() {
    const navigate = useNavigate();
    const { role } = useAuthContext();

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 420 }}>
                <LockOutlinedIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    Acceso denegado
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Su perfil no tiene permisos para ver esta sección.
                </Typography>
                <Button variant="contained" onClick={() => navigate(getDefaultRoute(role))}>
                    Ir a mi inicio
                </Button>
            </Paper>
        </Box>
    );
}
