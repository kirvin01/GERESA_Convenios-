// src/theme/index.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: { main: '#1565C0', light: '#42a5f5', dark: '#0d47a1' },
        secondary: { main: '#00897B' },
        background: { default: '#EEF2F7', paper: '#ffffff' },
        text: { primary: '#1A2332', secondary: '#5A6A7E' },
    },
    typography: {
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        h4: { fontWeight: 700, letterSpacing: '-0.5px' },
        h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
                contained: {
                    boxShadow: '0 2px 8px rgba(21,101,192,0.3)',
                    '&:hover': { boxShadow: '0 4px 16px rgba(21,101,192,0.4)' },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } },
            },
        },
        MuiPaper: {
            styleOverrides: { root: { backgroundImage: 'none' } },
        },
    },
});