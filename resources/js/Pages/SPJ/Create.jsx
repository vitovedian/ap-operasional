import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const DURATION_OPTIONS = [
  { value: 'hari', label: 'Hari' },
  { value: 'minggu', label: 'Minggu' },
  { value: 'bulan', label: 'Bulan' },
];

const JENIS_OPTIONS = [
  { value: 'offline', label: 'Offline' },
  { value: 'online', label: 'Online' },
];

export default function CreateSpj() {
  const { props } = usePage();
  const { flash, picOptions = [] } = props;

  const [form, setForm] = useState({
    nama_kegiatan: '',
    tanggal_kegiatan: '',
    durasi_nilai: '',
    durasi_satuan: 'hari',
    pic_id: picOptions[0]?.id || '',
    nama_pendampingan: '',
    jenis_kegiatan: 'offline',
  });
  const [serahTerimaFile, setSerahTerimaFile] = useState(null);

  useEffect(() => {
    if (!form.pic_id && picOptions.length > 0) {
      setForm((prev) => ({ ...prev, pic_id: picOptions[0].id }));
    }
  }, [picOptions]);

  const bind = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const fd = new FormData();
    fd.append('nama_kegiatan', form.nama_kegiatan);
    fd.append('tanggal_kegiatan', form.tanggal_kegiatan);
    fd.append('durasi_nilai', form.durasi_nilai);
    fd.append('durasi_satuan', form.durasi_satuan);
    fd.append('pic_id', form.pic_id);
    fd.append('nama_pendampingan', form.nama_pendampingan);
    fd.append('jenis_kegiatan', form.jenis_kegiatan);
    if (serahTerimaFile) {
      fd.append('form_serah_terima', serahTerimaFile);
    }

    router.post(route('spj.store'), fd, {
      forceFormData: true,
      onSuccess: () => {
        setForm({
          nama_kegiatan: '',
          tanggal_kegiatan: '',
          durasi_nilai: '',
          durasi_satuan: 'hari',
          pic_id: picOptions[0]?.id || '',
          nama_pendampingan: '',
          jenis_kegiatan: 'offline',
        });
        setSerahTerimaFile(null);
      },
    });
  };

  return (
    <SidebarLayout header={<Typography>Pengajuan SPJ</Typography>}>
      <Head title="Pengajuan SPJ" />
      <div className="mx-auto max-w-3xl space-y-4">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card>
          <CardHeader>
            <CardTitle>Form Pengajuan SPJ</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={submit}>
              <Field label="Nama Kegiatan">
                <Input value={form.nama_kegiatan} onChange={bind('nama_kegiatan')} required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal Kegiatan">
                  <Input type="date" value={form.tanggal_kegiatan} onChange={bind('tanggal_kegiatan')} required />
                </Field>
                <Field label="Durasi">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={form.durasi_nilai}
                      onChange={bind('durasi_nilai')}
                      required
                    />
                    <select
                      className="h-10 w-32 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.durasi_satuan}
                      onChange={bind('durasi_satuan')}
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>

              <Field label="Nama PIC">
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

              <Field label="Jenis Kegiatan">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.jenis_kegiatan}
                  onChange={bind('jenis_kegiatan')}
                  required
                >
                  {JENIS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Upload Form Serah Terima Dokumen (format PDF)">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setSerahTerimaFile(event.target.files?.[0] || null)}
                  required
                />
                {serahTerimaFile && (
                  <p className="text-xs text-muted-foreground">{serahTerimaFile.name}</p>
                )}
              </Field>

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
