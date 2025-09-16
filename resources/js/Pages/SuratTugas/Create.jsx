import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Container, Paper, Typography, Stack, TextField, Button, MenuItem } from '@mui/material';
import { useState } from 'react';

export default function SuratTugasCreate({ picOptions = [] }) {
  const { props } = usePage();
  const { flash } = props;

  const [form, setForm] = useState({
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
  });

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append('tanggal_pengajuan', form.tanggal_pengajuan);
    payload.append('kegiatan', form.kegiatan);
    payload.append('tanggal_kegiatan', form.tanggal_kegiatan);
    payload.append('pic_id', String(form.pic_id));
    payload.append('nama_pendampingan', form.nama_pendampingan);
    payload.append('fee_pendampingan', String(form.fee_pendampingan));
    payload.append('instruktor_1_nama', form.instruktor_1_nama);
    payload.append('instruktor_1_fee', String(form.instruktor_1_fee));
    payload.append('instruktor_2_nama', form.instruktor_2_nama);
    payload.append('instruktor_2_fee', String(form.instruktor_2_fee));

    router.post(route('surat-tugas.store'), payload, {
      forceFormData: true,
      onSuccess: () => {
        setForm({
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
        });
      },
    });
  };

  return (
    <SidebarLayout header={<Typography variant="h6">Pengajuan Surat Tugas</Typography>}>
      <Head title="Pengajuan Surat Tugas" />

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

          <Paper sx={{ p: 2 }}>
            <form onSubmit={onSubmit}>
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
                    label="Nama PIC"
                    value={form.pic_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, pic_id: e.target.value }))}
                    fullWidth
                    required
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

                <Button type="submit" variant="contained" size="large" sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
                  Ajukan
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Container>
    </SidebarLayout>
  );
}

