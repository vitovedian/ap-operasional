import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function toIDR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function InvoicesIndex({ invoices }) {
  const { props } = usePage();
  const { flash } = props;
  const canManage = Boolean(props?.canManageInvoices);

  const initialForm = {
    tanggal_pengajuan: '',
    tanggal_invoice: '',
    kegiatan: '',
    tagihan_invoice: '',
    ppn: 'tanpa',
    total_invoice_ope: '',
    bukti_surat_konfirmasi: null,
  };

  const [openEdit, setOpenEdit] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form, setForm] = useState(initialForm);

  const openEditDialog = (inv) => {
    setEditingInvoice(inv);
    setForm({
      tanggal_pengajuan: inv.tanggal_pengajuan || '',
      tanggal_invoice: inv.tanggal_invoice || '',
      kegiatan: inv.kegiatan || '',
      tagihan_invoice: inv.tagihan_invoice ? String(inv.tagihan_invoice) : '',
      ppn: inv.ppn || 'tanpa',
      total_invoice_ope: inv.total_invoice_ope ? String(inv.total_invoice_ope) : '',
      bukti_surat_konfirmasi: null,
    });
    setOpenEdit(true);
  };

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
  };

  const submitUpdate = (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const fd = new FormData();
    fd.append('_method', 'put');
    fd.append('tanggal_pengajuan', form.tanggal_pengajuan);
    fd.append('tanggal_invoice', form.tanggal_invoice);
    fd.append('kegiatan', form.kegiatan);
    fd.append('tagihan_invoice', String(form.tagihan_invoice));
    fd.append('ppn', form.ppn);
    fd.append('total_invoice_ope', String(form.total_invoice_ope));
    if (form.bukti_surat_konfirmasi) {
      fd.append('bukti_surat_konfirmasi', form.bukti_surat_konfirmasi);
    }

    router.post(route('invoices.update', editingInvoice.id), fd, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setOpenEdit(false);
        setEditingInvoice(null);
        setForm(initialForm);
      },
    });
  };

  const onDelete = (inv) => {
    if (confirm(`Hapus invoice untuk kegiatan "${inv.kegiatan}"?`)) {
      router.delete(route('invoices.destroy', inv.id), { preserveScroll: true });
    }
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, bukti_surat_konfirmasi: file }));
  };

  return (
    <SidebarLayout header={<Typography>Daftar Invoice</Typography>}>
      <Head title="Daftar Invoice" />
      <div className="space-y-3">
        {flash?.success && (
          <Alert type="success" message={flash.success} />
        )}
        {flash?.error && (
          <Alert type="error" message={flash.error} />
        )}

        <Card className="block lg:hidden">
          <CardHeader>
            <CardTitle>Daftar Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoices.data.map((inv) => (
              <div key={inv.id} className="rounded-lg border border-border bg-background p-3">
                <div className="space-y-1 text-sm">
                  <Detail label="Tanggal Pengajuan" value={inv.tanggal_pengajuan} />
                  <Detail label="Tanggal Invoice" value={inv.tanggal_invoice} />
                  <Detail label="Kegiatan" value={inv.kegiatan} />
                  <Detail label="Tagihan" value={`Rp ${toIDR(inv.tagihan_invoice)}`} />
                  <Detail label="Total OPE" value={`Rp ${toIDR(inv.total_invoice_ope)}`} />
                  <Detail label="PPN" value={inv.ppn} />
                  <Detail label="Pengaju" value={inv.user?.name || '-'} />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={inv.download_url} target="_blank" rel="noopener">
                      Unduh Bukti
                    </a>
                  </Button>
                  {canManage && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={() => openEditDialog(inv)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => onDelete(inv)}>
                        Hapus
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Pagination links={invoices.links} className="pt-1" />
          </CardContent>
        </Card>

        <div className="hidden rounded-xl border border-border bg-card shadow-sm lg:block">
          <div className="overflow-hidden">
            <Table className="min-w-[960px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Tgl Pengajuan</TableHead>
                  <TableHead>Tgl Invoice</TableHead>
                  <TableHead className="text-center">Kegiatan</TableHead>
                  <TableHead className="text-center">Tagihan (Rp)</TableHead>
                  <TableHead>PPN</TableHead>
                  <TableHead className="text-center">Total OPE (Rp)</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.data.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.tanggal_pengajuan}</TableCell>
                    <TableCell>{inv.tanggal_invoice}</TableCell>
                    <TableCell className="text-center">{inv.kegiatan}</TableCell>
                    <TableCell className="text-center">{toIDR(inv.tagihan_invoice)}</TableCell>
                    <TableCell>{inv.ppn}</TableCell>
                    <TableCell className="text-center">{toIDR(inv.total_invoice_ope)}</TableCell>
                    <TableCell>{inv.user?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" className="sm:flex-1" asChild>
                          <a href={inv.download_url} target="_blank" rel="noopener">
                            Unduh
                          </a>
                        </Button>
                        {canManage && (
                          <div className="flex flex-1 gap-1.5">
                            <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditDialog(inv)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(inv)}>
                              Hapus
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-muted/40 py-3">
            <Pagination links={invoices.links} />
          </div>
        </div>
      </div>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <form onSubmit={submitUpdate}>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Pengajuan">
                <Input
                  type="date"
                  value={form.tanggal_pengajuan}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_pengajuan: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Tanggal Invoice">
                <Input
                  type="date"
                  value={form.tanggal_invoice}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_invoice: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <Field label="Kegiatan">
              <Input
                value={form.kegiatan}
                onChange={(e) => setForm((prev) => ({ ...prev, kegiatan: e.target.value }))}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tagihan Invoice (Rp)">
                <Input
                  value={toIDRString(form.tagihan_invoice)}
                  onChange={(e) => setForm((prev) => ({ ...prev, tagihan_invoice: e.target.value }))}
                  inputMode="numeric"
                  required
                />
              </Field>
              <Field label="PPN">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.ppn}
                  onChange={(e) => setForm((prev) => ({ ...prev, ppn: e.target.value }))}
                >
                  <option value="include">include ppn</option>
                  <option value="exclude">exclude ppn</option>
                  <option value="tanpa">tanpa ppn</option>
                </select>
              </Field>
            </div>
            <Field label="Total Invoice OPE (Rp)">
              <Input
                value={toIDRString(form.total_invoice_ope)}
                onChange={(e) => setForm((prev) => ({ ...prev, total_invoice_ope: e.target.value }))}
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="Bukti Surat Konfirmasi (PDF)">
              <Input type="file" accept="application/pdf" onChange={onFileChange} />
              {form.bukti_surat_konfirmasi && (
                <p className="text-xs text-muted-foreground">{form.bukti_surat_konfirmasi.name}</p>
              )}
            </Field>
          </div>
          <DialogFooter className="mt-6">
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

function Alert({ type, message }) {
  const variant = type === 'error' ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary';
  return (
    <div className={cn('flex items-center justify-between rounded-md px-4 py-3 text-sm', variant)}>
      <span>{message}</span>
    </div>
  );
}

function Pagination({ links, className }) {
  if (!links?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2 px-4', className)}>
      {links.map((link, idx) => (
        <Button
          key={idx}
          variant={link.active ? 'default' : 'outline'}
          size="sm"
          disabled={!link.url}
          asChild
        >
          <a href={link.url || '#'} dangerouslySetInnerHTML={{ __html: sanitizeLabel(link.label) }} />
        </Button>
      ))}
    </div>
  );
}

function sanitizeLabel(label) {
  return label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '');
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

function Typography({ as = 'div', className, children }) {
  const Comp = as;
  return <Comp className={cn('text-lg font-semibold', className)}>{children}</Comp>;
}
