import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Container, Paper, Typography, Button, Stack } from '@mui/material';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={<Typography variant="h6">Dashboard</Typography>}
        >
            <Head title="Dashboard" />

            <Container sx={{ py: 6 }}>
                <Paper sx={{ p: 3 }} elevation={1}>
                    <Stack spacing={2}>
                        <Typography>You're logged in!</Typography>
                        <Button variant="contained">Contoh Tombol MUI</Button>
                    </Stack>
                </Paper>
            </Container>
        </AuthenticatedLayout>
    );
}
