// src/pages/AdminUsersPage.tsx
import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import {
    Box, Typography, Paper, Button, TextField, Dialog,
    DialogTitle, DialogContent, DialogActions, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Chip, CircularProgress, Alert, Tooltip,
    FormControl, InputLabel, Select, MenuItem, InputAdornment,
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    AccountCircle as AccountCircleIcon,
    Lock as LockIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { API_CONFIG } from '../config';
import { authHeader } from '../services/authService';
/*
interface User {
    id: number;
    username: string;
    role: string;
}*/

interface UserForm {
    username: string;
    password: string;
    role: string;
}

const EMPTY_FORM: UserForm = { username: '', password: '', role: 'atenciones' };

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    fed: 'Indicadores FED',
    cg: 'Convenios de Gestión',
    atenciones: 'Historias de Atenciones',
    user: 'Historias de Atenciones',
};

export function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState<UserForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3500);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_CONFIG.baseURL}/usuarios`, { headers: authHeader() });
            if (res.status === 401) { setError('Sesión expirada, recarga la página.'); return; }
            if (!res.ok) throw new Error(`Error ${res.status}: no se pudo cargar la lista.`);
            const data = await res.json();
            // La API devuelve { users: [...] } según el backend original
            setUsers(Array.isArray(data) ? data : (data.users ?? []));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // ── Abrir dialogs ──────────────────────────────────────────
    const openCreate = () => {
        setEditingUser(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setDialogOpen(true);
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setForm({ username: user.username, password: '', role: user.role });
        setFormError(null);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setFormError(null);
    };

    // ── Guardar (crear o editar) ───────────────────────────────
    const handleSave = async () => {
        if (!form.username.trim()) { setFormError('El nombre de usuario es obligatorio.'); return; }
        if (!editingUser && !form.password) { setFormError('La contraseña es obligatoria al crear un usuario.'); return; }

        setSaving(true);
        setFormError(null);
        try {
            const params = new URLSearchParams({ username: form.username, role: form.role });
            // Solo incluir password si se escribió algo (en edición es opcional)
            if (form.password) params.append('password', form.password);

            const url = editingUser
                ? `${API_CONFIG.baseURL}/usuarios/${editingUser.id}?${params.toString()}`
                : `${API_CONFIG.baseURL}/usuarios?${params.toString()}`;

            const res = await fetch(url, {
                method: editingUser ? 'PUT' : 'POST',
                headers: authHeader(),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.detail || `Error ${res.status}`);
            }

            closeDialog();
            await fetchUsers();
            showSuccess(editingUser ? `Usuario "${form.username}" actualizado.` : `Usuario "${form.username}" creado.`);
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    // ── Eliminar ──────────────────────────────────────────────
    const handleDelete = async (user: User) => {
        if (!window.confirm(`¿Eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(user.id);
        try {
            const res = await fetch(`${API_CONFIG.baseURL}/usuarios/${user.id}`, {
                method: 'DELETE',
                headers: authHeader(),
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            await fetchUsers();
            showSuccess(`Usuario "${user.username}" eliminado.`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al eliminar.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Box sx={{ mt: 3, mb: 4 }}>
            {/* Título */}
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Administración de Usuarios
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Gestiona los accesos y permisos del sistema GERESA.
            </Typography>

            {/* Alertas globales */}
            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    {success}
                </Alert>
            )}

            <Paper elevation={0} sx={{
                p: 3, borderRadius: 3,
                border: '1px solid', borderColor: alpha('#1565C0', 0.12),
                boxShadow: '0 4px 24px rgba(21,101,192,0.06)',
            }}>
                {/* Toolbar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Usuarios del sistema
                        <Chip
                            label={users.length}
                            size="small"
                            color="primary"
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Recargar lista">
                            <IconButton onClick={fetchUsers} disabled={loading} size="small">
                                {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<PersonAddIcon />}
                            onClick={openCreate}
                        >
                            Nuevo usuario
                        </Button>
                    </Box>
                </Box>

                {/* Tabla */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: alpha('#1565C0', 0.05), fontWeight: 700, fontSize: '0.8rem' } }}>
                                <TableCell>ID</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No hay usuarios registrados.
                                    </TableCell>
                                </TableRow>
                            ) : users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    hover
                                    sx={{ '&:last-child td': { border: 0 } }}
                                >
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                        {user.id}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                        {user.username}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ROLE_LABELS[user.role] ?? user.role}
                                            size="small"
                                            color={user.role === 'admin' ? 'secondary' : 'default'}
                                            icon={user.role === 'admin' ? <AdminIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                                            variant="outlined"
                                            sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                         <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => openEdit(user)}
                                                sx={{ mr: 0.5 }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(user)}
                                                disabled={deletingId === user.id}
                                            >
                                                {deletingId === user.id
                                                    ? <CircularProgress size={14} color="error" />
                                                    : <DeleteIcon fontSize="small" />
                                                }
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ── Dialog crear / editar ──────────────────────────────── */}
            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    {editingUser ? `Editar usuario: ${editingUser.username}` : 'Crear nuevo usuario'}
                </DialogTitle>

                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                    {formError && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Nombre de usuario"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
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
                        label={editingUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon color="action" fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={form.role}
                            label="Rol"
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <MenuItem value="admin">Administrador</MenuItem>
                            <MenuItem value="fed">Indicadores FED</MenuItem>
                            <MenuItem value="cg">Convenios de Gestión</MenuItem>
                            <MenuItem value="atenciones">Historias de Atenciones</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={closeDialog} color="inherit" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        {saving ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear usuario'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}