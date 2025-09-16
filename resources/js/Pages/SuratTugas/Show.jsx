import { Head } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Container, Paper, Typography, Stack, Divider, Button } from '@mui/material';

function formatIDR(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n || 0));
}

export default function SuratTugasShow({ submission, canModerate = false, canEdit = false }) {
  if (!submission) {
    return null;
  }

  const processedAt = submission.processed_at
    ? new Date(submission.processed_at).toLocaleString('id-ID')
    : '-';

  return (
    <SidebarLayout header={<Typography variant="h6">Detail Surat Tugas</Typography>}>
      <Head title="Detail Surat Tugas" />

      <Container sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1">Informasi Pengajuan</Typography>
              <Divider />
              <DetailRow label="Tanggal Pengajuan" value={submission.tanggal_pengajuan} />
              <DetailRow label="Kegiatan" value={submission.kegiatan} />
              <DetailRow label="Tanggal Kegiatan" value={submission.tanggal_kegiatan} />
              <DetailRow label="Pendampingan" value={submission.nama_pendampingan} />
              <DetailRow label="Fee Pendampingan" value={`Rp ${formatIDR(submission.fee_pendampingan)}`} />
              <DetailRow label="Instruktor 1" value={`${submission.instruktor_1_nama} (Rp ${formatIDR(submission.instruktor_1_fee)})`} />
              <DetailRow label="Instruktor 2" value={submission.instruktor_2_nama ? `${submission.instruktor_2_nama} (Rp ${formatIDR(submission.instruktor_2_fee)})` : '-'} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1">Status &amp; Approval</Typography>
              <Divider />
              <DetailRow label="Status" value={submission.status} valueColor={statusColor(submission.status)} />
              <DetailRow label="Catatan Revisi" value={submission.catatan_revisi || '-'} />
              <DetailRow label="Diperiksa oleh" value={submission.processor?.name || '-'} />
              <DetailRow label="Diproses pada" value={processedAt} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1">Informasi PIC &amp; Pengaju</Typography>
              <Divider />
              <DetailRow label="PIC" value={submission.pic?.name || '-'} />
              <DetailRow label="Email PIC" value={submission.pic?.email || '-'} />
              <DetailRow label="Pengaju" value={submission.pengaju?.name || '-'} />
              <DetailRow label="Email Pengaju" value={submission.pengaju?.email || '-'} />
            </Stack>
          </Paper>

          {(canModerate || canEdit) && (
            <Paper sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Tindakan</Typography>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Tindakan lanjutan dapat dilakukan dari halaman daftar surat tugas.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" href={route('surat-tugas.index')}>
                    Kembali ke Daftar
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </SidebarLayout>
  );
}

function DetailRow({ label, value, valueColor }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5}>
      <Typography variant="body2" color="text.secondary" sx={{ width: { sm: 200 } }}>
        {label}
      </Typography>
      <Typography variant="body2" color={valueColor || 'text.primary'}>
        {value}
      </Typography>
    </Stack>
  );
}

function statusColor(status) {
  if (status === 'approved') return 'success.main';
  if (status === 'rejected') return 'error.main';
  return 'warning.main';
}
