import { useMemo, useState } from 'react';
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

const DURATION_OPTIONS = [
  { value: 'hari', label: 'Hari' },
  { value: 'minggu', label: 'Minggu' },
  { value: 'bulan', label: 'Bulan' },
];

const JENIS_OPTIONS = [
  { value: 'offline', label: 'Offline' },
  { value: 'online', label: 'Online' },
];

function statusColor(status) {
  if (status === 'approved') return 'text-green-600';
  if (status === 'rejected') return 'text-red-600';
  return 'text-amber-600';
}

export default function SpjIndex({ submissions, canManage = false, canApprove = false }) {
  const { props } = usePage();
  const { flash } = props;
  const picOptionsFromServer = props.picOptions ?? [];

  const initialForm = {
    nama_kegiatan: '',
    tanggal_kegiatan: '',
    durasi_nilai: '',
    durasi_satuan: 'hari',
    pic_id: '',
    nama_pendampingan: '',
    jenis_kegiatan: 'offline',
  };

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formSerahTerimaFile, setFormSerahTerimaFile] = useState(null);
  const [existingFormSerahTerima, setExistingFormSerahTerima] = useState({ url: null, name: null });
  const [openReject, setOpenReject] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState(null);

  const picOptions = useMemo(() => {
    if (!editing?.pic) {
      return picOptionsFromServer;
    }

    const exists = picOptionsFromServer.some((pic) => pic.id === editing.pic.id);
    if (exists) return picOptionsFromServer;
    return [
      ...picOptionsFromServer,
      {
        id: editing.pic.id,
        name: editing.pic.name,
        email: editing.pic.email,
      },
    ];
  }, [picOptionsFromServer, editing]);

  const openEditDialog = (submission) => {
    setEditing(submission);
    setForm({
      nama_kegiatan: submission.nama_kegiatan || '',
      tanggal_kegiatan: submission.tanggal_kegiatan || '',
      durasi_nilai: submission.durasi_nilai ? String(submission.durasi_nilai) : '',
      durasi_satuan: submission.durasi_satuan || 'hari',
      pic_id: submission.pic?.id || '',
      nama_pendampingan: submission.nama_pendampingan || '',
      jenis_kegiatan: submission.jenis_kegiatan || 'offline',
    });
    setExistingFormSerahTerima({
      url: submission.form_serah_terima_url || null,
      name: submission.form_serah_terima_name || null,
    });
    setFormSerahTerimaFile(null);
    setOpenEdit(true);
  };

  const submitUpdate = (event) => {
    event.preventDefault();
    if (!editing) return;

    const fd = new FormData();
    fd.append('_method', 'put');
    fd.append('nama_kegiatan', form.nama_kegiatan);
    fd.append('tanggal_kegiatan', form.tanggal_kegiatan);
    fd.append('durasi_nilai', form.durasi_nilai);
    fd.append('durasi_satuan', form.durasi_satuan);
    fd.append('pic_id', form.pic_id);
    fd.append('nama_pendampingan', form.nama_pendampingan);
    fd.append('jenis_kegiatan', form.jenis_kegiatan);
    if (formSerahTerimaFile) {
      fd.append('form_serah_terima', formSerahTerimaFile);
    }

    router.post(route('spj.update', editing.id), fd, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setOpenEdit(false);
        setEditing(null);
        setForm(initialForm);
        setFormSerahTerimaFile(null);
        setExistingFormSerahTerima({ url: null, name: null });
      },
    });
  };

  const onDelete = (submission) => {
    if (confirm(`Hapus SPJ untuk kegiatan "${submission.nama_kegiatan}"?`)) {
      router.delete(route('spj.destroy', submission.id), { preserveScroll: true });
    }
  };

  const onApprove = (submission) => {
    router.post(route('spj.approve', submission.id), {}, { preserveScroll: true });
  };

  const openRejectDialog = (submission) => {
    setRejecting(submission);
    setRejectNote(submission.catatan_revisi || '');
    setOpenReject(true);
  };

  const submitReject = (event) => {
    event.preventDefault();
    if (!rejecting) return;

    router.post(
      route('spj.reject', rejecting.id),
      { catatan_revisi: rejectNote },
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpenReject(false);
          setRejecting(null);
          setRejectNote('');
        },
      }
    );
  };

  const openDetailDialog = (submission) => {
    setDetail(submission);
    setOpenDetail(true);
  };

  const handleDetailDialogChange = (open) => {
    setOpenDetail(open);
    if (!open) {
      setDetail(null);
    }
  };

  return (
    <SidebarLayout header={<Typography>Daftar Pengajuan SPJ</Typography>}>
      <Head title="Daftar Pengajuan SPJ" />
      <div className="space-y-3">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card className="block lg:hidden">
          <CardHeader>
            <CardTitle>Pengajuan SPJ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissions.data.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                <div className="space-y-1 text-sm">
                  <Detail label="Nama Kegiatan" value={item.nama_kegiatan} />
                  <Detail label="Tanggal" value={item.tanggal_kegiatan} />
                  <Detail label="Durasi" value={`${item.durasi_nilai} ${item.durasi_satuan}`} />
                  <Detail label="PIC" value={item.pic?.name || '-'} />
                  <Detail label="Pendampingan" value={item.nama_pendampingan} />
                  <Detail label="Jenis" value={titleCase(item.jenis_kegiatan)} />
                  <Detail label="Status" value={item.status} valueClass={statusColor(item.status)} />
                  {item.catatan_revisi && <Detail label="Catatan" value={item.catatan_revisi} />}
                </div>
                <div className="mt-3 space-y-1.5">
                  <Button variant="outline" className="w-full" onClick={() => openDetailDialog(item)}>
                    Detail
                  </Button>
                  {canApprove && item.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button onClick={() => onApprove(item)}>Setujui</Button>
                      <Button variant="outline" onClick={() => openRejectDialog(item)}>
                        Tolak
                      </Button>
                    </div>
                  )}
                  {canManage && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={() => openEditDialog(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => onDelete(item)}>
                        Hapus
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Pagination links={submissions.links} className="pt-1" />
          </CardContent>
        </Card>

        <div className="hidden rounded-xl border border-border bg-card shadow-sm lg:block">
          <div className="overflow-x-auto">
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kegiatan</TableHead>
                  <TableHead className="text-center">Tanggal</TableHead>
                  <TableHead className="text-center">Durasi</TableHead>
                  <TableHead className="text-center">PIC</TableHead>
                  <TableHead>Pendampingan</TableHead>
                  <TableHead className="text-center">Jenis</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Pengaju</TableHead>
                  <TableHead className="text-center">Diproses Oleh</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground text-center">{item.nama_kegiatan}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{item.tanggal_kegiatan}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{item.durasi_nilai} {item.durasi_satuan}</TableCell>
                    <TableCell>{item.pic?.name || '-'}</TableCell>
                    <TableCell className="text-center">{item.nama_pendampingan}</TableCell>
                    <TableCell className="text-center capitalize">{item.jenis_kegiatan}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center text-sm">
                        <span className={cn('font-medium capitalize', statusColor(item.status))}>{item.status}</span>
                        {item.catatan_revisi && (
                          <span className="text-xs text-muted-foreground">Catatan: {item.catatan_revisi}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.pengaju?.name || '-'}</TableCell>
                    <TableCell className="text-center text-sm">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{item.processed_by?.name || '-'}</span>
                        {item.processed_at && (
                          <span className="text-xs text-muted-foreground">{item.processed_at}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="ml-auto flex w-full max-w-[220px] flex-col gap-2">
                        <Button variant="outline" size="sm" className="justify-center" onClick={() => openDetailDialog(item)}>
                          Detail
                        </Button>
                        {canApprove && item.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" onClick={() => onApprove(item)}>
                              Setujui
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openRejectDialog(item)}>
                              Tolak
                            </Button>
                          </div>
                        )}
                        {canManage && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="secondary" size="sm" onClick={() => openEditDialog(item)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(item)}>
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
            <Pagination links={submissions.links} />
          </div>
        </div>
      <Dialog
        open={openDetail}
        onOpenChange={handleDetailDialogChange}
        panelClassName="w-full max-w-xl space-y-4 overflow-y-auto sm:max-h-[90vh] sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Detail Pengajuan SPJ</DialogTitle>
        </DialogHeader>
        {detail && (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informasi Kegiatan
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Nama Kegiatan" value={detail.nama_kegiatan || '-'} />
                <DetailRow label="Tanggal Kegiatan" value={detail.tanggal_kegiatan || '-'} />
                <DetailRow
                  label="Durasi"
                  value={detail.durasi_nilai ? `${detail.durasi_nilai} ${detail.durasi_satuan}` : '-'}
                />
                <DetailRow label="Jenis Kegiatan" value={titleCase(detail.jenis_kegiatan || '') || '-'} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                PIC & Pendampingan
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="PIC" value={detail.pic?.name || '-'} />
                <DetailRow label="Email PIC" value={detail.pic?.email || '-'} />
                <DetailRow label="Nama Pendampingan" value={detail.nama_pendampingan || '-'} />
                <DetailRow label="Pengaju" value={detail.pengaju?.name || '-'} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status & Dokumen
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow
                  label="Status"
                  value={titleCase(detail.status || '') || '-'}
                  valueClass={statusColor(detail.status)}
                  emphasise
                />
                <DetailRow label="Catatan Revisi" value={detail.catatan_revisi || '-'} />
                <DetailRow label="Diproses Oleh" value={detail.processed_by?.name || '-'} />
                <DetailRow label="Diproses Pada" value={detail.processed_at || '-'} />
                <DetailRow
                  label="Form Serah Terima"
                  value={detail.form_serah_terima_url ? (
                    <a
                      href={detail.form_serah_terima_url}
                      target="_blank"
                      rel="noopener"
                      className="text-primary hover:underline"
                    >
                      {detail.form_serah_terima_name || 'Lihat dokumen'}
                    </a>
                  ) : (
                    '-'
                  )}
                />
              </div>
            </section>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleDetailDialogChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>

      </div>

      {canManage && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <form onSubmit={submitUpdate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Pengajuan SPJ</DialogTitle>
            </DialogHeader>
            <Field label="Nama Kegiatan">
              <Input
                value={form.nama_kegiatan}
                onChange={(e) => setForm((prev) => ({ ...prev, nama_kegiatan: e.target.value }))}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Kegiatan">
                <Input
                  type="date"
                  value={form.tanggal_kegiatan}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_kegiatan: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Durasi">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={form.durasi_nilai}
                    onChange={(e) => setForm((prev) => ({ ...prev, durasi_nilai: e.target.value }))}
                    required
                  />
                  <select
                    className="h-10 w-32 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.durasi_satuan}
                    onChange={(e) => setForm((prev) => ({ ...prev, durasi_satuan: e.target.value }))}
                    required
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>
            <Field label="PIC">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.pic_id}
                onChange={(e) => setForm((prev) => ({ ...prev, pic_id: e.target.value }))}
                required
              >
                <option value="" disabled>
                  Pilih PIC
                </option>
                {picOptions.map((pic) => (
                  <option key={pic.id} value={pic.id}>
                    {pic.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nama Pendampingan">
              <Input
                value={form.nama_pendampingan}
                onChange={(e) => setForm((prev) => ({ ...prev, nama_pendampingan: e.target.value }))}
                required
              />
            </Field>
            <Field label="Jenis Kegiatan">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.jenis_kegiatan}
                onChange={(e) => setForm((prev) => ({ ...prev, jenis_kegiatan: e.target.value }))}
                required
              >
                {JENIS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Upload Form Serah Terima Dokumen (PDF)">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(event) => setFormSerahTerimaFile(event.target.files?.[0] || null)}
              />
              {formSerahTerimaFile ? (
                <p className="text-xs text-muted-foreground">{formSerahTerimaFile.name}</p>
              ) : existingFormSerahTerima.url ? (
                <a
                  href={existingFormSerahTerima.url}
                  target="_blank"
                  rel="noopener"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {existingFormSerahTerima.name || 'Lihat dokumen saat ini'}
                </a>
              ) : null}
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

      {canApprove && (
        <Dialog open={openReject} onOpenChange={setOpenReject}>
          <form onSubmit={submitReject} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Catatan Penolakan</DialogTitle>
            </DialogHeader>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              required
              rows={4}
              placeholder="Tuliskan alasan penolakan"
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenReject(false)}>
                Batal
              </Button>
              <Button type="submit" variant="destructive">
                Kirim Catatan
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </SidebarLayout>
  );
}

function Detail({ label, value, valueClass }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', valueClass)}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value, valueClass = '', emphasise = false }) {
  return (
    <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn(emphasise ? 'font-semibold text-foreground' : 'text-foreground', valueClass)}>{value}</span>
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

function titleCase(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
