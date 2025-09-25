import { Head, router, useForm, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function AtkRequestForm({ budgetingOptions = [], requestData = null }) {
  const { props } = usePage();
  const { flash } = props;

  const defaultBudgeting = requestData?.budgeting ?? budgetingOptions[0]?.value ?? '';

  const { data, setData, post, put, processing, errors } = useForm({
    nama_pemesan: requestData?.nama_pemesan ?? '',
    nama_barang: requestData?.nama_barang ?? '',
    referensi: requestData?.referensi ?? '',
    merek: requestData?.merek ?? '',
    quantity: requestData?.quantity ? String(requestData.quantity) : '',
    tanggal_pesan: requestData?.tanggal_pesan ?? '',
    deadline: requestData?.deadline ?? '',
    kegiatan: requestData?.kegiatan ?? '',
    bank: requestData?.bank ?? '',
    budgeting: defaultBudgeting,
    catatan: requestData?.catatan ?? '',
  });

  const isEdit = Boolean(requestData?.id);

  const handleChange = (field) => (event) => {
    setData(field, event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isEdit) {
      put(route('atk-requests.update', requestData.id), { preserveScroll: true });
      return;
    }

    post(route('atk-requests.store'), { preserveScroll: true });
  };

  const title = isEdit ? 'Revisi Pengajuan Permintaan ATK' : 'Pengajuan Permintaan ATK';
  const cardTitle = isEdit ? 'Revisi Permintaan ATK' : 'Form Pengajuan ATK';

  return (
    <SidebarLayout header={<Typography>{title}</Typography>}>
      <Head title={title} />
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card>
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Pemesan" error={errors.nama_pemesan}>
                  <Input value={data.nama_pemesan} onChange={handleChange('nama_pemesan')} required />
                </Field>
                <Field label="Nama Barang" error={errors.nama_barang}>
                  <Input value={data.nama_barang} onChange={handleChange('nama_barang')} required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Referensi (Opsional)" error={errors.referensi}>
                  <Input value={data.referensi} onChange={handleChange('referensi')} placeholder="Tautan atau keterangan" />
                </Field>
                <Field label="Merek (Opsional)" error={errors.merek}>
                  <Input value={data.merek} onChange={handleChange('merek')} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Quantity" error={errors.quantity}>
                  <Input type="number" min="1" value={data.quantity} onChange={handleChange('quantity')} required />
                </Field>
                <Field label="Bank" error={errors.bank}>
                  <Input value={data.bank} onChange={handleChange('bank')} required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal Pesan" error={errors.tanggal_pesan}>
                  <Input type="date" value={data.tanggal_pesan} onChange={handleChange('tanggal_pesan')} required />
                </Field>
                <Field label="Deadline" error={errors.deadline}>
                  <Input type="date" value={data.deadline} onChange={handleChange('deadline')} required />
                </Field>
              </div>

              <Field label="Kegiatan" error={errors.kegiatan}>
                <Input value={data.kegiatan} onChange={handleChange('kegiatan')} required />
              </Field>

              <Field label="Budgeting" error={errors.budgeting}>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={data.budgeting}
                  onChange={handleChange('budgeting')}
                  required
                >
                  <option value="" disabled>
                    Pilih Budgeting
                  </option>
                  {budgetingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Catatan (Opsional)" error={errors.catatan}>
                <Textarea
                  value={data.catatan}
                  onChange={handleChange('catatan')}
                  rows={4}
                  placeholder="Tuliskan catatan tambahan bila diperlukan"
                />
              </Field>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.visit(route('atk-requests.index'))}>
                  Batal
                </Button>
                <Button type="submit" disabled={processing}>
                  {isEdit ? 'Simpan Revisi' : 'Simpan Pengajuan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
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
