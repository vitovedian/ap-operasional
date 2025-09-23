import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function toIDR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID').format(num);
}

function statusColor(status) {
  if (status === 'approved') return 'text-green-600';
  if (status === 'rejected') return 'text-red-600';
  return 'text-amber-600';
}

export default function SuratTugasIndex({ submissions, picOptions = [], canManage = false, canModerate = false }) {
  const { props } = usePage();
  const { flash } = props;
  const hasSelfEditable = Array.isArray(submissions?.data) && submissions.data.some((item) => item.can_self_edit);

  const initialForm = {
    tanggal_pengajuan: '',
    kegiatan: '',
    tanggal_kegiatan: '',
    pic_id: picOptions[0]?.id || '',
    nama_pendampingan: '',
    fee_pendampingan: '',
    instruktor_1_nama: '',
    instruktor_1_fee: '',
    instruktor_2_nama: '',
    instruktor_2_fee: '',
  };

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
  };

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [openReject, setOpenReject] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState(null);

  const openEditDialog = (submission) => {
    setEditing(submission);
    setForm({
      tanggal_pengajuan: submission.tanggal_pengajuan || '',
      kegiatan: submission.kegiatan || '',
      tanggal_kegiatan: submission.tanggal_kegiatan || '',
      pic_id: submission.pic?.id || picOptions[0]?.id || '',
      nama_pendampingan: submission.nama_pendampingan || '',
      fee_pendampingan: submission.fee_pendampingan ? String(submission.fee_pendampingan) : '',
      instruktor_1_nama: submission.instruktor_1_nama || '',
      instruktor_1_fee: submission.instruktor_1_fee ? String(submission.instruktor_1_fee) : '',
      instruktor_2_nama: submission.instruktor_2_nama || '',
      instruktor_2_fee: submission.instruktor_2_fee ? String(submission.instruktor_2_fee) : '',
    });
    setOpenEdit(true);
  };

  const submitUpdate = (e) => {
    e.preventDefault();
    if (!editing) return;

    router.put(
      route('surat-tugas.update', editing.id),
      {
        tanggal_pengajuan: form.tanggal_pengajuan,
        kegiatan: form.kegiatan,
        tanggal_kegiatan: form.tanggal_kegiatan,
        pic_id: form.pic_id,
        nama_pendampingan: form.nama_pendampingan,
        fee_pendampingan: form.fee_pendampingan,
        instruktor_1_nama: form.instruktor_1_nama,
        instruktor_1_fee: form.instruktor_1_fee,
        instruktor_2_nama: form.instruktor_2_nama,
        instruktor_2_fee: form.instruktor_2_fee,
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
    if (confirm(`Hapus surat tugas untuk kegiatan "${submission.kegiatan}"?`)) {
      router.delete(route('surat-tugas.destroy', submission.id), { preserveScroll: true });
    }
  };

  const onApprove = (submission) => {
    router.post(route('surat-tugas.approve', submission.id), {}, { preserveScroll: true });
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
      route('surat-tugas.reject', rejecting.id),
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

  const handleDetail = (item) => {
    setDetail({
      ...item,
      processed_at: item.processed_at || '-',
    });
    setOpenDetail(true);
  };

  return (
    <SidebarLayout header={<Typography>Daftar Surat Tugas</Typography>}>
      <Head title="Daftar Surat Tugas" />
      <div className="space-y-3">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card className="block lg:hidden">
          <CardHeader>
            <CardTitle>Daftar Surat Tugas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissions.data.map((item) => {
              const status = item.status || 'pending';
              return (
                <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="space-y-1 text-sm">
                    <Detail label="Tanggal Pengajuan" value={item.tanggal_pengajuan} />
                    <Detail label="Tanggal Kegiatan" value={item.tanggal_kegiatan} />
                    <Detail label="Kegiatan" value={item.kegiatan} />
                    <Detail label="Pendampingan" value={item.nama_pendampingan} />
                    <Detail label="Fee Pendampingan" value={`Rp ${toIDR(item.fee_pendampingan)}`} />
                    <Detail label="Instruktor 1" value={`${item.instruktor_1_nama} (Rp ${toIDR(item.instruktor_1_fee)})`} />
                    <Detail label="Instruktor 2" value={item.instruktor_2_nama ? `${item.instruktor_2_nama} (Rp ${toIDR(item.instruktor_2_fee)})` : '-'} />
                    <Detail label="Status" value={item.status} valueClass={statusColor(status)} />
                    {item.catatan_revisi && <Detail label="Catatan" value={item.catatan_revisi} />}
                  </div>
                    <div className="mt-3 space-y-1.5">
                      <Button variant="outline" className="w-full" onClick={() => handleDetail(item)}>
                        Lihat Detail
                      </Button>
                    {canManage && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button variant="secondary" onClick={() => openEditDialog(item)}>
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={() => onDelete(item)}>
                          Hapus
                        </Button>
                      </div>
                    )}
                    {canModerate && status === 'pending' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button variant="default" onClick={() => onApprove(item)}>
                          Terima
                        </Button>
                        <Button variant="outline" onClick={() => openRejectDialog(item)}>
                          Tolak
                        </Button>
                      </div>
                    )}
                    {item.can_self_edit && (
                      <Button className="w-full" onClick={() => openEditDialog(item)}>
                        Perbarui
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            <Pagination links={submissions.links} className="pt-1" />
          </CardContent>
        </Card>

        <div className="hidden rounded-xl border border-border bg-card shadow-sm lg:block">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Tgl Pengajuan</TableHead>
                  <TableHead className="text-center">Tgl Kegiatan</TableHead>
                  <TableHead className="text-center">Kegiatan</TableHead>
                  <TableHead className="text-center">PIC</TableHead>
                  <TableHead className="text-center">Pendamping</TableHead>
                  <TableHead className="text-center">Fee Pendamping (Rp)</TableHead>
                  <TableHead className="text-center">Instruktor 1</TableHead>
                  <TableHead className="text-center">Instruktor 2</TableHead>
                  <TableHead className="text-center">Diajukan oleh</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {(canManage || canModerate || hasSelfEditable) && <TableHead className="text-center">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.data.map((item) => {
                  const status = item.status || 'pending';
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.tanggal_pengajuan}</TableCell>
                      <TableCell>{item.tanggal_kegiatan}</TableCell>
                      <TableCell>{item.kegiatan}</TableCell>
                      <TableCell>{item.pic?.name || '-'}</TableCell>
                      <TableCell>{item.nama_pendampingan}</TableCell>
                      <TableCell className="text-center">{toIDR(item.fee_pendampingan)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{item.instruktor_1_nama}</div>
                          <div className="text-xs text-muted-foreground">Rp {toIDR(item.instruktor_1_fee)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.instruktor_2_nama ? (
                          <div className="text-sm">
                            <div>{item.instruktor_2_nama}</div>
                            <div className="text-xs text-muted-foreground">Rp {toIDR(item.instruktor_2_fee)}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{item.pengaju?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className={cn('font-medium', statusColor(status))}>{status}</div>
                          {item.catatan_revisi && (
                            <div className="text-xs text-muted-foreground">Catatan: {item.catatan_revisi}</div>
                          )}
                        </div>
                      </TableCell>
                      {(canManage || canModerate || item.can_self_edit) && (
                        <TableCell>
                          <div className="flex flex-col items-stretch gap-2 text-right">
                            <Button variant="outline" size="sm" className="justify-center" onClick={() => handleDetail(item)}>
                              Detail
                            </Button>
                            {canManage && (
                              <div className="flex gap-2">
                                <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                                  Edit
                                </Button>
                                <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(item)}>
                                  Hapus
                                </Button>
                              </div>
                            )}
                            {canModerate && status === 'pending' && (
                              <div className="flex gap-2">
                                <Button variant="default" size="sm" className="flex-1" onClick={() => onApprove(item)}>
                                  Terima
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => openRejectDialog(item)}>
                                  Tolak
                                </Button>
                              </div>
                            )}
                            {item.can_self_edit && (
                              <Button size="sm" className="w-full" onClick={() => openEditDialog(item)}>
                                Perbarui
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-muted/40 py-3">
            <Pagination links={submissions.links} />
          </div>
        </div>
      </div>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <form onSubmit={submitUpdate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Surat Tugas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Pengajuan">
                <Input type="date" value={form.tanggal_pengajuan} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_pengajuan: e.target.value }))} required />
              </Field>
              <Field label="Tanggal Kegiatan">
                <Input type="date" value={form.tanggal_kegiatan} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_kegiatan: e.target.value }))} required />
              </Field>
            </div>
            <Field label="Kegiatan">
              <Input value={form.kegiatan} onChange={(e) => setForm((prev) => ({ ...prev, kegiatan: e.target.value }))} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="PIC">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.pic_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, pic_id: e.target.value }))}
                  required
                >
                  {picOptions.map((pic) => (
                    <option key={pic.id} value={pic.id}>
                      {pic.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nama Pendampingan">
                <Input value={form.nama_pendampingan} onChange={(e) => setForm((prev) => ({ ...prev, nama_pendampingan: e.target.value }))} required />
              </Field>
            </div>
            <Field label="Fee Pendampingan (Rp)">
              <Input value={toIDRString(form.fee_pendampingan)} onChange={(e) => setForm((prev) => ({ ...prev, fee_pendampingan: e.target.value }))} inputMode="numeric" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instruktor 1">
                <Input value={form.instruktor_1_nama} onChange={(e) => setForm((prev) => ({ ...prev, instruktor_1_nama: e.target.value }))} required />
              </Field>
              <Field label="Fee Instruktor 1 (Rp)">
                <Input value={toIDRString(form.instruktor_1_fee)} onChange={(e) => setForm((prev) => ({ ...prev, instruktor_1_fee: e.target.value }))} inputMode="numeric" required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instruktor 2 (opsional)">
                <Input value={form.instruktor_2_nama} onChange={(e) => setForm((prev) => ({ ...prev, instruktor_2_nama: e.target.value }))} />
              </Field>
              <Field label="Fee Instruktor 2 (Rp)">
                <Input value={toIDRString(form.instruktor_2_fee)} onChange={(e) => setForm((prev) => ({ ...prev, instruktor_2_fee: e.target.value }))} inputMode="numeric" />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpenEdit(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <form onSubmit={submitReject} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Catatan Penolakan</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            required
            placeholder="Tuliskan catatan yang perlu diperbaiki"
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

      <Dialog
        open={openDetail}
        onOpenChange={setOpenDetail}
        panelClassName="w-full max-w-xl space-y-4 overflow-y-auto sm:max-h-[90vh] sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Detail Surat Tugas</DialogTitle>
        </DialogHeader>
        {detail && (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informasi Pengajuan
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Tanggal Pengajuan" value={detail.tanggal_pengajuan} emphasise />
                <DetailRow label="Tanggal Kegiatan" value={detail.tanggal_kegiatan} emphasise />
                <DetailRow label="Kegiatan" value={detail.kegiatan} emphasise />
                <DetailRow label="Nama Pendampingan" value={detail.nama_pendampingan} emphasise />
                <DetailRow label="Fee Pendampingan" value={`Rp ${toIDR(detail.fee_pendampingan)}`} emphasise />
                <DetailRow
                  label="Instruktor 1"
                  value={`${detail.instruktor_1_nama} (Rp ${toIDR(detail.instruktor_1_fee)})`}
                  emphasise
                />
                <DetailRow
                  label="Instruktor 2"
                  value={detail.instruktor_2_nama ? `${detail.instruktor_2_nama} (Rp ${toIDR(detail.instruktor_2_fee)})` : '-'}
                  emphasise
                />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status & Catatan
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Status" value={detail.status} valueClass={statusColor(detail.status)} emphasise />
                <DetailRow label="Catatan Revisi" value={detail.catatan_revisi || '-'} />
                <DetailRow label="Diproses oleh" value={detail.processed_by?.name || '-'} />
                <DetailRow label="Diproses pada" value={detail.processed_at || '-'} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PIC & Pengaju</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <DetailRow label="PIC" value={detail.pic?.name || '-'} />
                <DetailRow label="Email PIC" value={detail.pic?.email || '-'} />
                <DetailRow label="Pengaju" value={detail.pengaju?.name || '-'} />
                <DetailRow label="Email Pengaju" value={detail.pengaju?.email || '-'} />
              </div>
            </section>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpenDetail(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>
    </SidebarLayout>
  );
}

function Detail({ label, value, valueClass = '' }) {
  return (
    <div className="text-center text-sm">
      <span className="block text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('block font-medium', valueClass)}>{value}</span>
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
