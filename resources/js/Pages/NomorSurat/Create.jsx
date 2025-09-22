import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function CreateNomorSurat() {
  const { props } = usePage();
  const { flash } = props;

  const [form, setForm] = useState({
    tanggal_pengajuan: '',
    tujuan_surat: '',
    nama_klien: '',
    catatan: '',
  });

  const bind = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    router.post(route('nomor-surat.store'), form, {
      onSuccess: () => {
        setForm({
          tanggal_pengajuan: '',
          tujuan_surat: '',
          nama_klien: '',
          catatan: '',
        });
      },
    });
  };

  return (
    <SidebarLayout header={<Typography>Pengajuan Nomor Surat</Typography>}>
      <Head title="Pengajuan Nomor Surat" />
      <div className="mx-auto max-w-3xl space-y-4">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card>
          <CardHeader>
            <CardTitle>Form Pengajuan Nomor Surat</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal Pengajuan">
                  <Input type="date" value={form.tanggal_pengajuan} onChange={bind('tanggal_pengajuan')} required />
                </Field>
                <Field label="Tujuan Surat">
                  <Input value={form.tujuan_surat} onChange={bind('tujuan_surat')} required />
                </Field>
              </div>

              <Field label="Nama Klien">
                <Input value={form.nama_klien} onChange={bind('nama_klien')} required />
              </Field>

              <Field label="Catatan">
                <Textarea value={form.catatan} onChange={bind('catatan')} required rows={5} />
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
