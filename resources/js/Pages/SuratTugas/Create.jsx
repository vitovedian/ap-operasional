import { useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function CreateSuratTugas() {
  const { props } = usePage();
  const { flash, picOptions = [] } = props;

  const defaultPicSelections = picOptions[0]?.id ? [picOptions[0].id] : [];

  const [form, setForm] = useState({
    tanggal_pengajuan: '',
    tanggal_kegiatan: '',
    kegiatan: '',
    pic_ids: defaultPicSelections,
    nama_pendampingan: '',
    fee_pendampingan: '',
  });

  const [instructors, setInstructors] = useState([
    { nama: '', fee: '' },
  ]);
  const [picDropdownOpen, setPicDropdownOpen] = useState(false);
  const picDropdownRef = useRef(null);

  const toIDRString = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
  };

  useEffect(() => {
    if (!picDropdownOpen) return undefined;

    const handleClickOutside = (event) => {
      if (picDropdownRef.current && !picDropdownRef.current.contains(event.target)) {
        setPicDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPicDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [picDropdownOpen]);

  const bind = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const togglePicSelection = (picId, nextState) => {
    setForm((prev) => {
      const current = Array.isArray(prev.pic_ids) ? prev.pic_ids : [];
      const normalizedId = Number(picId);
      const isChecked = nextState === true;

      if (isChecked && ! current.includes(normalizedId)) {
        return {
          ...prev,
          pic_ids: [...current, normalizedId],
        };
      }

      if (! isChecked) {
        if (current.length <= 1) {
          return prev;
        }
        return {
          ...prev,
          pic_ids: current.filter((value) => value !== normalizedId),
        };
      }

      return prev;
    });
  };

  const togglePicDropdown = () => {
    if (picOptions.length === 0) {
      return;
    }
    setPicDropdownOpen((prev) => !prev);
  };

  const selectedPicSummary = () => {
    const selected = picOptions.filter((pic) => form.pic_ids?.includes(pic.id));
    if (selected.length === 0) {
      return 'Pilih PIC';
    }

    if (selected.length === 1) {
      return selected[0].name;
    }

    if (selected.length === 2) {
      return `${selected[0].name}, ${selected[1].name}`;
    }

    return `${selected[0].name} +${selected.length - 1} lainnya`;
  };

  const bindNumeric = (key) => (event) => {
    const digits = event.target.value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, [key]: digits }));
  };

  const addInstructor = () => {
    if (instructors.length >= 5) return;
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
    const payload = {
      tanggal_pengajuan: form.tanggal_pengajuan,
      tanggal_kegiatan: form.tanggal_kegiatan,
      kegiatan: form.kegiatan,
      pic_ids: form.pic_ids,
      nama_pendampingan: form.nama_pendampingan,
      fee_pendampingan: form.fee_pendampingan,
    };

    const entries = instructors.slice(0, 5);
    while (entries.length < 5) {
      entries.push({ nama: '', fee: '' });
    }

    entries.forEach((instruktur, idx) => {
      const index = idx + 1;
      payload[`instruktor_${index}_nama`] = instruktur.nama;
      payload[`instruktor_${index}_fee`] = instruktur.fee;
    });

    router.post(route('surat-tugas.store'), payload, {
      onSuccess: () => {
        setForm({
          tanggal_pengajuan: '',
          tanggal_kegiatan: '',
          kegiatan: '',
          pic_ids: [...defaultPicSelections],
          nama_pendampingan: '',
          fee_pendampingan: '',
        });
        setPicDropdownOpen(false);
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
                <Field label="PIC Penanggung Jawab">
                  <div className="relative" ref={picDropdownRef}>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex w-full items-center justify-between gap-2"
                      onClick={togglePicDropdown}
                      disabled={picOptions.length === 0}
                    >
                      <span className="truncate text-left text-sm font-normal">
                        {picOptions.length === 0 ? 'Tidak ada PIC tersedia' : selectedPicSummary()}
                      </span>
                      <span className="text-muted-foreground">v</span>
                    </Button>

                    {picDropdownOpen && picOptions.length > 0 && (
                      <div className="absolute left-0 z-20 mt-2 w-full rounded-md border border-border bg-background p-2 shadow-lg">
                        <div className="max-h-60 space-y-2 overflow-auto">
                          {picOptions.map((pic) => {
                            const checkboxId = `create-pic-${pic.id}`;
                            return (
                              <div key={pic.id} className="flex items-center gap-2 text-sm text-foreground">
                                <Checkbox
                                  id={checkboxId}
                                  checked={form.pic_ids?.includes(pic.id) || false}
                                  onChange={(event) => togglePicSelection(pic.id, event.target.checked)}
                                />
                                <label htmlFor={checkboxId} className="leading-none">
                                  {pic.name}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Pilih minimal satu PIC untuk penugasan.</p>
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
                  <Button type="button" size="sm" variant="outline" onClick={addInstructor} disabled={instructors.length >= 5}>
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
