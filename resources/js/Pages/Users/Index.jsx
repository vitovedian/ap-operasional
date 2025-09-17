import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function UsersIndex({ users, filters, roles = [], currentUserId }) {
  const { flash } = usePage().props;
  const [search, setSearch] = useState(filters?.search || '');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const defaultRoleSelection = roles.includes('Karyawan') ? ['Karyawan'] : roles.slice(0, 1);

  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', roles: defaultRoleSelection });
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', roles: [] });

  const submitSearch = (event) => {
    event.preventDefault();
    router.get(route('users.index'), { search }, { preserveState: true, replace: true });
  };

  const toggleCreateRole = (role) => {
    setCreateForm((prev) => {
      const rolesSet = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: rolesSet };
    });
  };

  const toggleEditRole = (role) => {
    setEditForm((prev) => {
      const rolesSet = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: rolesSet };
    });
  };

  const submitCreate = (event) => {
    event.preventDefault();
    router.post(route('users.store'), createForm, {
      onSuccess: () => {
        setCreateForm({ name: '', email: '', password: '', roles: defaultRoleSelection });
        setOpenCreate(false);
      },
    });
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      roles: Array.isArray(user.roles) && user.roles.length ? [...user.roles] : defaultRoleSelection,
    });
    setOpenEdit(true);
  };

  const submitEdit = (event) => {
    event.preventDefault();
    if (!editingUser) return;

    const payload = {
      name: editForm.name,
      email: editForm.email,
      roles: editForm.roles,
    };
    if (editForm.password) {
      payload.password = editForm.password;
    }

    router.put(route('users.update', editingUser.id), payload, {
      preserveScroll: true,
      onSuccess: () => setOpenEdit(false),
    });
  };

  const onDelete = (user) => {
    if (confirm(`Hapus user ${user.name}?`)) {
      router.delete(route('users.destroy', user.id));
    }
  };

  return (
    <SidebarLayout header={<h1 className="text-xl font-semibold text-foreground">Manajemen Pengguna</h1>}>
      <Head title="Users" />

      <div className="space-y-4">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card>
          <CardHeader>
            <CardTitle>Cari Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submitSearch}>
              <Input
                placeholder="Cari nama atau email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" variant="outline" className="sm:w-32">
                Cari
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Daftar Pengguna</CardTitle>
            </div>
            <Button onClick={() => setOpenCreate(true)}>Tambah User</Button>
          </CardHeader>
          <CardContent>
            <div className="block space-y-3 lg:hidden">
              {users.data.map((user) => (
                <div key={user.id} className="rounded-lg border border-border p-4">
                  <div className="space-y-1 text-sm">
                    <Detail label="Nama" value={user.name} />
                    <Detail label="Email" value={user.email} />
                    <Detail label="Role" value={user.roles?.length ? user.roles.join(', ') : '-'} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => openEditDialog(user)}>
                      Edit
                    </Button>
                    <Button variant="destructive" disabled={user.id === currentUserId} onClick={() => onDelete(user)}>
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
              <Pagination links={users.links} />
            </div>

            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-48 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.roles?.length ? user.roles.join(', ') : '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={user.id === currentUserId}
                            onClick={() => onDelete(user)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t bg-muted/40 py-3">
                <Pagination links={users.links} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <form onSubmit={submitCreate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
          </DialogHeader>
          <Field label="Nama">
            <Input value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))} required />
          </Field>
          <Field label="Password">
            <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} required />
          </Field>
          <Field label="Role">
            <RoleSelector
              roles={roles}
              selected={createForm.roles}
              onToggle={toggleCreateRole}
              description="Pilih satu atau beberapa role yang akan diberikan ke pengguna."
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <form onSubmit={submitEdit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Field label="Nama">
            <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} required />
          </Field>
          <Field label="Password (opsional)">
            <Input type="password" value={editForm.password} onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))} />
          </Field>
          <Field label="Role">
            <RoleSelector roles={roles} selected={editForm.roles} onToggle={toggleEditRole} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpenEdit(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </SidebarLayout>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function RoleSelector({ roles = [], selected = [], onToggle, description }) {
  if (!roles.length) {
    return <p className="text-xs text-muted-foreground">Belum ada role yang tersedia.</p>;
  }

  return (
    <div className="space-y-2">
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {roles.map((role) => {
          const checked = selected.includes(role);
          return (
            <label
              key={role}
              className={cn(
                'flex items-center gap-2 rounded-md border border-border/60 bg-background p-3 text-sm transition-colors',
                checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'
              )}
            >
              <Checkbox
                checked={checked}
                onChange={() => onToggle(role)}
              />
              <span className="font-medium capitalize">{role}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Alert({ type, message }) {
  const variant = type === 'error' ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary';
  return <div className={cn('rounded-md px-4 py-3 text-sm font-medium', variant)}>{message}</div>;
}

function Pagination({ links, className }) {
  if (!links?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2 px-4', className)}>
      {links.map((link, idx) => (
        <Button key={idx} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild>
          <a href={link.url || '#'} dangerouslySetInnerHTML={{ __html: sanitizeLabel(link.label) }} />
        </Button>
      ))}
    </div>
  );
}

function sanitizeLabel(label) {
  return label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '');
}
