// src/components/ui/InfoCard.tsx
import { Box, Avatar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface InfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

export function InfoCard({ icon, label, value }: InfoCardProps) {
    return (
        <Box
            sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                borderRadius: 2, bgcolor: alpha('#1565C0', 0.04),
                border: '1px solid', borderColor: alpha('#1565C0', 0.1), minWidth: 0,
            }}
        >
            <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#1565C0', 0.1), color: 'primary.main' }}>
                {icon}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}