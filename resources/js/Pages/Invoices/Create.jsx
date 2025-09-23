import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

  const handleInput = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, bukti_surat_konfirmasi: file }));
  };

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
  };

  const handleNumericInput = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();

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
    <SidebarLayout header={<Typography>Pengajuan Invoice</Typography>}>
      <Head title="Pengajuan Invoice" />
      <div className="mx-auto max-w-3xl space-y-4">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card>
          <CardHeader>
            <CardTitle>Form Pengajuan Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal Pengajuan">
                  <Input type="date" value={form.tanggal_pengajuan} onChange={handleInput('tanggal_pengajuan')} required />
                </Field>
                <Field label="Tanggal Invoice">
                  <Input type="date" value={form.tanggal_invoice} onChange={handleInput('tanggal_invoice')} required />
                </Field>
              </div>

              <Field label="Kegiatan">
                <Input value={form.kegiatan} onChange={handleInput('kegiatan')} required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tagihan Invoice (Rp)">
                  <Input value={toIDRString(form.tagihan_invoice)} onChange={handleNumericInput('tagihan_invoice')} inputMode="numeric" required />
                </Field>
                <Field label="PPN">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.ppn}
                    onChange={handleInput('ppn')}
                  >
                    <option value="include">include ppn</option>
                    <option value="exclude">exclude ppn</option>
                    <option value="tanpa">tanpa ppn</option>
                  </select>
                </Field>
              </div>

              <Field label="Total Invoice OPE (Rp)">
                <Input value={toIDRString(form.total_invoice_ope)} onChange={handleNumericInput('total_invoice_ope')} inputMode="numeric" required />
              </Field>

              <Field label="Upload Bukti Confirmation Letter (dalam format PDF)">
                <Input type="file" accept="application/pdf" onChange={handleFile} />
                {form.bukti_surat_konfirmasi && (
                  <p className="text-xs text-muted-foreground">File: {form.bukti_surat_konfirmasi.name}</p>
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
  return (
    <div className={cn('rounded-md px-4 py-3 text-sm font-medium', variant)}>
      {message}
    </div>
  );
}

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
