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
  });

  const [instructors, setInstructors] = useState([
    { nama: '', fee: '' },
  ]);

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
  };

  const bind = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const bindNumeric = (key) => (event) => {
    const digits = event.target.value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, [key]: digits }));
  };

  const addInstructor = () => {
    if (instructors.length >= 2) return;
    setInstructors((prev) => [...prev, { nama: '', fee: '' }]);
  };

  const updateInstructor = (index, key) => (event) => {
    const rawValue = event.target.value;
    const value = key === 'fee' ? rawValue.replace(/\D/g, '') : rawValue;
    setInstructors((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
  };

  const removeInstructor = (index) => {
    if (instructors.length === 1) {
      setInstructors([{ nama: '', fee: '' }]);
      return;
    }

    setInstructors((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalFeePendampingan = parseInt(form.fee_pendampingan?.replace(/\D/g, '') || '0', 10);
  const totalFeeInstruktur = instructors.reduce((acc, item) => acc + parseInt(item.fee || '0', 10), 0);
  const totalFee = totalFeePendampingan + totalFeeInstruktur;

  const submit = (event) => {
    event.preventDefault();
    const [first = { nama: '', fee: '' }, second = { nama: '', fee: '' }] = instructors;
    router.post(route('surat-tugas.store'), {
      tanggal_pengajuan: form.tanggal_pengajuan,
      tanggal_kegiatan: form.tanggal_kegiatan,
      kegiatan: form.kegiatan,
      pic_id: form.pic_id,
      nama_pendampingan: form.nama_pendampingan,
      fee_pendampingan: form.fee_pendampingan,
      instruktor_1_nama: first.nama,
      instruktor_1_fee: first.fee,
      instruktor_2_nama: second.nama,
      instruktor_2_fee: second.fee,
    }, {
      onSuccess: () => {
        setForm({
          tanggal_pengajuan: '',
          tanggal_kegiatan: '',
          kegiatan: '',
          pic_id: picOptions[0]?.id || '',
          nama_pendampingan: '',
          fee_pendampingan: '',
        });
        setInstructors([{ nama: '', fee: '' }]);
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
                <Input value={toIDRString(form.fee_pendampingan)} onChange={bindNumeric('fee_pendampingan')} inputMode="numeric" placeholder="Opsional" />
              </Field>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Instruktor</h2>
                  <Button type="button" size="sm" variant="outline" onClick={addInstructor} disabled={instructors.length >= 2}>
                    Tambah Instruktor
                  </Button>
                </div>

                <div className="space-y-3">
                  {instructors.map((instruktur, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-[2fr,2fr,auto]">
                      <Field label={`Nama Instruktor ${idx + 1}`}>
                        <Input value={instruktur.nama} onChange={updateInstructor(idx, 'nama')} required={idx === 0} placeholder="Nama instruktur" />
                      </Field>
                      <Field label={`Fee Instruktor ${idx + 1} (Rp)`}>
                        <Input
                          value={toIDRString(instruktur.fee)}
                          onChange={updateInstructor(idx, 'fee')}
                          inputMode="numeric"
                          required={idx === 0}
                        />
                      </Field>
                      <div className="flex items-end pb-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeInstructor(idx)}>
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Total Fee (Rp)</Label>
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-foreground">
                    Rp {toIDRString(totalFee)}
                  </div>
                  <p className="text-xs text-muted-foreground">Jumlahkan fee pendampingan dan semua fee instruktur.</p>
                </div>
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
