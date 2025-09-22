import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function NomorSuratIndex({ submissions, canManage = false }) {
  const { props } = usePage();
  const { flash } = props;

  const initialForm = {
    tanggal_pengajuan: '',
    tujuan_surat: '',
    nama_klien: '',
    catatan: '',
  };

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const openEditDialog = (submission) => {
    setEditing(submission);
    setForm({
      tanggal_pengajuan: submission.tanggal_pengajuan || '',
      tujuan_surat: submission.tujuan_surat || '',
      nama_klien: submission.nama_klien || '',
      catatan: submission.catatan || '',
    });
    setOpenEdit(true);
  };

  const submitUpdate = (event) => {
    event.preventDefault();
    if (!editing) return;

    router.put(
      route('nomor-surat.update', editing.id),
      {
        tanggal_pengajuan: form.tanggal_pengajuan,
        tujuan_surat: form.tujuan_surat,
        nama_klien: form.nama_klien,
        catatan: form.catatan,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpenEdit(false);
          setEditing(null);
          setForm(initialForm);
        },
      }
    );
  };

  const onDelete = (submission) => {
    if (confirm(`Hapus pengajuan nomor surat untuk tujuan "${submission.tujuan_surat}"?`)) {
      router.delete(route('nomor-surat.destroy', submission.id), { preserveScroll: true });
    }
  };

  return (
    <SidebarLayout header={<Typography>Daftar Pengajuan Nomor Surat</Typography>}>
      <Head title="Daftar Pengajuan Nomor Surat" />
      <div className="space-y-3">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card className="block lg:hidden">
          <CardHeader>
            <CardTitle>Pengajuan Nomor Surat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissions.data.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                <div className="space-y-1 text-sm">
                  <Detail label="Tanggal Pengajuan" value={item.tanggal_pengajuan} />
                  <Detail label="Tujuan Surat" value={item.tujuan_surat} />
                  <Detail label="Nama Klien" value={item.nama_klien} />
                  <Detail label="Catatan" value={item.catatan} />
                  <Detail label="Pengaju" value={item.user?.name || '-'} />
                </div>
                {canManage && (
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    <Button variant="secondary" onClick={() => openEditDialog(item)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(item)}>
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <Pagination links={submissions.links} className="pt-1" />
          </CardContent>
        </Card>

        <div className="hidden rounded-xl border border-border bg-card shadow-sm lg:block">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Tanggal Pengajuan</TableHead>
                  <TableHead className="text-center">Tujuan Surat</TableHead>
                  <TableHead className="text-center">Nama Klien</TableHead>
                  <TableHead className="text-center">Catatan</TableHead>
                  <TableHead className="text-center">Diajukan Oleh</TableHead>
                  {canManage && <TableHead className="w-48 text-center">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center">{item.tanggal_pengajuan}</TableCell>
                    <TableCell className="text-center">{item.tujuan_surat}</TableCell>
                    <TableCell className="text-center">{item.nama_klien}</TableCell>
                    <TableCell className="text-center">{item.catatan}</TableCell>
                    <TableCell className="text-center">{item.user?.name || '-'}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex justify-center gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => openEditDialog(item)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => onDelete(item)}>
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-muted/40 py-3">
            <Pagination links={submissions.links} />
          </div>
        </div>
      </div>

      {canManage && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <form onSubmit={submitUpdate} className="space-y-3">
            <DialogHeader>
              <DialogTitle>Edit Pengajuan</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Pengajuan">
                <Input
                  type="date"
                  value={form.tanggal_pengajuan}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_pengajuan: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Tujuan Surat">
                <Input
                  value={form.tujuan_surat}
                  onChange={(e) => setForm((prev) => ({ ...prev, tujuan_surat: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <Field label="Nama Klien">
              <Input
                value={form.nama_klien}
                onChange={(e) => setForm((prev) => ({ ...prev, nama_klien: e.target.value }))}
                required
              />
            </Field>
            <Field label="Catatan">
              <Textarea
                value={form.catatan}
                onChange={(e) => setForm((prev) => ({ ...prev, catatan: e.target.value }))}
                required
                rows={4}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenEdit(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </SidebarLayout>
  );
}

function Detail({ label, value }) {
  return (
    <div className="text-center text-sm">
      <span className="block text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="block font-medium">{value}</span>
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

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
