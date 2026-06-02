import { type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthContext } from './context/AuthContext';
import { getDefaultRoute } from './config/permissions';
import { LoginPage } from './pages/LoginPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { PatientsPage } from './pages/PatientsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { CG10Page } from './pages/CG/CG10Page';
import { HisDiarioPage } from './pages/FED/HisDiarioPage';
import { FedMC0301Page } from './pages/FED/FedMC0301Page';
import { FedSI0101Page } from './pages/FED/FedSI0101Page';
import { FedMC0201Page } from './pages/FED/FedMC0201Page';
import { FedSI0102Page } from './pages/FED/FedSI0102Page';
import { FedSI0103Page } from './pages/FED/FedSI0103Page';
import { FedSI0201Page } from './pages/FED/FedSI0201Page';
import { FedSI0202Page } from './pages/FED/FedSI0202Page';
import { FedSI0203Page } from './pages/FED/FedSI0203Page';
import { FedSI0204Page } from './pages/FED/FedSI0204Page';
import { FedSI0301Page } from './pages/FED/FedSI0301Page';
import { FedSI0302Page } from './pages/FED/FedSI0302Page';
import { FedVI0102Page } from './pages/FED/FedVI0102Page';
import { FedVI0101Page } from './pages/FED/FedVI0101Page';
import { OportunidadModificacionesPage } from './pages/FED/OportunidadModificacionesPage';
import { FedMC0101Page } from './pages/FED/FedMC0101Page';

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
