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
    bukti_surat_konfirmasi: null,
  });

  const [opeItems, setOpeItems] = useState([{ deskripsi: '', nominal: '' }]);

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

  const parseCurrency = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  };

  const tagihanValue = parseCurrency(form.tagihan_invoice);
  const includePpn = form.ppn === 'include';
  const totalOpeValue = opeItems.reduce((sum, item) => sum + parseCurrency(item.nominal), 0);
  const totalTagihan = tagihanValue + (includePpn ? Math.round(tagihanValue * 0.11) : 0) + totalOpeValue;

  const handleNumericInput = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const addOpeItem = () => {
    if (opeItems.length >= 3) return;
    setOpeItems((prev) => [...prev, { deskripsi: '', nominal: '' }]);
  };

  const updateOpeItem = (index, key) => (event) => {
    const rawValue = event.target.value;
    const value = key === 'nominal' ? rawValue.replace(/\D/g, '') : rawValue;
    setOpeItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
  };

  const removeOpeItem = (index) => {
    if (opeItems.length === 1) {
      setOpeItems([{ deskripsi: '', nominal: '' }]);
      return;
    }

    setOpeItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submit = (event) => {
    event.preventDefault();

    const fd = new FormData();
    fd.append('tanggal_pengajuan', form.tanggal_pengajuan);
    fd.append('tanggal_invoice', form.tanggal_invoice);
    fd.append('kegiatan', form.kegiatan);
    fd.append('tagihan_invoice', String(form.tagihan_invoice));
    fd.append('ppn', form.ppn);

    const sanitizedItems = opeItems
      .map((item) => ({
        deskripsi: (item.deskripsi || '').trim(),
        nominal: parseCurrency(item.nominal),
      }))
      .filter((item) => item.deskripsi.length > 0);

    sanitizedItems.forEach((item, idx) => {
      fd.append(`ope_items[${idx}][deskripsi]`, item.deskripsi);
      fd.append(`ope_items[${idx}][nominal]`, String(item.nominal));
    });

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
          bukti_surat_konfirmasi: null,
        });
        setOpeItems([{ deskripsi: '', nominal: '' }]);
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Rincian Invoice OPE</h2>
                  <Button type="button" size="sm" variant="outline" onClick={addOpeItem} disabled={opeItems.length >= 3}>
                    Tambah Baris
                  </Button>
                </div>

                <div className="space-y-3">
                  {opeItems.map((item, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-[2fr,2fr,auto]">
                      <Field label={`Deskripsi OPE ${idx + 1}`}>
                        <Input
                          value={item.deskripsi}
                          onChange={updateOpeItem(idx, 'deskripsi')}
                          placeholder="Contoh: Transportasi"
                        />
                      </Field>
                      <Field label={`Nominal OPE ${idx + 1} (Rp)`}>
                        <Input
                          value={toIDRString(item.nominal)}
                          onChange={updateOpeItem(idx, 'nominal')}
                          inputMode="numeric"
                        />
                      </Field>
                      <div className="flex items-end pb-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeOpeItem(idx)}>
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Total Invoice OPE (Rp)</Label>
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-foreground">
                    Rp {toIDRString(totalOpeValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total ini otomatis menjumlahkan seluruh nominal OPE.</p>
                </div>
              </div>

              <Field label="Total Tagihan (Rp)">
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-foreground">
                  <span>Rp {toIDRString(totalTagihan)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total tagihan menambahkan 11% dari tagihan hanya bila opsi PPN adalah "include".
                </p>
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
