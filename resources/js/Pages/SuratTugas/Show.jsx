import { Head, Link } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PDFDropdown from '@/Components/PDFDropdown';
import { cn } from '@/lib/utils';

const formatIDR = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const formatJenisKegiatan = (value) => (!value ? '-' : value.charAt(0).toUpperCase() + value.slice(1));

export default function SuratTugasShow({
  submission,
  canModerate = false,
  canEdit = false,
  canDownloadPdf = false,
  downloadUrls = null,
}) {
  if (!submission) return null;

  return (
    <SidebarLayout header={<Typography>Detail Surat Tugas</Typography>}>
      <Head title={`Surat Tugas #${submission.id}`} />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kegiatan</CardTitle>
              <CardDescription>Detail utama surat tugas ini.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Tanggal Pengajuan" value={submission.tanggal_pengajuan} />
              <Detail label="Tanggal Kegiatan Dimulai" value={submission.tanggal_kegiatan} />
              <Detail label="Tanggal Kegiatan Berakhir" value={submission.tanggal_kegiatan_berakhir || '-'} />
              <Detail label="Jenis Kegiatan" value={formatJenisKegiatan(submission.jenis_kegiatan)} />
              <Detail label="Nama Kegiatan" value={submission.kegiatan} full />
              <Detail label="Nama Pendampingan" value={submission.nama_pendampingan || '-'} full />
              <Detail label="Fee Pendampingan" value={`Rp ${formatIDR(submission.fee_pendampingan)}`} />
              <Detail label="Nomor Surat" value={submission.nomor_surat || '-'} />
              <Detail label="Instruktor 1" value={`${submission.instruktor_1_nama} (Rp ${formatIDR(submission.instruktor_1_fee)})`} />
              <Detail
                label="Instruktor 2"
                value={submission.instruktor_2_nama ? `${submission.instruktor_2_nama} (Rp ${formatIDR(submission.instruktor_2_fee)})` : '-'}
                full
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dan Persetujuan</CardTitle>
              <CardDescription>Riwayat status dan catatan dari Manager.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Detail label="Status" value={submission.status} valueClass={statusColor(submission.status)} />
              <Detail label="Catatan Revisi" value={submission.catatan_revisi || '-'} full />
              <Detail label="Diproses oleh" value={submission.processor?.name || '-'} />
              <Detail label="Diproses pada" value={submission.processed_at || '-'} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PIC & Pengaju</CardTitle>
              <CardDescription>Informasi kontak terkait.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="PIC" value={submission.pic?.name || '-'} full />
              <Detail label="Email PIC" value={submission.pic?.email || '-'} full />
              <Detail label="Pengaju" value={submission.pengaju?.name || '-'} full />
              <Detail label="Email Pengaju" value={submission.pengaju?.email || '-'} full />
            </CardContent>
          </Card>

          {(canModerate || canEdit) && (
          <Card>
            <CardHeader>
              <CardTitle>Tindakan</CardTitle>
              <CardDescription>Kelola surat tugas ini dari halaman daftar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href={route('surat-tugas.index')}>Kembali ke Daftar</Link>
              </Button>
              {canDownloadPdf && downloadUrls && (
                <PDFDropdown 
                  downloadUrls={downloadUrls} 
                  suratTugasId={submission.id} 
                  className="w-full" 
                />
              )}
              {canEdit && (
                <p className="text-xs text-muted-foreground">
                  Anda dapat memperbarui surat tugas ini langsung dari daftar jika statusnya ditolak.
                </p>
              )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

function Detail({ label, value, valueClass, full = false }) {
  return (
    <div className={cn('flex flex-col space-y-1', full ? 'sm:col-span-2' : undefined)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium text-foreground', valueClass)}>{value}</span>
    </div>
  );
}

function statusColor(status) {
  if (status === 'approved') return 'text-green-600';
  if (status === 'rejected') return 'text-red-600';
  return 'text-amber-600';
}

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
