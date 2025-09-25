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

const ITEM_TYPE_LABELS = {
  alat: 'Alat',
  barang: 'Barang',
  ruangan: 'Ruangan',
  akun_zoom: 'Akun Zoom',
};

function statusColor(status) {
  if (status === 'approved' || status === 'completed') return 'text-green-600';
  if (status === 'rejected') return 'text-red-600';
  return 'text-amber-600';
}

export default function InventoryLoanIndex({ loans, canManage }) {
  const { props } = usePage();
  const { flash } = props;

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoan, setDetailLoan] = useState(null);

  const handleApprove = (loan) => {
    router.post(route('peminjaman-inventaris.approve', loan.id), {}, { preserveScroll: true });
  };

  const handleReject = (loan) => {
    setRejecting(loan);
    setRejectNote('');
    setRejectDialogOpen(true);
  };

  const submitReject = (event) => {
    event.preventDefault();
    if (!rejecting) return;

    router.post(
      route('peminjaman-inventaris.reject', rejecting.id),
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

  const handleComplete = (loan) => {
    router.post(route('peminjaman-inventaris.complete', loan.id), {}, { preserveScroll: true });
  };

  const handleDelete = (loan) => {
    if (!confirm('Hapus pengajuan peminjaman inventaris ini?')) return;
    router.delete(route('peminjaman-inventaris.destroy', loan.id), { preserveScroll: true });
  };

  const handleDetail = (loan) => {
    setDetailLoan(loan);
    setDetailOpen(true);
  };

  const handleDetailDialogChange = (open) => {
    setDetailOpen(open);
    if (!open) {
      setDetailLoan(null);
    }
  };

  return (
    <SidebarLayout header={<Typography>Pengajuan Peminjaman Inventaris</Typography>}>
      <Head title="Pengajuan Peminjaman Inventaris" />

      <div className="space-y-3">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card className="block lg:hidden">
          <CardHeader>
            <CardTitle>Daftar Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loans.data.length === 0 && (
              <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                Belum ada pengajuan.
              </div>
            )}
            {loans.data.map((loan) => (
              <div key={loan.id} className="rounded-lg border border-border bg-background p-3">
                <div className="space-y-1 text-sm">
                  <Detail label="Nama Pemesan" value={loan.nama_pemesan} />
                  <Detail label="Metode" value={loan.metode_kegiatan} className="capitalize" />
                  <Detail label="Nama Kegiatan" value={loan.nama_kegiatan} />
                  <Detail label="Bank" value={loan.bank} />
                  <Detail label="Catatan" value={loan.catatan || '-'} />
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-muted-foreground">Kebutuhan</span>
                    <ul className="mt-1 space-y-1 text-xs">
                      {(loan.items || []).map((item, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{ITEM_TYPE_LABELS[item.type] || item.type}</span> — {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Detail label="Jumlah" value={loan.quantity} />
                  <Detail label="Tanggal Pinjam" value={loan.tanggal_pinjam} />
                  <Detail label="Status" value={STATUS_LABELS[loan.status] || loan.status} className={statusColor(loan.status)} />
                  {loan.manager_note && (
                    <Detail label="Catatan" value={loan.manager_note} />
                  )}
                  {loan.returned_at && (<Detail label="Tanggal Kembali" value={loan.returned_at} />)}
                </div>

                <div className="mt-3 space-y-1.5">
                  <Button variant="outline" className="w-full" onClick={() => handleDetail(loan)}>
                    Detail
                  </Button>
                  {(loan.can_edit || loan.can_admin_edit) && (
                    <Button variant="outline" className="w-full" onClick={() => router.visit(route('peminjaman-inventaris.edit', loan.id))}>
                      Revisi
                    </Button>
                  )}
                  {loan.can_mark_done && (
                    <Button className="w-full" onClick={() => handleComplete(loan)}>
                      Done
                    </Button>
                  )}
                  {loan.can_delete && (
                    <Button variant="destructive" className="w-full" onClick={() => handleDelete(loan)}>
                      Hapus
                    </Button>
                  )}
                  {canManage && loan.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" onClick={() => handleApprove(loan)}>Setujui</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(loan)}>Tolak</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Pagination links={loans.links} className="pt-1" />
          </CardContent>
        </Card>

        <div className="hidden rounded-xl border border-border bg-card shadow-sm lg:block">
          <div className="overflow-x-auto">
            <Table className="min-w-[960px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pemesan</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Nama Kegiatan</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Kebutuhan</TableHead>
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead className="text-center">Tanggal Pinjam</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Pemroses</TableHead>
                  <TableHead>Tanggal Kembali</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                      Belum ada pengajuan.
                    </TableCell>
                  </TableRow>
                )}
                {loans.data.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.nama_pemesan}</TableCell>
                    <TableCell className="capitalize">{loan.metode_kegiatan}</TableCell>
                    <TableCell>{loan.nama_kegiatan}</TableCell>
                    <TableCell>{loan.bank}</TableCell>
                    <TableCell>{loan.catatan || '-'}</TableCell>
                    <TableCell>
                      <ul className="space-y-1 text-xs">
                        {(loan.items || []).map((item, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{ITEM_TYPE_LABELS[item.type] || item.type}</span> — {item.label}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="text-center">{loan.quantity}</TableCell>
                    <TableCell className="text-center">{loan.tanggal_pinjam}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn('font-medium', statusColor(loan.status))}>{STATUS_LABELS[loan.status] || loan.status}</span>
                        {loan.manager_note && (
                          <span className="text-xs text-muted-foreground">Catatan: {loan.manager_note}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {loan.processor ? (
                        <div className="text-sm">
                          <div>{loan.processor.name}</div>
                          {loan.processed_at && (
                            <div className="text-xs text-muted-foreground">{loan.processed_at}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{loan.returned_at || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-stretch gap-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => handleDetail(loan)}>
                          Detail
                        </Button>
                        {(loan.can_edit || loan.can_admin_edit) && (
                          <Button size="sm" variant="outline" onClick={() => router.visit(route('peminjaman-inventaris.edit', loan.id))}>
                            Revisi
                          </Button>
                        )}
                        {loan.can_mark_done && (
                          <Button size="sm" onClick={() => handleComplete(loan)}>
                            Done
                          </Button>
                        )}
                        {loan.can_delete && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(loan)}>
                            Hapus
                          </Button>
                        )}
                        {canManage && loan.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApprove(loan)}>Setujui</Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(loan)}>Tolak</Button>
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
            <Pagination links={loans.links} />
          </div>
        </div>
      </div>

      <Dialog
        open={detailOpen}
        onOpenChange={handleDetailDialogChange}
        panelClassName="w-full max-w-2xl space-y-4 overflow-y-auto sm:max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Detail Peminjaman Inventaris</DialogTitle>
        </DialogHeader>
        {detailLoan && (
          <div className="space-y-4">
            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informasi Peminjam</h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Nama Pemesan" value={detailLoan.nama_pemesan} />
                <DetailRow label="Pengaju" value={detailLoan.pengaju?.name || '-'} />
                <DetailRow label="Metode Kegiatan" value={detailLoan.metode_kegiatan} valueClass="capitalize" />
                <DetailRow label="Tanggal Pinjam" value={detailLoan.tanggal_pinjam} />
                <DetailRow label="Status" value={STATUS_LABELS[detailLoan.status] || detailLoan.status} valueClass={statusColor(detailLoan.status)} emphasise />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detail Kegiatan</h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Nama Kegiatan" value={detailLoan.nama_kegiatan} />
                <DetailRow label="Bank" value={detailLoan.bank} />
                <DetailRow label="Catatan" value={detailLoan.catatan || '-'} />
                <DetailRow label="Jumlah" value={detailLoan.quantity} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kebutuhan</h3>
              <div className="mt-3 space-y-2 text-sm">
                {Array.isArray(detailLoan.items) && detailLoan.items.length ? (
                  detailLoan.items.map((item, idx) => (
                    <div key={idx} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="font-medium">{ITEM_TYPE_LABELS[item.type] || item.type}</span>
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Tidak ada kebutuhan</span>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status & Pemrosesan</h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Catatan Manajer" value={detailLoan.manager_note || '-'} />
                <DetailRow label="Diproses Oleh" value={detailLoan.processor?.name || '-'} />
                <DetailRow label="Diproses Pada" value={detailLoan.processed_at || '-'} />
                <DetailRow label="Tanggal Pengembalian" value={detailLoan.returned_at || '-'} />
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
    <div className="text-sm">
      <span className="block text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('font-medium', className)}>{value || '-'}</span>
    </div>
  );
}

function DetailRow({ label, value, valueClass = '', emphasise = false }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn(emphasise ? 'font-semibold text-foreground' : 'text-foreground', valueClass)}>{value || '-'}</span>
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
