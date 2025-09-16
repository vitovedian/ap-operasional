import { Head, usePage, router } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Container, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Card, CardContent, CardActions, Divider, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';

function toIDR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function InvoicesIndex({ invoices }) {
  const { props } = usePage();
  const { flash } = props;
  const canManage = Boolean(props?.canManageInvoices);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const initialForm = {
    tanggal_pengajuan: '',
    tanggal_invoice: '',
    kegiatan: '',
    tagihan_invoice: '',
    ppn: 'tanpa',
    total_invoice_ope: '',
    bukti_surat_konfirmasi: null,
  };

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
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

  const onEditFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, bukti_surat_konfirmasi: file }));
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

  return (
    <SidebarLayout header={<Typography variant="h6">Daftar Invoice</Typography>}>
      <Head title="Daftar Invoice" />
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
              {invoices.data.map((inv) => (
                <Card key={inv.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2">{inv.kegiatan}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tgl Pengajuan: {inv.tanggal_pengajuan}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tgl Invoice: {inv.tanggal_invoice}
                      </Typography>
                      <Divider flexItem sx={{ my: 0.5 }} />
                      <Typography variant="body2">Tagihan: Rp {toIDR(inv.tagihan_invoice)}</Typography>
                      <Typography variant="body2">Total OPE: Rp {toIDR(inv.total_invoice_ope)}</Typography>
                      <Typography variant="body2">PPN: {inv.ppn}</Typography>
                      <Typography variant="body2">Pengaju: {inv.user?.name || '-'}</Typography>
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Stack spacing={1} direction="column" sx={{ width: '100%' }}>
                      <Button size="small" variant="outlined" component="a" href={inv.download_url} target="_blank" rel="noopener">
                        Unduh Bukti
                      </Button>
                      {canManage && (
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" fullWidth onClick={() => openEditDialog(inv)}>
                            Edit
                          </Button>
                          <Button size="small" color="error" variant="outlined" fullWidth onClick={() => onDelete(inv)}>
                            Hapus
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </CardActions>
                </Card>
              ))}
              <Stack direction="row" spacing={1}>
                {invoices.links.map((l, idx) => (
                  <Button key={idx} size="small" variant={l.active ? 'contained' : 'text'} disabled={!l.url} href={l.url || '#'} sx={{ flex: 1 }}>
                    {l.label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '')}
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
                    <TableCell>Tgl Invoice</TableCell>
                    <TableCell>Kegiatan</TableCell>
                    <TableCell align="right">Tagihan (Rp)</TableCell>
                    <TableCell>PPN</TableCell>
                    <TableCell align="right">Total OPE (Rp)</TableCell>
                    <TableCell>Diajukan oleh</TableCell>
                    <TableCell>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.data.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.tanggal_pengajuan}</TableCell>
                      <TableCell>{inv.tanggal_invoice}</TableCell>
                      <TableCell>{inv.kegiatan}</TableCell>
                      <TableCell align="right">{toIDR(inv.tagihan_invoice)}</TableCell>
                      <TableCell>{inv.ppn}</TableCell>
                      <TableCell align="right">{toIDR(inv.total_invoice_ope)}</TableCell>
                      <TableCell>{inv.user?.name || '-'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" component="a" href={inv.download_url} target="_blank" rel="noopener">Unduh Bukti</Button>
                          {canManage && (
                            <>
                              <Button size="small" variant="outlined" onClick={() => openEditDialog(inv)}>Edit</Button>
                              <Button size="small" color="error" variant="outlined" onClick={() => onDelete(inv)}>Hapus</Button>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                {invoices.links.map((l, idx) => (
                  <Button key={idx} size="small" variant={l.active ? 'contained' : 'text'} disabled={!l.url} href={l.url || '#'}>
                    {l.label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '')}
                  </Button>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Invoice</DialogTitle>
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
                  label="Tanggal Invoice"
                  type="date"
                  value={form.tanggal_invoice}
                  onChange={(e) => setForm((prev) => ({ ...prev, tanggal_invoice: e.target.value }))}
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
                  label="Tagihan Invoice (Rp)"
                  value={toIDRString(form.tagihan_invoice)}
                  onChange={(e) => setForm((prev) => ({ ...prev, tagihan_invoice: e.target.value }))}
                  inputMode="numeric"
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="PPN"
                  value={form.ppn}
                  onChange={(e) => setForm((prev) => ({ ...prev, ppn: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="include">include ppn</MenuItem>
                  <MenuItem value="exclude">exclude ppn</MenuItem>
                  <MenuItem value="tanpa">tanpa ppn</MenuItem>
                </TextField>
              </Stack>

              <TextField
                label="Total Invoice OPE (Rp)"
                value={toIDRString(form.total_invoice_ope)}
                onChange={(e) => setForm((prev) => ({ ...prev, total_invoice_ope: e.target.value }))}
                inputMode="numeric"
                required
                fullWidth
              />

              <Button variant="outlined" component="label">
                {form.bukti_surat_konfirmasi ? 'Ganti File (PDF)' : 'Unggah File Baru (PDF)'}
                <input hidden type="file" accept="application/pdf" onChange={onEditFileChange} />
              </Button>
              {form.bukti_surat_konfirmasi && (
                <Typography variant="caption">File: {form.bukti_surat_konfirmasi.name}</Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Batal</Button>
            <Button type="submit" variant="contained">Simpan</Button>
          </DialogActions>
        </form>
      </Dialog>
    </SidebarLayout>
  );
}
