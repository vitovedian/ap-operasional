import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
} from '@mui/material';
import { useState } from 'react';

export default function CreateInvoice() {
  const { props } = usePage();
  const { flash } = props;

  const [form, setForm] = useState({
    tanggal_pengajuan: '',
    tanggal_invoice: '',
    kegiatan: '',
    tagihan_invoice: '',
    ppn: 'tanpa',
    total_invoice_ope: '',
    bukti_surat_konfirmasi: null,
  });

  const onFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, bukti_surat_konfirmasi: file }));
  };

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('tanggal_pengajuan', form.tanggal_pengajuan);
    fd.append('tanggal_invoice', form.tanggal_invoice);
    fd.append('kegiatan', form.kegiatan);
    fd.append('tagihan_invoice', String(form.tagihan_invoice));
    fd.append('ppn', form.ppn);
    fd.append('total_invoice_ope', String(form.total_invoice_ope));
    if (form.bukti_surat_konfirmasi) {
      fd.append('bukti_surat_konfirmasi', form.bukti_surat_konfirmasi);
    }

    router.post(route('invoices.store'), fd, {
      forceFormData: true,
      onSuccess: () => {
        setForm({
          tanggal_pengajuan: '',
          tanggal_invoice: '',
          kegiatan: '',
          tagihan_invoice: '',
          ppn: 'tanpa',
          total_invoice_ope: '',
          bukti_surat_konfirmasi: null,
        });
      },
    });
  };

  return (
    <SidebarLayout header={<Typography variant="h6">Pengajuan Invoice</Typography>}>
      <Head title="Pengajuan Invoice" />

      <Container sx={{ py: 2 }}>
        <Stack spacing={2}>
          {flash?.success && (
            <Paper sx={{ p: 2 }}>
              <Typography color="success.main">{flash.success}</Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2 }}>
            <form onSubmit={onSubmit}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Tanggal Pengajuan"
                    type="date"
                    value={form.tanggal_pengajuan}
                    onChange={(e) => setForm({ ...form, tanggal_pengajuan: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Tanggal Invoice"
                    type="date"
                    value={form.tanggal_invoice}
                    onChange={(e) => setForm({ ...form, tanggal_invoice: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                  />
                </Stack>

                <TextField
                  label="Kegiatan"
                  value={form.kegiatan}
                  onChange={(e) => setForm({ ...form, kegiatan: e.target.value })}
                  fullWidth
                  required
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Tagihan Invoice (Rp)"
                    value={toIDRString(form.tagihan_invoice)}
                    onChange={(e) => setForm({ ...form, tagihan_invoice: e.target.value })}
                    placeholder="cth: 1.000.000"
                    fullWidth
                    inputMode="numeric"
                    required
                  />
                  <TextField
                    select
                    label="PPN"
                    value={form.ppn}
                    onChange={(e) => setForm({ ...form, ppn: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, total_invoice_ope: e.target.value })}
                  placeholder="cth: 500.000"
                  fullWidth
                  inputMode="numeric"
                  required
                />

                <Button variant="outlined" component="label">
                  Unggah Bukti Surat Konfirmasi (PDF)
                  <input hidden type="file" accept="application/pdf" onChange={onFileChange} />
                </Button>
                {form.bukti_surat_konfirmasi && (
                  <Typography variant="caption">
                    File: {form.bukti_surat_konfirmasi.name}
                  </Typography>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button type="submit" variant="contained">Ajukan</Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Container>
    </SidebarLayout>
  );
}

