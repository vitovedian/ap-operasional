import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function toIDR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function InvoicesIndex({ invoices, nomorSuratOptions: nomorSuratOptionsFromProps = [] }) {
  const { props } = usePage();
  const { flash } = props;
  const canManage = Boolean(props?.canManageInvoices);
  const canAssignNomor = Boolean(props?.canAssignNomor);

  const initialForm = {
    tanggal_pengajuan: '',
    tanggal_invoice: '',
    kegiatan: '',
    tagihan_invoice: '',
    ppn: 'tanpa',
    total_invoice_ope: '',
    bukti_surat_konfirmasi: null,
  };

  const [openEdit, setOpenEdit] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [detailedInvoice, setDetailedInvoice] = useState(null);
  const [assigningInvoice, setAssigningInvoice] = useState(null);
  const [selectedNomor, setSelectedNomor] = useState('');
  const [nomorSuratOptions, setNomorSuratOptions] = useState(nomorSuratOptionsFromProps || []);
  const [form, setForm] = useState(initialForm);
  const [opeItems, setOpeItems] = useState([{ deskripsi: '', nominal: '' }]);

  const assignCurrentValue = assigningInvoice?.nomor_surat_submission_id
    ? String(assigningInvoice.nomor_surat_submission_id)
    : '';
  const assignHasChanges = assigningInvoice ? assignCurrentValue !== selectedNomor : false;
  const actionGroupClass = 'flex flex-wrap justify-end gap-2';
  const actionButtonClass = 'min-w-[112px] justify-center text-xs';
  
  // Update nomorSuratOptions ketika component mount atau props berubah
  useEffect(() => {
    setNomorSuratOptions(nomorSuratOptionsFromProps || []);
  }, [nomorSuratOptionsFromProps]);
  


  const openEditDialog = (inv) => {
    setEditingInvoice(inv);
    setForm({
      tanggal_pengajuan: inv.tanggal_pengajuan || '',
      tanggal_invoice: inv.tanggal_invoice || '',
      kegiatan: inv.kegiatan || '',
      tagihan_invoice: inv.tagihan_invoice ? String(inv.tagihan_invoice) : '',
      ppn: inv.ppn || 'tanpa',
      total_invoice_ope: inv.total_invoice_ope ? String(inv.total_invoice_ope) : '',
      bukti_surat_konfirmasi: null,
    });
    
    // Initialize OPE items based on the total OPE - we'll create a single item since we don't have itemized data
    // For now, just set default
    setOpeItems([{ deskripsi: '', nominal: inv.total_invoice_ope ? String(inv.total_invoice_ope) : '' }]);
    
    setOpenEdit(true);
  };

  const openDetailDialog = (inv) => {
    setDetailedInvoice(inv);
    setOpenDetail(true);
  };

  const openAssignDialog = (inv) => {
    setAssigningInvoice(inv);
    setSelectedNomor(inv.nomor_surat_submission_id ? String(inv.nomor_surat_submission_id) : '');
    // Gunakan nomor surat options dari props
    setNomorSuratOptions(nomorSuratOptionsFromProps);
    setOpenAssign(true);
  };

  const submitAssign = (event) => {
    event.preventDefault();
    if (!assigningInvoice) return;

    router.post(
      route('invoices.assign-nomor', assigningInvoice.id),
      {
        nomor_surat_submission_id: selectedNomor ? Number(selectedNomor) : null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpenAssign(false);
          setAssigningInvoice(null);
          setSelectedNomor('');
          // Refresh data dengan memanggil route saat ini tanpa perlu reload
          router.visit(window.location.href, { preserveScroll: true });
        },
      }
    );
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

  const handleInput = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

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

  const updateFormFromOpeItems = () => {
    const totalOpeValue = opeItems.reduce((sum, item) => sum + parseCurrency(item.nominal), 0);
    setForm(prev => ({ ...prev, total_invoice_ope: String(totalOpeValue) }));
  };

  // Update form when opeItems change
  useEffect(() => {
    updateFormFromOpeItems();
  }, [opeItems]);

  const formTagihan = parseCurrency(form.tagihan_invoice);
  const totalOpeValue = opeItems.reduce((sum, item) => sum + parseCurrency(item.nominal), 0);
  const includePpn = form.ppn === 'include';
  const formTotalTagihan = formTagihan + (includePpn ? Math.round(formTagihan * 0.11) : 0) + totalOpeValue;

  const submitUpdate = (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const fd = new FormData();
    fd.append('_method', 'put');
    fd.append('tanggal_pengajuan', form.tanggal_pengajuan);
    fd.append('tanggal_invoice', form.tanggal_invoice);
    fd.append('kegiatan', form.kegiatan);
    fd.append('tagihan_invoice', String(form.tagihan_invoice));
    fd.append('ppn', form.ppn);
    fd.append('total_invoice_ope', String(form.total_invoice_ope));
    if (form.bukti_surat_konfirmasi) {
      fd.append('bukti_surat_konfirmasi', form.bukti_surat_konfirmasi);
    }

    router.post(route('invoices.update', editingInvoice.id), fd, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setOpenEdit(false);
        setEditingInvoice(null);
        setForm(initialForm);
      },
    });
  };

  const onDelete = (inv) => {
    if (confirm(`Hapus invoice untuk kegiatan "${inv.kegiatan}"?`)) {
      router.delete(route('invoices.destroy', inv.id), { preserveScroll: true });
    }
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, bukti_surat_konfirmasi: file }));
  };

  return (
    <SidebarLayout header={<Typography>Daftar Invoice</Typography>}>
      <Head title="Daftar Invoice" />
      <div className="space-y-3">
        {flash?.success && (
          <Alert type="success" message={flash.success} />
        )}
        {flash?.error && (
          <Alert type="error" message={flash.error} />
        )}

        <Card className="block lg:hidden">
          <CardHeader>
            <CardTitle>Daftar Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoices.data.map((inv) => (
              <div key={inv.id} className="rounded-lg border border-border bg-background p-3">
                <div className="space-y-1 text-sm">
                  <Detail label="Tanggal Pengajuan" value={inv.tanggal_pengajuan} />
                  <Detail label="Tanggal Invoice" value={inv.tanggal_invoice} />
                  <Detail label="Kegiatan" value={inv.kegiatan} />
                  <Detail label="Tagihan" value={`Rp ${toIDR(inv.tagihan_invoice)}`} />
                  <Detail label="Total OPE" value={`Rp ${toIDR(inv.total_invoice_ope)}`} />
                  <Detail label="Total Tagihan" value={`Rp ${toIDR(inv.total_tagihan)}`} />
                  <Detail label="PPN" value={inv.ppn} />
                  <Detail label="Pengaju" value={inv.user?.name || '-'} />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Button variant="outline" className="w-full" onClick={() => openDetailDialog(inv)}>
                    Detail
                  </Button>
                  {canAssignNomor && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openAssignDialog(inv)}
                    >
                      {inv.nomor_surat ? 'Ubah Nomor' : 'Hubungkan Nomor'}
                    </Button>
                  )}
                  {canManage && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={() => openEditDialog(inv)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => onDelete(inv)}>
                        Hapus
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Pagination links={invoices.links} className="pt-1" />
          </CardContent>
        </Card>

        <div className="hidden rounded-xl border border-border bg-card shadow-sm lg:block">
          <div className="overflow-hidden">
            <Table className="min-w-[960px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Tgl Pengajuan</TableHead>
                  <TableHead>Tgl Invoice</TableHead>
                  <TableHead className="text-center">Kegiatan</TableHead>
                  <TableHead className="text-center">Tagihan (Rp)</TableHead>
                  <TableHead>PPN</TableHead>
                  <TableHead className="text-center">Total OPE (Rp)</TableHead>
                  <TableHead className="text-center">Total Tagihan (Rp)</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.data.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.tanggal_pengajuan}</TableCell>
                    <TableCell>{inv.tanggal_invoice}</TableCell>
                    <TableCell className="text-center">{inv.kegiatan}</TableCell>
                    <TableCell className="text-center">{toIDR(inv.tagihan_invoice)}</TableCell>
                    <TableCell>{inv.ppn}</TableCell>
                    <TableCell className="text-center">{toIDR(inv.total_invoice_ope)}</TableCell>
                    <TableCell className="text-center">{toIDR(inv.total_tagihan)}</TableCell>
                    <TableCell>{inv.user?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" className="sm:flex-1" onClick={() => openDetailDialog(inv)}>
                          Detail
                        </Button>
                        {canAssignNomor && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="sm:flex-1"
                            onClick={() => openAssignDialog(inv)}
                          >
                            {inv.nomor_surat ? 'Ubah Nomor' : 'Hubungkan Nomor'}
                          </Button>
                        )}
                        {canManage && (
                          <div className="flex flex-1 gap-1.5">
                            <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditDialog(inv)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(inv)}>
                              Hapus
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-muted/40 py-3">
            <Pagination links={invoices.links} />
          </div>
        </div>
      </div>

      {/* Dialog untuk detail invoice */}
      <Dialog
        open={openDetail}
        onOpenChange={setOpenDetail}
        panelClassName="w-full max-w-xl space-y-4 overflow-y-auto sm:max-h-[90vh] sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Detail Invoice</DialogTitle>
        </DialogHeader>
        {detailedInvoice && (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informasi Dasar
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="ID" value={detailedInvoice.id} />
                <DetailRow label="Tanggal Pengajuan" value={detailedInvoice.tanggal_pengajuan} />
                <DetailRow label="Tanggal Invoice" value={detailedInvoice.tanggal_invoice} />
                <DetailRow label="Kegiatan" value={detailedInvoice.kegiatan} />
                <DetailRow label="Pengaju" value={detailedInvoice.user?.name || '-'} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rincian Keuangan
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Tagihan (Rp)" value={`Rp ${toIDR(detailedInvoice.tagihan_invoice)}`} emphasise />
                <DetailRow label="PPN" value={detailedInvoice.ppn} />
                <DetailRow label="Total OPE (Rp)" value={`Rp ${toIDR(detailedInvoice.total_invoice_ope)}`} emphasise />
                <DetailRow label="Total Tagihan (Rp)" value={`Rp ${toIDR(detailedInvoice.total_tagihan)}`} emphasise />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nomor Surat & Lampiran
              </h3>
              <div className="mt-3 space-y-3">
                <DetailRow label="Nomor Surat" value={detailedInvoice.nomor_surat || '-'} emphasise />
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">Lampiran</span>
                  <Button variant="outline" asChild>
                    <a href={detailedInvoice.download_url} target="_blank" rel="noopener">
                      Unduh Bukti Surat Konfirmasi
                    </a>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpenDetail(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        panelClassName="w-full max-w-2xl overflow-y-auto sm:max-h-[90vh]"
      >
        <form onSubmit={submitUpdate}>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Pengajuan">
                <Input
                  type="date"
                  value={form.tanggal_pengajuan}
                  onChange={handleInput('tanggal_pengajuan')}
                  required
                />
              </Field>
              <Field label="Tanggal Invoice">
                <Input
                  type="date"
                  value={form.tanggal_invoice}
                  onChange={handleInput('tanggal_invoice')}
                  required
                />
              </Field>
            </div>
            <Field label="Kegiatan">
              <Input
                value={form.kegiatan}
                onChange={handleInput('kegiatan')}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tagihan Invoice (Rp)">
                <Input
                  value={toIDRString(form.tagihan_invoice)}
                  onChange={handleNumericInput('tagihan_invoice')}
                  inputMode="numeric"
                  required
                />
              </Field>
              <Field label="PPN">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                <span>Rp {toIDR(formTotalTagihan)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                11% dari tagihan ditambahkan hanya ketika PPN "include".
              </p>
            </Field>
            <Field label="Bukti Surat Konfirmasi (PDF)">
              <Input type="file" accept="application/pdf" onChange={onFileChange} />
              {form.bukti_surat_konfirmasi && (
                <p className="text-xs text-muted-foreground">{form.bukti_surat_konfirmasi.name}</p>
              )}
            </Field>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpenEdit(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {canAssignNomor && (
        <Dialog
          open={openAssign}
          onOpenChange={(value) => {
            setOpenAssign(value);
            if (!value) {
              setAssigningInvoice(null);
              setSelectedNomor('');
              // Tidak mereset nomorSuratOptions karena datanya dari props
            }
          }}
          panelClassName="w-full max-w-xl space-y-4 overflow-y-auto sm:max-h-[90vh] sm:max-w-2xl"
        >
          <form onSubmit={submitAssign} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Hubungkan Nomor Surat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nomor saat ini</p>
                <p className="text-sm font-semibold text-foreground">{assigningInvoice?.nomor_surat || '-'}</p>
                {assigningInvoice?.nomor_surat && (
                  <p className="text-xs text-muted-foreground">
                    Tujuan: {assigningInvoice?.kegiatan}
                  </p>
                )}
              </div>

              <Field label="Nomor Surat Tersedia">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedNomor}
                  onChange={(event) => setSelectedNomor(event.target.value)}
                >
                  <option value="">Lepas nomor surat</option>
                  {nomorSuratOptions.map((option) => {
                    const labelParts = [option.formatted || `Nomor #${option.id}`];
                    if (option.tujuan_surat) {
                      labelParts.push(option.tujuan_surat);
                    }
                    if (option.tanggal_pengajuan) {
                      labelParts.push(option.tanggal_pengajuan);
                    }
                    return (
                      <option key={option.id} value={String(option.id)}>
                        {labelParts.join(' - ')}
                      </option>
                    );
                  })}
                </select>
              </Field>

              {!nomorSuratOptions.length && (
                <p className="text-xs text-muted-foreground">
                  Saat ini belum ada nomor surat bebas. Anda tetap dapat melepas nomor yang terpasang.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpenAssign(false);
                  setAssigningInvoice(null);
                  setSelectedNomor('');
                  setNomorSuratOptions([]);
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={!assignHasChanges}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </SidebarLayout>
  );
}

function Alert({ type, message }) {
  const variant = type === 'error' ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary';
  return (
    <div className={cn('flex items-center justify-between rounded-md px-4 py-3 text-sm', variant)}>
      <span>{message}</span>
    </div>
  );
}

function Pagination({ links, className }) {
  if (!links?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2 px-4', className)}>
      {links.map((link, idx) => (
        <Button
          key={idx}
          variant={link.active ? 'default' : 'outline'}
          size="sm"
          disabled={!link.url}
          asChild
        >
          <a href={link.url || '#'} dangerouslySetInnerHTML={{ __html: sanitizeLabel(link.label) }} />
        </Button>
      ))}
    </div>
  );
}

function sanitizeLabel(label) {
  return label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '');
}

function Detail({ label, value }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function DetailRow({ label, value, valueClass = '', emphasise = false }) {
  return (
    <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn(emphasise ? 'font-semibold text-foreground' : 'text-foreground', valueClass)}>{value}</span>
    </div>
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

function Typography({ as = 'div', className, children }) {
  const Comp = as;
  return <Comp className={cn('text-lg font-semibold', className)}>{children}</Comp>;
}
