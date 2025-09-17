import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function CreateSuratTugas() {
  const { props } = usePage();
  const { flash, picOptions = [] } = props;

  const [form, setForm] = useState({
    tanggal_pengajuan: '',
    tanggal_kegiatan: '',
    kegiatan: '',
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

  const bind = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    router.post(route('surat-tugas.store'), {
      tanggal_pengajuan: form.tanggal_pengajuan,
      tanggal_kegiatan: form.tanggal_kegiatan,
      kegiatan: form.kegiatan,
      pic_id: form.pic_id,
      nama_pendampingan: form.nama_pendampingan,
      fee_pendampingan: form.fee_pendampingan,
      instruktor_1_nama: form.instruktor_1_nama,
      instruktor_1_fee: form.instruktor_1_fee,
      instruktor_2_nama: form.instruktor_2_nama,
      instruktor_2_fee: form.instruktor_2_fee,
    }, {
      onSuccess: () => {
        setForm({
          tanggal_pengajuan: '',
          tanggal_kegiatan: '',
          kegiatan: '',
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
    <SidebarLayout header={<Typography>Pengajuan Surat Tugas</Typography>}>
      <Head title="Pengajuan Surat Tugas" />
      <div className="mx-auto max-w-3xl space-y-4">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card>
          <CardHeader>
            <CardTitle>Form Surat Tugas</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal Pengajuan">
                  <Input type="date" value={form.tanggal_pengajuan} onChange={bind('tanggal_pengajuan')} required />
                </Field>
                <Field label="Tanggal Kegiatan">
                  <Input type="date" value={form.tanggal_kegiatan} onChange={bind('tanggal_kegiatan')} required />
                </Field>
              </div>

              <Field label="Kegiatan">
                <Input value={form.kegiatan} onChange={bind('kegiatan')} required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="PIC">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.pic_id}
                    onChange={bind('pic_id')}
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
                  <Input value={form.nama_pendampingan} onChange={bind('nama_pendampingan')} required />
                </Field>
              </div>

              <Field label="Fee Pendampingan (Rp)">
                <Input value={toIDRString(form.fee_pendampingan)} onChange={bind('fee_pendampingan')} inputMode="numeric" required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Instruktor 1">
                  <Input value={form.instruktor_1_nama} onChange={bind('instruktor_1_nama')} required />
                </Field>
                <Field label="Fee Instruktor 1 (Rp)">
                  <Input value={toIDRString(form.instruktor_1_fee)} onChange={bind('instruktor_1_fee')} inputMode="numeric" required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Instruktor 2 (opsional)">
                  <Input value={form.instruktor_2_nama} onChange={bind('instruktor_2_nama')} />
                </Field>
                <Field label="Fee Instruktor 2 (Rp)">
                  <Input value={toIDRString(form.instruktor_2_fee)} onChange={bind('instruktor_2_fee')} inputMode="numeric" />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Ajukan</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
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

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
