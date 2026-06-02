import { useState, type FormEvent } from 'react';
import {
    Box, Paper, Avatar, Typography, TextField, Button,
    CircularProgress, Alert, InputAdornment, IconButton,
} from '@mui/material';
import {
    LockOutlined as LockOutlinedIcon,
    LocalHospital as LocalHospitalIcon,
    AccountCircle as AccountCircleIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { API_CONFIG } from '../config';
import { login } from '../services/authService';
import logo from '../assets/logo.webp';

interface LoginPageProps {
    onLoginSuccess: (username: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        setLoading(true);
        setError(null);

        try {
            await login(API_CONFIG.baseURL, { username, password });
            onLoginSuccess(username);
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', width: '100%',
            background: 'linear-gradient(135deg, #0d47a1 0%, #1565C0 45%, #1976D2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            px: 2,
        }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                {[...Array(3)].map((_, i) => (
                    <Box key={i} sx={{
                        position: 'absolute',
                        width: { xs: 200, md: 350 + i * 100 },
                        height: { xs: 200, md: 350 + i * 100 },
                        borderRadius: '50%',
                        border: '1px solid',
                        borderColor: 'rgba(255,255,255,0.08)',
                        top: `${-10 + i * 15}%`,
                        right: `${-15 + i * 5}%`,
                    }} />
                ))}
                <Box sx={{
                    position: 'absolute', bottom: '-5%', left: '-5%',
                    width: { xs: 200, md: 400 }, height: { xs: 200, md: 400 },
                    borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                }} />
            </Box>

            <Paper elevation={0} sx={{
                width: '100%', maxWidth: 420,
                borderRadius: 4, overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                position: 'relative',
            }}>
                <Box sx={{
                    px: 4, pt: 4, pb: 3,
                    background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                }}>
                    <Avatar 
                    src={logo}
                    alt="Logo GERESA"
                    sx={{
                        width: 64, height: 64,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}>
                        <LocalHospitalIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={700} color="white" sx={{ lineHeight: 1.2 }}>
                            GERENCIA REGIONAL DE SALUD
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Sistema de Historial de Atenciones
                        </Typography>
                    </Box>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ px: 4, py: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <LockOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                            Iniciar Sesión
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircleIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading || !username || !password}
                            sx={{ mt: 1, height: 48 }}
                        >
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Ingresar'}
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ px: 4, pb: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.disabled">
                        Dirección de Estadística, Informática y Telecomunicaciones
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
