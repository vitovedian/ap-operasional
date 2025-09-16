import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

function toIDR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID').format(num);
}

function statusColor(status) {
  if (status === 'approved') return 'success.main';
  if (status === 'rejected') return 'error.main';
  return 'warning.main';
}

export default function SuratTugasIndex({ submissions, picOptions = [], canManage = false, canModerate = false }) {
  const { props } = usePage();
  const { flash } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    router.put(route('surat-tugas.update', editing.id), {
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
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setOpenEdit(false);
        setEditing(null);
        setForm(initialForm);
      },
    });
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

  const submitReject = (e) => {
    e.preventDefault();
    if (!rejecting) return;
    router.post(route('surat-tugas.reject', rejecting.id), { catatan_revisi: rejectNote }, {
      preserveScroll: true,
      onSuccess: () => {
        setOpenReject(false);
        setRejecting(null);
        setRejectNote('');
      },
    });
  };

  return (
    <SidebarLayout header={<Typography variant="h6">Daftar Surat Tugas</Typography>}>
      <Head title="Daftar Surat Tugas" />
      <Container sx={{ py: 2 }}>
        <Stack spacing={2}>
          {flash?.success && (
            <Paper sx={{ p: 2 }}>
              <Typography color="success.main">{flash.success}</Typography>
            </Paper>
          )}
          {flash?.error && (
            <Paper sx={{ p: 2 }}>
              <Typography color="error.main">{flash.error}</Typography>
            </Paper>
          )}

          {isMobile ? (
            <Stack spacing={2}>
              {submissions.data.map((item) => {
                const status = item.status || 'pending';
                return (
                  <Card key={item.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">{item.kegiatan}</Typography>
                      <Typography variant="body2" color="text.secondary">Tgl Pengajuan: {item.tanggal_pengajuan}</Typography>
                      <Typography variant="body2" color="text.secondary">Tgl Kegiatan: {item.tanggal_kegiatan}</Typography>
                      <Typography variant="body2" color={statusColor(status)}>Status: {status}</Typography>
                      <Divider flexItem sx={{ my: 0.5 }} />
                      <Typography variant="body2">PIC: {item.pic?.name || '-'}</Typography>
                      <Typography variant="body2">Pendampingan: {item.nama_pendampingan}</Typography>
                      <Typography variant="body2">Fee Pendampingan: Rp {toIDR(item.fee_pendampingan)}</Typography>
                      <Typography variant="body2">Instruktor 1: {item.instruktor_1_nama} (Rp {toIDR(item.instruktor_1_fee)})</Typography>
                      <Typography variant="body2">Instruktor 2: {item.instruktor_2_nama || '-'}{item.instruktor_2_nama ? ` (Rp ${toIDR(item.instruktor_2_fee)})` : ''}</Typography>
                      <Typography variant="body2" color="text.secondary">Diajukan oleh: {item.pengaju?.name || '-'}</Typography>
                      {item.catatan_revisi && (
                        <Typography variant="body2" color="warning.dark">Catatan: {item.catatan_revisi}</Typography>
                      )}
                    </Stack>
                  </CardContent>
                  {(canManage || (canModerate && status === 'pending')) && (
                    <CardActions>
                      <Stack spacing={1} direction="row" sx={{ width: '100%', flexWrap: 'wrap' }}>
                        {canManage && (
                          <>
                            <Button fullWidth size="small" variant="outlined" onClick={() => openEditDialog(item)}>Edit</Button>
                            <Button fullWidth size="small" color="error" variant="outlined" onClick={() => onDelete(item)}>Hapus</Button>
                          </>
                        )}
                        {canModerate && status === 'pending' && (
                          <>
                            <Button fullWidth size="small" variant="contained" color="success" onClick={() => onApprove(item)}>Terima</Button>
                            <Button fullWidth size="small" color="warning" variant="outlined" onClick={() => openRejectDialog(item)}>Tolak</Button>
                          </>
                        )}
                      </Stack>
                    </CardActions>
                  )}
                  </Card>
                );
              })}
              <Stack direction="row" spacing={1}>
                {submissions.links.map((link, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant={link.active ? 'contained' : 'text'}
                    disabled={!link.url}
                    href={link.url || '#'}
                    sx={{ flex: 1 }}
                  >
                    {link.label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '')}
                  </Button>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Paper>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tgl Pengajuan</TableCell>
                    <TableCell>Kegiatan</TableCell>
                    <TableCell>Tgl Kegiatan</TableCell>
                    <TableCell>PIC</TableCell>
                    <TableCell>Pendamping</TableCell>
                    <TableCell>Fee Pendamping (Rp)</TableCell>
                    <TableCell>Instruktor 1</TableCell>
                    <TableCell>Instruktor 2</TableCell>
                    <TableCell>Diajukan oleh</TableCell>
                    <TableCell>Status</TableCell>
                    {(canManage || canModerate) && <TableCell>Aksi</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.data.map((item) => {
                    const status = item.status || 'pending';
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.tanggal_pengajuan}</TableCell>
                      <TableCell>{item.kegiatan}</TableCell>
                      <TableCell>{item.tanggal_kegiatan}</TableCell>
                      <TableCell>{item.pic?.name || '-'}</TableCell>
                      <TableCell>{item.nama_pendampingan}</TableCell>
                      <TableCell>{toIDR(item.fee_pendampingan)}</TableCell>
                        <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{item.instruktor_1_nama}</Typography>
                          <Typography variant="caption">{toIDR(item.instruktor_1_fee)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {item.instruktor_2_nama ? (
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{item.instruktor_2_nama}</Typography>
                            <Typography variant="caption">{toIDR(item.instruktor_2_fee)}</Typography>
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{item.pengaju?.name || '-'}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color={statusColor(status)}>{status}</Typography>
                          {item.catatan_revisi && (
                            <Typography variant="caption" color="warning.dark">Catatan: {item.catatan_revisi}</Typography>
                          )}
                        </Stack>
                        </TableCell>
                        {(canManage || canModerate) && (
                          <TableCell>
                          <Stack direction="row" spacing={1}>
                            {canManage && (
                              <>
                                <Button size="small" variant="outlined" onClick={() => openEditDialog(item)}>Edit</Button>
                                <Button size="small" color="error" variant="outlined" onClick={() => onDelete(item)}>Hapus</Button>
                              </>
                            )}
                            {canModerate && status === 'pending' && (
                              <>
                                <Button size="small" variant="contained" color="success" onClick={() => onApprove(item)}>Terima</Button>
                                <Button size="small" color="warning" variant="outlined" onClick={() => openRejectDialog(item)}>Tolak</Button>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                {submissions.links.map((link, idx) => (
                  <Button key={idx} size="small" variant={link.active ? 'contained' : 'text'} disabled={!link.url} href={link.url || '#'}>
                    {link.label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '')}
                  </Button>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Surat Tugas</DialogTitle>
        <form onSubmit={submitUpdate}>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Tanggal Pengajuan"
                  type="date"
                  value={form.tanggal_pengajuan}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_pengajuan: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                <TextField
                  label="Tanggal Kegiatan"
                  type="date"
                  value={form.tanggal_kegiatan}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_kegiatan: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
              </Stack>

              <TextField
                label="Kegiatan"
                value={form.kegiatan}
                onChange={(e) => setForm((prev) => ({ ...prev, kegiatan: e.target.value }))}
                required
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="PIC"
                  value={form.pic_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, pic_id: e.target.value }))}
                  required
                  fullWidth
                >
                  {picOptions.map((pic) => (
                    <MenuItem key={pic.id} value={pic.id}>
                      {pic.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Nama Pendampingan"
                  value={form.nama_pendampingan}
                  onChange={(e) => setForm((prev) => ({ ...prev, nama_pendampingan: e.target.value }))}
                  required
                  fullWidth
                />
              </Stack>

              <TextField
                label="Fee Pendampingan (Rp)"
                value={toIDRString(form.fee_pendampingan)}
                onChange={(e) => setForm((prev) => ({ ...prev, fee_pendampingan: e.target.value }))}
                inputMode="numeric"
                required
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Instruktor 1"
                  value={form.instruktor_1_nama}
                  onChange={(e) => setForm((prev) => ({ ...prev, instruktor_1_nama: e.target.value }))}
                  required
                  fullWidth
                />
                <TextField
                  label="Fee Instruktor 1 (Rp)"
                  value={toIDRString(form.instruktor_1_fee)}
                  onChange={(e) => setForm((prev) => ({ ...prev, instruktor_1_fee: e.target.value }))}
                  inputMode="numeric"
                  required
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Instruktor 2 (opsional)"
                  value={form.instruktor_2_nama}
                  onChange={(e) => setForm((prev) => ({ ...prev, instruktor_2_nama: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Fee Instruktor 2 (Rp)"
                  value={toIDRString(form.instruktor_2_fee)}
                  onChange={(e) => setForm((prev) => ({ ...prev, instruktor_2_fee: e.target.value }))}
                  inputMode="numeric"
                  fullWidth
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Batal</Button>
            <Button type="submit" variant="contained">Simpan</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openReject} onClose={() => setOpenReject(false)} fullWidth maxWidth="sm">
        <DialogTitle>Catatan Penolakan</DialogTitle>
        <form onSubmit={submitReject}>
          <DialogContent dividers>
            <TextField
              label="Catatan Revisi"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              required
              fullWidth
              multiline
              minRows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReject(false)}>Batal</Button>
            <Button type="submit" variant="contained" color="warning">Kirim</Button>
          </DialogActions>
        </form>
      </Dialog>
    </SidebarLayout>
  );
}
