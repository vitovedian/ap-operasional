import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Stack,
    MenuItem,
} from '@mui/material';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

export default function UsersIndex({ users, filters, roles = [], currentUserId }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const onSearch = (e) => {
        e.preventDefault();
        router.get(route('users.index'), { search }, { preserveState: true, replace: true });
    };

    const defaultRoleSelection = roles.includes('Karyawan')
        ? ['Karyawan']
        : roles.length > 0
            ? [roles[0]]
            : [];

    const [form, setForm] = useState({ name: '', email: '', password: '', roles: defaultRoleSelection });
    const [editForm, setEditForm] = useState({ name: '', email: '', password: '', roles: [] });

    const submitCreate = (e) => {
        e.preventDefault();
        router.post(route('users.store'), form, {
            onSuccess: () => {
                setForm({ name: '', email: '', password: '', roles: defaultRoleSelection });
                setOpenCreate(false);
            },
        });
    };

    const onDelete = (user) => {
        if (confirm(`Hapus user ${user.name}?`)) {
            router.delete(route('users.destroy', user.id));
        }
    };

    const openEditDialog = (u) => {
        setEditingUser(u);
        setEditForm({
            name: u.name,
            email: u.email,
            password: '',
            roles: Array.isArray(u.roles) && u.roles.length ? [...u.roles] : defaultRoleSelection,
        });
        setOpenEdit(true);
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        if (!editingUser) return;
        const payload = {
            name: editForm.name,
            email: editForm.email,
        };
        if (editForm.password && editForm.password.length > 0) {
            payload.password = editForm.password;
        }
        payload.roles = editForm.roles;
        router.put(route('users.update', editingUser.id), payload, {
            preserveScroll: true,
            onSuccess: () => setOpenEdit(false),
        });
    };

    // Simple mobile pagination helpers
    const firstLink = users.links?.[0] || {};
    const lastLink = users.links?.[users.links.length - 1] || {};

    return (<>
        <SidebarLayout header={<Typography variant="h6">Users</Typography>}>
            <Head title="Users" />

            <Container sx={{ py: 2 }}>
                <Stack spacing={3}>
                    {flash?.success && (
                        <Paper sx={{ p: 2 }}>
                            <Typography color="success.main">{flash.success}</Typography>
                        </Paper>
                    )}

                    <Paper sx={{ p: 2 }}>
                        <form onSubmit={onSearch}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                <TextField
                                    size="small"
                                    label="Search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    fullWidth
                                />
                                <Button type="submit" variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' } }}>Cari</Button>
                            </Stack>
                        </form>
                    </Paper>

                    <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">Manajemen Pengguna</Typography>
                        <Button variant="contained" onClick={() => setOpenCreate(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            Tambah User
                        </Button>
                    </Paper>

                    {isMobile ? (
                        <>
                            {users.data.map((u) => (
                                <Paper key={u.id} sx={{ p: 2 }}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="subtitle2">{u.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                                        <Typography variant="body2">Role: {u.roles?.length ? u.roles.join(', ') : '-'}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                            <Button fullWidth size="small" variant="outlined" onClick={() => openEditDialog(u)}>Edit</Button>
                                            <Button fullWidth size="small" color="error" variant="outlined" disabled={u.id === currentUserId} onClick={() => onDelete(u)}>Delete</Button>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                            <Stack direction="row" spacing={1} sx={{ p: 1 }}>
                                <Button fullWidth size="small" disabled={!firstLink.url} onClick={() => firstLink.url && router.visit(firstLink.url, { preserveState: true })}>
                                    Sebelumnya
                                </Button>
                                <Button fullWidth size="small" disabled={!lastLink.url} onClick={() => lastLink.url && router.visit(lastLink.url, { preserveState: true })}>
                                    Berikutnya
                                </Button>
                            </Stack>
                        </>
                    ) : (
                        <Paper>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nama</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell width={220}>Aksi</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.data.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell>{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.roles?.length ? u.roles.join(', ') : '-'}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" variant="outlined" onClick={() => openEditDialog(u)}>Edit</Button>
                                                    <Button size="small" color="error" variant="outlined" disabled={u.id === currentUserId} onClick={() => onDelete(u)}>Delete</Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {/* Simple pagination links */}
                            <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                                {users.links.map((l, idx) => (
                                    <Button key={idx} size="small" variant={l.active ? 'contained' : 'text'} disabled={!l.url} onClick={() => l.url && router.visit(l.url, { preserveState: true })}>
                                        {l.label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '')}
                                    </Button>
                                ))}
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Container>

            {/* Dialog Tambah User */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
                <DialogTitle>Tambah User</DialogTitle>
                <form onSubmit={submitCreate}>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <TextField required size="small" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                            <TextField required size="small" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
                            <TextField required size="small" label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} fullWidth />
                            <TextField
                                select
                                size="small"
                                label="Role"
                                value={form.roles}
                                onChange={(e) => {
                                    const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                    setForm({ ...form, roles: value });
                                }}
                                SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}
                                fullWidth
                            >
                                {roles.map((r) => (
                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCreate(false)}>Batal</Button>
                        <Button type="submit" variant="contained">Simpan</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </SidebarLayout>
        {/* Dialog Edit User */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
            <DialogTitle>Edit User</DialogTitle>
            <form onSubmit={submitUpdate}>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <TextField required size="small" label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
                        <TextField required size="small" label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} fullWidth />
                        <TextField size="small" label="Password (opsional)" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} fullWidth />
                        <TextField
                            select
                            size="small"
                            label="Role"
                            value={editForm.roles}
                            onChange={(e) => {
                                const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                setEditForm({ ...editForm, roles: value });
                            }}
                            SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}
                            fullWidth
                        >
                            {roles.map((r) => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Batal</Button>
                    <Button type="submit" variant="contained">Simpan</Button>
                </DialogActions>
            </form>
        </Dialog>
    </>);
}
