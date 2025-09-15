import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
} from '@mui/material';
import { useMemo, useState } from 'react';

export default function UsersIndex({ users, filters, roles = [], currentUserId }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');

    const onSearch = (e) => {
        e.preventDefault();
        router.get(route('users.index'), { search }, { preserveState: true, replace: true });
    };

    const [form, setForm] = useState({ name: '', email: '', password: '', role: roles[0] || 'User' });

    const submitCreate = (e) => {
        e.preventDefault();
        router.post(route('users.store'), form, {
            onSuccess: () => setForm({ name: '', email: '', password: '' }),
        });
    };

    const [editMap, setEditMap] = useState({});

    const onEditChange = (id, key, value) => {
        setEditMap((m) => ({ ...m, [id]: { ...(m[id] || {}), [key]: value } }));
    };

    const onUpdate = (user) => {
        const current = editMap[user.id] || {};

        // Merge defaults so required fields are always sent
        const payload = {
            name: current.name ?? user.name,
            email: current.email ?? user.email,
        };

        // Only send password if non-empty
        if (current.password && current.password.length > 0) {
            payload.password = current.password;
        }

        // Only send role when explicitly chosen
        if (current.role !== undefined && current.role !== '') {
            payload.role = current.role;
        }

        router.put(route('users.update', user.id), payload, { preserveScroll: true });
    };

    const onDelete = (user) => {
        if (confirm(`Hapus user ${user.name}?`)) {
            router.delete(route('users.destroy', user.id));
        }
    };

    return (
        <AuthenticatedLayout header={<Typography variant="h6">Users</Typography>}>
            <Head title="Users" />

            <Container sx={{ py: 4 }}>
                <Stack spacing={3}>
                    {flash?.success && (
                        <Paper sx={{ p: 2 }}>
                            <Typography color="success.main">{flash.success}</Typography>
                        </Paper>
                    )}

                    <Paper sx={{ p: 2 }}>
                        <form onSubmit={onSearch}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                <TextField
                                    size="small"
                                    label="Search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button type="submit" variant="outlined">Cari</Button>
                            </Stack>
                        </form>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Tambah User</Typography>
                        <form onSubmit={submitCreate}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField required size="small" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                <TextField required size="small" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                <TextField required size="small" label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                <TextField
                                    select
                                    size="small"
                                    label="Role"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    SelectProps={{ native: true }}
                                >
                                    {roles.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </TextField>
                                <Button type="submit" variant="contained">Simpan</Button>
                            </Stack>
                        </form>
                    </Paper>

                    <Paper>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Nama</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell width={220}>Aksi</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.data.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.id}</TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                defaultValue={u.name}
                                                onChange={(e) => onEditChange(u.id, 'name', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                defaultValue={u.email}
                                                onChange={(e) => onEditChange(u.id, 'email', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                select
                                                size="small"
                                                defaultValue={u.role || ''}
                                                onChange={(e) => onEditChange(u.id, 'role', e.target.value)}
                                                SelectProps={{ native: true }}
                                            >
                                                <option value=""></option>
                                                {roles.map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <Button size="small" variant="outlined" onClick={() => onUpdate(u)}>Update</Button>
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
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
