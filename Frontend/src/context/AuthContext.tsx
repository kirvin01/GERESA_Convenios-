import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { hasPermission as checkPermission } from '../config/permissions';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { setUnauthorizedHandler } from '../services/apiClient';
import {
    getCurrentRole,
    getCurrentUser,
    isAdmin,
    isAuthenticated,
    logout as clearSession,
    type AppRole,
} from '../services/authService';

interface AuthContextValue {
    authenticated: boolean;
    currentUser: string;
    role: AppRole | null;
    userIsAdmin: boolean;
    can: (permission: string) => boolean;
    logout: () => void;
    refreshAuth: () => void;
    onLoginSuccess: (username: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const [authenticated, setAuthenticated] = useState(isAuthenticated());
    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [role, setRole] = useState<AppRole | null>(getCurrentRole());

    const refreshAuth = useCallback(() => {
        const ok = isAuthenticated();
        setAuthenticated(ok);
        setCurrentUser(ok ? getCurrentUser() : '');
        setRole(ok ? getCurrentRole() : null);
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setAuthenticated(false);
        setCurrentUser('');
        setRole(null);
        navigate('/login', { replace: true });
    }, [navigate]);

    const onLoginSuccess = useCallback(
        (username: string) => {
            refreshAuth();
            setCurrentUser(username);
            setAuthenticated(true);
            setRole(getCurrentRole());
        },
        [refreshAuth],
    );

    useEffect(() => {
        setUnauthorizedHandler(logout);
        refreshAuth();
    }, [logout, refreshAuth]);

    useInactivityLogout(() => {
        if (authenticated) logout();
    }, authenticated);

    const value = useMemo<AuthContextValue>(
        () => ({
            authenticated,
            currentUser,
            role,
            userIsAdmin: isAdmin(),
            can: (permission: string) => checkPermission(role, permission),
            logout,
            refreshAuth,
            onLoginSuccess,
        }),
        [authenticated, currentUser, role, logout, refreshAuth, onLoginSuccess],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider');
    return ctx;
}
