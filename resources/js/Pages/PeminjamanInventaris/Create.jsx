import { Head, useForm, router } from '@inertiajs/react';
import { useMemo } from 'react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
const CATEGORY_OPTIONS = [
  { value: 'alat', label: 'Alat' },
  { value: 'barang', label: 'Barang' },
  { value: 'ruangan', label: 'Ruangan' },
  { value: 'akun_zoom', label: 'Akun Zoom' },
];

export default function InventoryLoanCreate({ itemOptions = [], loan = null }) {
  const options = useMemo(() => {
    const map = new Map();

    const normalizeLabel = (value, fallback) => {
      const preset = CATEGORY_OPTIONS.find((opt) => opt.value === value);
      if (preset) return preset.label;
      if (fallback) return fallback;
      return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    CATEGORY_OPTIONS.forEach((opt) => map.set(opt.value, { ...opt }));

    itemOptions
      .filter((opt) => opt && opt.value)
      .forEach((opt) => {
        const label = normalizeLabel(opt.value, opt.label);
        map.set(opt.value, { value: opt.value, label });
      });

    return Array.from(map.values());
  }, [itemOptions]);

  const defaultType = options[0]?.value || CATEGORY_OPTIONS[0].value;
  const createItem = (type = defaultType) => ({ type, label: '' });

  const initialItems = loan?.items?.length
    ? loan.items.map((item) => ({
        type: options.find((opt) => opt.value === item.type)?.value || defaultType,
        label: item.label || '',
      }))
    : [createItem()];

  const { data, setData, post, processing, errors, put } = useForm({
    nama_pemesan: loan?.nama_pemesan ?? '',
    metode_kegiatan: loan?.metode_kegiatan ?? 'offline',
    nama_kegiatan: loan?.nama_kegiatan ?? '',
    bank: loan?.bank ?? '',
    items: initialItems,
    quantity: loan?.quantity ? String(loan.quantity) : '',
    tanggal_pinjam: loan?.tanggal_pinjam ?? '',
  });

  const addItem = () => {
    setData('items', [...data.items, createItem()]);
  };

  const updateItem = (index, key, value) => {
    setData(
      'items',
      data.items.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );
  };

  const removeItem = (index) => {
    if (data.items.length === 1) {
      setData('items', [createItem()]);
      return;
    }

    setData(
      'items',
      data.items.filter((_, idx) => idx !== index)
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loan) {
      put(route('peminjaman-inventaris.update', loan.id), { preserveScroll: true });
    } else {
      post(route('peminjaman-inventaris.store'), { preserveScroll: true });
    }
  };

  const isEdit = Boolean(loan);

  return (
    <SidebarLayout header={<Typography>{isEdit ? 'Revisi Peminjaman Inventaris' : 'Pengajuan Peminjaman Inventaris'}</Typography>}>
      <Head title={isEdit ? 'Revisi Peminjaman Inventaris' : 'Pengajuan Peminjaman Inventaris'} />

      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>{isEdit ? 'Revisi Pengajuan Inventaris' : 'Form Peminjaman Inventaris'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Pemesan" error={errors.nama_pemesan}>
                <Input
                  value={data.nama_pemesan}
                  onChange={(event) => setData('nama_pemesan', event.target.value)}
                  required
                />
              </Field>
              <Field label="Metode Kegiatan" error={errors.metode_kegiatan}>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={data.metode_kegiatan}
                  onChange={(event) => setData('metode_kegiatan', event.target.value)}
                  required
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Kegiatan" error={errors.nama_kegiatan}>
                <Input
                  value={data.nama_kegiatan}
                  onChange={(event) => setData('nama_kegiatan', event.target.value)}
                  required
                />
              </Field>
              <Field label="Bank" error={errors.bank}>
                <Input
                  value={data.bank}
                  onChange={(event) => setData('bank', event.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Uraian Kebutuhan</h2>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  Tambah Kebutuhan
                </Button>
              </div>

              <div className="space-y-3">
                {data.items.map((item, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-[200px,1fr,auto]">
                    <Field label="Kategori" error={errors[`items.${index}.type`]}>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={item.type}
                        onChange={(event) => updateItem(index, 'type', event.target.value)}
                        required
                      >
                        {options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Deskripsi" error={errors[`items.${index}.label`]}>
                      <Input
                        value={item.label}
                        onChange={(event) => updateItem(index, 'label', event.target.value)}
                        placeholder="Tuliskan kebutuhan"
                        required
                      />
                    </Field>
                    <div className="flex items-end justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity" error={errors.quantity}>
                <Input
                  type="number"
                  min="1"
                  value={data.quantity}
                  onChange={(event) => setData('quantity', event.target.value)}
                  required
                />
              </Field>
              <Field label="Tanggal Pinjam" error={errors.tanggal_pinjam}>
                <Input
                  type="date"
                  value={data.tanggal_pinjam}
                  onChange={(event) => setData('tanggal_pinjam', event.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.visit(route('peminjaman-inventaris.index'))}>
                Batal
              </Button>
              <Button type="submit" disabled={processing}>
                {isEdit ? 'Simpan Revisi' : 'Simpan Pengajuan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
