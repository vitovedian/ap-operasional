import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  completed: 'Selesai',
};

function statusColor(status) {
  if (status === 'approved' || status === 'completed') return 'text-green-600';
  if (status === 'rejected') return 'text-red-600';
  return 'text-amber-600';
}

export default function AtkRequestIndex({ requests, canManage }) {
  const { props } = usePage();
  const { flash } = props;

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const handleApprove = (item) => {
    router.post(route('atk-requests.approve', item.id), {}, { preserveScroll: true });
  };

  const handleReject = (item) => {
    setRejecting(item);
    setRejectNote('');
    setRejectDialogOpen(true);
  };

  const submitReject = (event) => {
    event.preventDefault();
    if (!rejecting) return;

    router.post(
      route('atk-requests.reject', rejecting.id),
      { manager_note: rejectNote },
      {
        preserveScroll: true,
        onSuccess: () => {
          setRejectDialogOpen(false);
          setRejecting(null);
          setRejectNote('');
        },
      }
    );
  };

  const handleComplete = (item) => {
    router.post(route('atk-requests.complete', item.id), {}, { preserveScroll: true });
  };

  const handleDelete = (item) => {
    if (!confirm('Hapus pengajuan ATK ini?')) return;
    router.delete(route('atk-requests.destroy', item.id), { preserveScroll: true });
  };

  const openDetail = (item) => {
    setDetailData(item);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  return (
    <SidebarLayout header={<Typography>Pengajuan Permintaan ATK</Typography>}>
      <Head title="Pengajuan Permintaan ATK" />

      <div className="space-y-3">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Permintaan ATK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 lg:hidden">
              {requests.data.length === 0 && (
                <div className="rounded-lg border border-border bg-background p-2 text-xs text-muted-foreground">
                  Belum ada pengajuan.
                </div>
              )}

              {requests.data.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background p-2">
                  <div className="space-y-1 text-xs">
                    <Detail label="Nama Pemesan" value={item.nama_pemesan} />
                    <Detail label="Nama Barang" value={item.nama_barang} />
                    <Detail label="Referensi" value={item.referensi || '-'} />
                    <Detail label="Merek" value={item.merek || '-'} />
                    <Detail label="Kegiatan" value={item.kegiatan} />
                    <Detail label="Bank" value={item.bank} />
                    <Detail label="Budgeting" value={item.budgeting_label} />
                    <Detail label="Quantity" value={item.quantity} />
                    <Detail label="Tanggal Pesan" value={item.tanggal_pesan} />
                    <Detail label="Deadline" value={item.deadline} />
                    <Detail label="Catatan" value={item.catatan || '-'} />
                    <Detail label="Status" value={STATUS_LABELS[item.status] || item.status} className={statusColor(item.status)} />
                    {item.manager_note && <Detail label="Catatan Manajer" value={item.manager_note} />}
                    <Detail label="Diproses Oleh" value={item.processor?.name || '-'} />
                    <Detail label="Diproses Pada" value={item.processed_at || '-'} />
                    <Detail label="Selesai Pada" value={item.completed_at || '-'} />
                    <Detail label="Pengaju" value={item.pengaju?.name || '-'} />
                    {item.pengaju?.email && <Detail label="Email Pengaju" value={item.pengaju.email} />}
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => openDetail(item)}>
                      Detail
                    </Button>
                    {canManage && item.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button size="sm" className="text-xs" onClick={() => handleApprove(item)}>
                          Setujui
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleReject(item)}>
                          Tolak
                        </Button>
                      </div>
                    )}
                    {(item.can_edit || item.can_admin_edit) && (
                      <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => router.visit(route('atk-requests.edit', item.id))}>
                        Revisi
                      </Button>
                    )}
                    {item.can_mark_done && (
                      <Button size="sm" className="w-full text-xs" onClick={() => handleComplete(item)}>
                        Done
                      </Button>
                    )}
                    {item.can_delete && (
                      <Button size="sm" variant="destructive" className="w-full text-xs" onClick={() => handleDelete(item)}>
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Pagination links={requests.links} className="pt-1" />
            </div>

            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <Table className="min-w-[960px] text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Pemesan</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Kegiatan</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Budgeting</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">Tanggal Pesan</TableHead>
                      <TableHead className="text-center">Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pemroses</TableHead>
                      <TableHead>Selesai Pada</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                          Belum ada pengajuan.
                        </TableCell>
                      </TableRow>
                    )}
                    {requests.data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nama_pemesan}</TableCell>
                        <TableCell>{item.nama_barang}</TableCell>
                        <TableCell>{item.kegiatan}</TableCell>
                        <TableCell>{item.bank}</TableCell>
                        <TableCell>{item.budgeting_label}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">{item.tanggal_pesan}</TableCell>
                        <TableCell className="text-center">{item.deadline}</TableCell>
                        <TableCell className={cn('font-medium', statusColor(item.status))}>{STATUS_LABELS[item.status] || item.status}</TableCell>
                        <TableCell>{item.processor?.name || '-'}</TableCell>
                        <TableCell>{item.completed_at || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-stretch gap-1.5">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => openDetail(item)}>
                              Detail
                            </Button>
                            {canManage && item.status === 'pending' && (
                              <div className="flex gap-1.5">
                                <Button size="sm" className="flex-1 text-xs" onClick={() => handleApprove(item)}>
                                  Setujui
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleReject(item)}>
                                  Tolak
                                </Button>
                              </div>
                            )}
                            {(item.can_edit || item.can_admin_edit) && (
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => router.visit(route('atk-requests.edit', item.id))}>
                                Revisi
                              </Button>
                            )}
                            {item.can_mark_done && (
                              <Button size="sm" className="text-xs" onClick={() => handleComplete(item)}>
                                Done
                              </Button>
                            )}
                            {item.can_delete && (
                              <Button size="sm" variant="destructive" className="text-xs" onClick={() => handleDelete(item)}>
                                Hapus
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination links={requests.links} className="mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {detailData && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Detail Pengajuan ATK</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 text-sm">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Pengajuan</h3>
                <DetailRow label="Nama Pemesan" value={detailData.nama_pemesan} emphasise />
                <DetailRow label="Nama Barang" value={detailData.nama_barang} />
                <DetailRow label="Referensi" value={detailData.referensi || '-'} />
                <DetailRow label="Merek" value={detailData.merek || '-'} />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informasi Kegiatan</h3>
                <DetailRow label="Kegiatan" value={detailData.kegiatan} />
                <DetailRow label="Bank" value={detailData.bank} />
                <DetailRow label="Budgeting" value={detailData.budgeting_label} />
                <DetailRow label="Quantity" value={detailData.quantity} />
                <DetailRow label="Tanggal Pesan" value={detailData.tanggal_pesan} />
                <DetailRow label="Deadline" value={detailData.deadline} />
                <DetailRow label="Catatan" value={detailData.catatan || '-'} />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status & Pemrosesan</h3>
                <DetailRow
                  label="Status"
                  value={STATUS_LABELS[detailData.status] || detailData.status}
                  valueClass={statusColor(detailData.status)}
                  emphasise
                />
                <DetailRow label="Catatan Manajer" value={detailData.manager_note || '-'} />
                <DetailRow label="Diproses Oleh" value={detailData.processor?.name || '-'} />
                <DetailRow label="Diproses Pada" value={detailData.processed_at || '-'} />
                <DetailRow label="Selesai Pada" value={detailData.completed_at || '-'} />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pengaju</h3>
                <DetailRow label="Nama" value={detailData.pengaju?.name || '-'} />
                <DetailRow label="Email" value={detailData.pengaju?.email || '-'} />
              </section>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDetail}>
                Tutup
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <form onSubmit={submitReject} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Catatan Penolakan</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            required
            rows={4}
            placeholder="Tuliskan alasan penolakan"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRejectDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive">
              Kirim Catatan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </SidebarLayout>
  );
}

function Detail({ label, value, className }) {
  return (
    <div className="text-xs sm:text-sm">
      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</span>
      <span className={cn('font-medium', className)}>{value ?? '-'}</span>
    </div>
  );
}

function DetailRow({ label, value, valueClass = '', emphasise = false }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn(emphasise ? 'font-semibold text-foreground' : 'text-foreground', valueClass)}>{value ?? '-'}</span>
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
