import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppLayout() {
    const { currentUser, userIsAdmin, logout, can } = useAuthContext();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Header
                currentUser={currentUser}
                onLogout={logout}
                onToggleSidebar={() => setMobileOpen((prev) => !prev)}
            />

            <Sidebar
                can={can}
                userIsAdmin={userIsAdmin}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    ml: { md: '40px' },
                    minWidth: 0,
                    bgcolor: 'background.default',
                }}
            >
                <Toolbar />
                <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
                    <Outlet />
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}
