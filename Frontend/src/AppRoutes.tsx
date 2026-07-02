import { lazy, type ComponentType, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthContext } from './context/AuthContext';
import { getDefaultRoute } from './config/permissions';
import { LoginPage } from './pages/LoginPage';
import { ForbiddenPage } from './pages/ForbiddenPage';

function lazyPage<T extends Record<string, ComponentType<unknown>>>(
    factory: () => Promise<T>,
    name: keyof T,
) {
    return lazy(() => factory().then((mod) => ({ default: mod[name] })));
}

const PatientsPage = lazyPage(() => import('./pages/PatientsPage'), 'PatientsPage');
const AdminUsersPage = lazyPage(() => import('./pages/AdminUsersPage'), 'AdminUsersPage');
const CG10Page = lazyPage(() => import('./pages/CG/CG10Page'), 'CG10Page');
const HisDiarioPage = lazyPage(() => import('./pages/FED/HisDiarioPage'), 'HisDiarioPage');
const FedMC0101Page = lazyPage(() => import('./pages/FED/FedMC0101Page'), 'FedMC0101Page');
const FedMC0201Page = lazyPage(() => import('./pages/FED/FedMC0201Page'), 'FedMC0201Page');
const FedMC0301Page = lazyPage(() => import('./pages/FED/FedMC0301Page'), 'FedMC0301Page');
const FedSI0101Page = lazyPage(() => import('./pages/FED/FedSI0101Page'), 'FedSI0101Page');
const FedSI0102Page = lazyPage(() => import('./pages/FED/FedSI0102Page'), 'FedSI0102Page');
const FedSI0103Page = lazyPage(() => import('./pages/FED/FedSI0103Page'), 'FedSI0103Page');
const FedSI0201Page = lazyPage(() => import('./pages/FED/FedSI0201Page'), 'FedSI0201Page');
const FedSI0202Page = lazyPage(() => import('./pages/FED/FedSI0202Page'), 'FedSI0202Page');
const FedSI0203Page = lazyPage(() => import('./pages/FED/FedSI0203Page'), 'FedSI0203Page');
const FedSI0204Page = lazyPage(() => import('./pages/FED/FedSI0204Page'), 'FedSI0204Page');
const FedSI0301Page = lazyPage(() => import('./pages/FED/FedSI0301Page'), 'FedSI0301Page');
const FedSI0302Page = lazyPage(() => import('./pages/FED/FedSI0302Page'), 'FedSI0302Page');
const FedVI0101Page = lazyPage(() => import('./pages/FED/FedVI0101Page'), 'FedVI0101Page');
const FedVI0102Page = lazyPage(() => import('./pages/FED/FedVI0102Page'), 'FedVI0102Page');
const OportunidadModificacionesPage = lazyPage(
    () => import('./pages/FED/OportunidadModificacionesPage'),
    'OportunidadModificacionesPage',
);

export function PageLoader() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
            <CircularProgress />
        </Box>
    );
}

function RequireAuth({ children }: { children: ReactNode }) {
    const { authenticated } = useAuthContext();
    return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
    const { authenticated, can } = useAuthContext();
    if (!authenticated) return <Navigate to="/login" replace />;
    if (!can(permission)) return <ForbiddenPage />;
    return <>{children}</>;
}

export function AppRoutes() {
    const { authenticated, role, onLoginSuccess } = useAuthContext();

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    authenticated ? (
                        <Navigate to={getDefaultRoute(role)} replace />
                    ) : (
                        <LoginPage onLoginSuccess={onLoginSuccess} />
                    )
                }
            />

            <Route
                element={
                    <RequireAuth>
                        <AppLayout />
                    </RequireAuth>
                }
            >
                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="/pacientes" element={<RequirePermission permission="pacientes:read"><PatientsPage /></RequirePermission>} />
                <Route path="/admin/usuarios" element={<RequirePermission permission="admin:users"><AdminUsersPage /></RequirePermission>} />
                <Route path="/reportesFED/fed01" element={<RequirePermission permission="fed:read"><FedMC0101Page /></RequirePermission>} />
                <Route path="/reportesFED/fed02" element={<RequirePermission permission="fed:read"><FedMC0201Page /></RequirePermission>} />
                <Route path="/reportesFED/fed03" element={<RequirePermission permission="fed:read"><FedMC0301Page /></RequirePermission>} />
                <Route path="/reportesFED/fed04" element={<RequirePermission permission="fed:read"><FedSI0101Page /></RequirePermission>} />
                <Route path="/reportesFED/fed05" element={<RequirePermission permission="fed:read"><FedSI0102Page /></RequirePermission>} />
                <Route path="/reportesFED/fed06" element={<RequirePermission permission="fed:read"><FedSI0103Page /></RequirePermission>} />
                <Route path="/reportesFED/fed07" element={<RequirePermission permission="fed:read"><FedSI0201Page /></RequirePermission>} />
                <Route path="/reportesFED/fed08" element={<RequirePermission permission="fed:read"><FedSI0202Page /></RequirePermission>} />
                <Route path="/reportesFED/fed09" element={<RequirePermission permission="fed:read"><FedSI0203Page /></RequirePermission>} />
                <Route path="/reportesFED/fed10" element={<RequirePermission permission="fed:read"><FedSI0204Page /></RequirePermission>} />
                <Route path="/reportesFED/fed11" element={<RequirePermission permission="fed:read"><FedSI0301Page /></RequirePermission>} />
                <Route path="/reportesFED/fed12" element={<RequirePermission permission="fed:read"><FedSI0302Page /></RequirePermission>} />
                <Route path="/reportesFED/fed13" element={<RequirePermission permission="fed:read"><FedVI0101Page /></RequirePermission>} />
                <Route path="/reportesFED/fed14" element={<RequirePermission permission="fed:read"><FedVI0102Page /></RequirePermission>} />
                <Route path="/reportesFED/fed015" element={<RequirePermission permission="fed:read"><HisDiarioPage /></RequirePermission>} />
                <Route path="/reportesFED/fed016" element={<RequirePermission permission="fed:read"><OportunidadModificacionesPage /></RequirePermission>} />
                <Route path="/reportesCG/cg10" element={<RequirePermission permission="cg:read"><CG10Page /></RequirePermission>} />
                <Route path="/reportesCG/cg11" element={<RequirePermission permission="cg:read"><CG10Page /></RequirePermission>} />
                <Route path="/" element={<Navigate to={getDefaultRoute(role)} replace />} />
            </Route>

            <Route path="*" element={<Navigate to={authenticated ? getDefaultRoute(role) : '/login'} replace />} />
        </Routes>
    );
}
