import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

function toIDR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID').format(num);
}

function statusColor(status) {
  if (status === 'approved') return 'text-green-600';
  if (status === 'rejected') return 'text-red-600';
  return 'text-amber-600';
}

export default function SuratTugasIndex({
  submissions,
  picOptions = [],
  canManage = false,
  canModerate = false,
  canAssignNomor = false,
  nomorSuratOptions = [],
}) {
  const { props } = usePage();
  const { flash } = props;
  const hasSelfEditable = Array.isArray(submissions?.data) && submissions.data.some((item) => item.can_self_edit);

  const defaultPicSelections = picOptions[0]?.id ? [picOptions[0].id] : [];

  const initialForm = {
    tanggal_pengajuan: '',
    kegiatan: '',
    tanggal_kegiatan: '',
    pic_ids: defaultPicSelections,
    nama_pendampingan: '',
    fee_pendampingan: '',
  };

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

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [openReject, setOpenReject] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [instructors, setInstructors] = useState([{ nama: '', fee: '' }]);
  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [openAssign, setOpenAssign] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [selectedNomor, setSelectedNomor] = useState('');
  const [picDropdownOpen, setPicDropdownOpen] = useState(false);
  const picDropdownRef = useRef(null);
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

  const nomorOptions = Array.isArray(nomorSuratOptions) ? nomorSuratOptions : [];
  const assignCurrentValue = assigning?.nomor_surat_submission_id
    ? String(assigning.nomor_surat_submission_id)
    : '';
  const assignHasChanges = assigning ? assignCurrentValue !== selectedNomor : false;

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

  const openEditDialog = (submission) => {
    setEditing(submission);
    const fallbackPicIds = defaultPicSelections.length > 0 ? [...defaultPicSelections] : [];
    const nextPicIds = Array.isArray(submission.pic_ids) && submission.pic_ids.length > 0
      ? submission.pic_ids.map((value) => Number(value))
      : submission.pic?.id
        ? [submission.pic.id]
        : fallbackPicIds;

    setForm({
      tanggal_pengajuan: submission.tanggal_pengajuan || '',
      kegiatan: submission.kegiatan || '',
      tanggal_kegiatan: submission.tanggal_kegiatan || '',
      pic_ids: nextPicIds,
      nama_pendampingan: submission.nama_pendampingan || '',
      fee_pendampingan: submission.fee_pendampingan ? String(submission.fee_pendampingan) : '',
    });

    // Initialize instructors based on submission data
    const instruktors = [];
    for (let index = 1; index <= 5; index += 1) {
      const nameKey = `instruktor_${index}_nama`;
      const feeKey = `instruktor_${index}_fee`;
      const name = submission[nameKey];
      const fee = submission[feeKey];

      if (name) {
        instruktors.push({
          nama: name,
          fee: fee ? String(fee) : '',
        });
      }
    }

    // If no instructors, add a default one
    if (instruktors.length === 0) {
      instruktors.push({ nama: '', fee: '' });
    }

    setInstructors(instruktors);
    setPicDropdownOpen(false);
    setOpenEdit(true);
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

  const submitUpdate = (e) => {
    e.preventDefault();
    if (!editing) return;

    const payload = {};

    if (form.tanggal_pengajuan) {
      payload.tanggal_pengajuan = form.tanggal_pengajuan;
    }

    if (form.kegiatan?.trim()) {
      payload.kegiatan = form.kegiatan.trim();
    }

    if (form.tanggal_kegiatan) {
      payload.tanggal_kegiatan = form.tanggal_kegiatan;
    }

    if (Array.isArray(form.pic_ids) && form.pic_ids.length > 0) {
      payload.pic_ids = form.pic_ids;
    }

    if (form.nama_pendampingan?.trim()) {
      payload.nama_pendampingan = form.nama_pendampingan.trim();
    }

    if (form.fee_pendampingan !== '') {
      payload.fee_pendampingan = form.fee_pendampingan;
    }

    const entries = instructors.slice(0, 5);
    while (entries.length < 5) {
      entries.push({ nama: '', fee: '' });
    }

    entries.forEach((instruktur, idx) => {
      const index = idx + 1;
      const trimmedName = instruktur.nama?.trim();

      if (!trimmedName) {
        return;
      }

      payload[`instruktor_${index}_nama`] = trimmedName;

      if (instruktur.fee !== '') {
        payload[`instruktor_${index}_fee`] = instruktur.fee;
      }
    });

    router.put(
      route('surat-tugas.update', editing.id),
      payload,
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpenEdit(false);
          setEditing(null);
          setForm({ ...initialForm, pic_ids: [...defaultPicSelections] });
          setInstructors([{ nama: '', fee: '' }]);
          setPicDropdownOpen(false);
        },
      }
    );
  };

  const openAssignDialog = (submission) => {
    setAssigning(submission);
    setSelectedNomor(submission.nomor_surat_submission_id ? String(submission.nomor_surat_submission_id) : '');
    setOpenAssign(true);
  };

  const submitAssign = (event) => {
    event.preventDefault();
    if (!assigning) return;

    router.post(
      route('surat-tugas.assign-nomor', assigning.id),
      {
        nomor_surat_submission_id: selectedNomor ? Number(selectedNomor) : null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpenAssign(false);
          setAssigning(null);
          setSelectedNomor('');
        },
      }
    );
  };

  const onDelete = (submission) => {
    if (confirm(`Hapus surat tugas untuk kegiatan "${submission.kegiatan}"?`)) {
      router.delete(route('surat-tugas.destroy', submission.id), { preserveScroll: true });
    }
  };

  const onApprove = (submission) => {
    router.post(route('surat-tugas.approve', submission.id), {}, { preserveScroll: true });
  };

  const openRejectDialog = (submission) => {
    setRejecting(submission);
    setRejectNote(submission.catatan_revisi || '');
    setOpenReject(true);
  };

  const submitReject = (event) => {
    event.preventDefault();
    if (!rejecting) return;
    router.post(
      route('surat-tugas.reject', rejecting.id),
      { catatan_revisi: rejectNote },
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpenReject(false);
          setRejecting(null);
          setRejectNote('');
        },
      }
    );
  };

  const handleDetail = (item) => {
    const instruktors = Array.isArray(item.instruktors)
      ? item.instruktors.map((instr) => ({
          nama: instr.nama,
          fee: Number(instr.fee || 0),
        }))
      : Array.from({ length: 5 }, (_, idx) => ({
          nama: item[`instruktor_${idx + 1}_nama`],
          fee: Number(item[`instruktor_${idx + 1}_fee`] || 0),
        })).filter((instr) => instr.nama);

    setDetail({
      ...item,
      processed_at: item.processed_at || '-',
      fee_pendampingan: Number(item.fee_pendampingan || 0),
      total_fee_instruktur: Number(item.total_fee_instruktur || 0),
      total_fee: Number(item.total_fee || 0),
      instruktors,
      pics: Array.isArray(item.pics) ? item.pics : [],
      download_urls: item.download_urls || {
        pic: route('surat-tugas.download-pic', item.id),
        trainer: route('surat-tugas.download-trainer', item.id),
        pendamping: route('surat-tugas.download-pendamping', item.id),
      },
      preview_url: item.preview_url || route('surat-tugas.preview-pdf', item.id),
      can_download_pdf: Boolean(item.can_download_pdf),
    });
    setOpenDetail(true);
  };

  const handleEditOpenChange = (value) => {
    setOpenEdit(value);
    if (!value) {
      setPicDropdownOpen(false);
    }
  };

  return (
    <SidebarLayout header={<Typography>Daftar Surat Tugas</Typography>}>
      <Head title="Daftar Surat Tugas" />
      <div className="space-y-3">
        {flash?.success && <Alert type="success" message={flash.success} />}
        {flash?.error && <Alert type="error" message={flash.error} />}

        <Card className="block lg:hidden">
          <CardHeader>
            <CardTitle>Daftar Surat Tugas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissions.data.map((item) => {
              const status = item.status || 'pending';
              return (
                <div key={item.id} className="rounded-lg border border-border bg-background p-2">
                  <div className="space-y-1 text-xs">
                    <Detail label="Tanggal Pengajuan" value={item.tanggal_pengajuan} />
                    <Detail label="Tanggal Kegiatan" value={item.tanggal_kegiatan} />
                    <Detail label="Kegiatan" value={item.kegiatan} />
                    <Detail label="Pendampingan" value={item.nama_pendampingan || '-'} />
                    <Detail label="Fee Pendampingan" value={`Rp ${toIDR(item.fee_pendampingan)}`} />
                    <Detail
                      label="Instruktor"
                      value={Array.isArray(item.instruktors) && item.instruktors.length
                        ? item.instruktors.map((instr) => `${instr.nama} (Rp ${toIDR(instr.fee)})`).join(', ')
                        : '-'}
                    />
                    <Detail label="Total Fee" value={`Rp ${toIDR(item.total_fee)}`} />
                    <Detail label="Status" value={item.status} valueClass={statusColor(status)} />
                    {item.catatan_revisi && <Detail label="Catatan" value={item.catatan_revisi} />}
                    {status !== 'pending' && item.processed_by?.name && (
                      <Detail
                        label={status === 'approved' ? 'Disetujui Oleh' : 'Diproses Oleh'}
                        value={item.processed_by.name}
                      />
                    )}
                    {status !== 'pending' && item.processed_at && (
                      <Detail
                        label={status === 'approved' ? 'Disetujui Pada' : 'Diproses Pada'}
                        value={item.processed_at}
                      />
                    )}
                    <Detail label="Nomor Surat" value={item.nomor_surat || '-'} />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleDetail(item)}>
                      Lihat Detail
                    </Button>
                    {canAssignNomor && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => openAssignDialog(item)}
                      >
                        {item.nomor_surat ? 'Ubah Nomor Surat' : 'Hubungkan Nomor Surat'}
                      </Button>
                    )}
                    {canModerate && status === 'pending' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button size="sm" className="text-xs" onClick={() => onApprove(item)}>
                          Terima
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => openRejectDialog(item)}>
                          Tolak
                        </Button>
                      </div>
                    )}
                    {canManage && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button size="sm" variant="secondary" className="text-xs" onClick={() => openEditDialog(item)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs" onClick={() => onDelete(item)}>
                          Hapus
                        </Button>
                      </div>
                    )}
                    {item.can_self_edit && (
                      <Button size="sm" className="w-full text-xs" onClick={() => openEditDialog(item)}>
                        Perbarui
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            <Pagination links={submissions.links} className="pt-1" />
          </CardContent>
        </Card>

        <div className="hidden rounded-xl border border-border bg-card shadow-sm lg:block">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px] text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Tgl Pengajuan</TableHead>
                  <TableHead className="text-center">Tgl Kegiatan</TableHead>
                  <TableHead className="text-center">Kegiatan</TableHead>
                  <TableHead className="text-center">PIC</TableHead>
                  <TableHead className="text-center">Pendamping</TableHead>
                  <TableHead className="text-center">Fee Pendamping (Rp)</TableHead>
                  <TableHead className="text-center">Instruktor (Nama & Fee)</TableHead>
                  <TableHead className="text-center">Total Fee (Rp)</TableHead>
                  <TableHead className="text-center">Nomor Surat</TableHead>
                  <TableHead className="text-center">Diajukan oleh</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.data.map((item) => {
                  const status = item.status || 'pending';
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.tanggal_pengajuan}</TableCell>
                      <TableCell>{item.tanggal_kegiatan}</TableCell>
                      <TableCell>{item.kegiatan}</TableCell>
                      <TableCell>
                        {Array.isArray(item.pics) && item.pics.length > 0
                          ? item.pics.map((pic) => pic.name).join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell>{item.nama_pendampingan || '-'}</TableCell>
                      <TableCell className="text-center">{toIDR(item.fee_pendampingan)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Array.isArray(item.instruktors) && item.instruktors.length ? (
                            item.instruktors.map((instr, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span>{instr.nama}</span>
                                <span className="font-medium">Rp {toIDR(instr.fee)}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{toIDR(item.total_fee)}</TableCell>
                      <TableCell className="text-center">{item.nomor_surat || '-'}</TableCell>
                      <TableCell>{item.pengaju?.name || '-'}</TableCell>
                      <TableCell>
                      <div className="text-xs">
                        <div className={cn('font-medium', statusColor(status))}>{status}</div>
                        {item.catatan_revisi && (
                          <div className="text-[11px] text-muted-foreground">Catatan: {item.catatan_revisi}</div>
                        )}
                        {status !== 'pending' && item.processed_by?.name && (
                          <div className="text-[11px] text-muted-foreground">Oleh: {item.processed_by.name}</div>
                        )}
                        {status !== 'pending' && item.processed_at && (
                          <div className="text-[11px] text-muted-foreground">Pada: {item.processed_at}</div>
                        )}
                      </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-stretch gap-1.5 text-right">

                          <Button variant="outline" size="sm" className="justify-center text-xs" onClick={() => handleDetail(item)}>
                            Detail
                          </Button>
                          {canAssignNomor && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="justify-center text-xs"
                              onClick={() => openAssignDialog(item)}
                            >
                              {item.nomor_surat ? 'Ubah Nomor' : 'Hubungkan Nomor'}
                            </Button>
                          )}
                          {canModerate && status === 'pending' && (
                            <div className="flex gap-1.5">
                              <Button variant="default" size="sm" className="flex-1 text-xs" onClick={() => onApprove(item)}>
                                Terima
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openRejectDialog(item)}>
                                Tolak
                              </Button>
                            </div>
                          )}
                          {canManage && (
                            <div className="flex gap-1.5">
                              <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => openEditDialog(item)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={() => onDelete(item)}>
                                Hapus
                              </Button>
                            </div>
                          )}
                          {item.can_self_edit && (
                            <Button size="sm" className="w-full text-xs" onClick={() => openEditDialog(item)}>
                              Perbarui
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-muted/40 py-3">
            <Pagination links={submissions.links} />
          </div>
        </div>
      </div>

      <Dialog open={openEdit} onOpenChange={handleEditOpenChange}>
        <form onSubmit={submitUpdate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Surat Tugas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                          const checkboxId = `edit-pic-${pic.id}`;
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
                <Input value={form.nama_pendampingan} onChange={bind('nama_pendampingan')} placeholder="Opsional" />
              </Field>
            </div>
            <Field label="Fee Pendampingan (Rp)">
              <Input
                value={toIDRString(form.fee_pendampingan)}
                onChange={bindNumeric('fee_pendampingan')}
                inputMode="numeric"
                placeholder="Opsional"
              />
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
                  Rp {toIDRString(
                    parseInt(form.fee_pendampingan || '0') +
                    instructors.reduce((acc, item) => acc + parseInt(item.fee || '0', 10), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Jumlahkan fee pendampingan dan semua fee instruktur.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
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
              setAssigning(null);
              setSelectedNomor('');
            }
          }}
        >
          <form onSubmit={submitAssign} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Hubungkan Nomor Surat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nomor saat ini</p>
                <p className="text-sm font-semibold text-foreground">{assigning?.nomor_surat || '-'}</p>
                {assigning?.nomor_surat_detail?.tujuan_surat && (
                  <p className="text-xs text-muted-foreground">
                    Tujuan: {assigning.nomor_surat_detail.tujuan_surat}
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
                  {nomorOptions.map((option) => {
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

              {!nomorOptions.length && (
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

      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <form onSubmit={submitReject} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Catatan Penolakan</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            required
            placeholder="Tuliskan catatan yang perlu diperbaiki"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpenReject(false)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive">
              Kirim Catatan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog
        open={openDetail}
        onOpenChange={setOpenDetail}
        panelClassName="w-full max-w-xl space-y-4 overflow-visible sm:max-h-[90vh] sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Detail Surat Tugas</DialogTitle>
        </DialogHeader>
        {detail && (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informasi Pengajuan
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Tanggal Pengajuan" value={detail.tanggal_pengajuan} emphasise />
                <DetailRow label="Tanggal Kegiatan" value={detail.tanggal_kegiatan} emphasise />
                <DetailRow label="Kegiatan" value={detail.kegiatan} emphasise />
                <DetailRow label="Nama Pendampingan" value={detail.nama_pendampingan || '-'} emphasise />
                <DetailRow label="Fee Pendampingan" value={`Rp ${toIDR(detail.fee_pendampingan)}`} emphasise />
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Daftar Instruktor</span>
                  <div className="space-y-1">
                    {detail.instruktors?.length ? (
                      detail.instruktors.map((instr, idx) => (
                        <div
                          key={`${instr.nama}-${idx}`}
                          className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1 text-xs md:text-sm"
                        >
                          <span>{instr.nama}</span>
                          <span className="font-semibold">Rp {toIDR(instr.fee)}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Tidak ada instruktur</span>
                    )}
                  </div>
                </div>
                <DetailRow label="Total Fee Instruktor" value={`Rp ${toIDR(detail.total_fee_instruktur)}`} emphasise />
                <DetailRow label="Total Fee" value={`Rp ${toIDR(detail.total_fee)}`} emphasise />
                <DetailRow label="Nomor Surat" value={detail.nomor_surat || '-'} emphasise />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status & Catatan
              </h3>
              <div className="mt-3 space-y-2">
                <DetailRow label="Status" value={detail.status} valueClass={statusColor(detail.status)} emphasise />
                <DetailRow label="Catatan Revisi" value={detail.catatan_revisi || '-'} />
                <DetailRow label="Diproses oleh" value={detail.processed_by?.name || '-'} />
                <DetailRow label="Diproses pada" value={detail.processed_at || '-'} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PIC & Pengaju</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <DetailRow
                  label="PIC"
                  value={Array.isArray(detail.pics) && detail.pics.length > 0
                    ? detail.pics.map((pic) => pic.name).join(', ')
                    : '-'}
                />
                <DetailRow
                  label="Email PIC"
                  value={Array.isArray(detail.pics) && detail.pics.length > 0
                    ? detail.pics.map((pic) => pic.email).join(', ')
                    : '-'}
                />
                <DetailRow label="Pengaju" value={detail.pengaju?.name || '-'} />
                <DetailRow label="Email Pengaju" value={detail.pengaju?.email || '-'} />
              </div>
            </section>
          </div>
        )}
        <DialogFooter>
          {detail && (
            <Button
              type="button"
              variant={detail.status === 'approved' ? 'default' : 'outline'}
              disabled={detail.status !== 'approved'}
              className={detail.status !== 'approved' ? 'cursor-not-allowed opacity-60' : undefined}
              onClick={() => {
                if (detail.status === 'approved' && detail.preview_url) {
                  router.get(detail.preview_url);
                }
              }}
            >
              {detail.status === 'approved' ? 'Preview PDF' : 'Preview PDF (Menunggu Persetujuan)'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setOpenDetail(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>
    </SidebarLayout>
  );
}

function Detail({ label, value, valueClass = '' }) {
  return (
    <div className="text-center text-xs sm:text-sm">
      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</span>
      <span className={cn('block font-medium', valueClass)}>{value}</span>
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

function Alert({ type, message }) {
  const variant = type === 'error' ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary';
  return <div className={cn('rounded-md px-4 py-3 text-sm font-medium', variant)}>{message}</div>;
}

function Pagination({ links, className }) {
  if (!links?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2 px-4', className)}>
      {links.map((link, idx) => (
        <Button key={idx} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild>
          <a href={link.url || '#'} dangerouslySetInnerHTML={{ __html: sanitizeLabel(link.label) }} />
        </Button>
      ))}
    </div>
  );
}



function sanitizeLabel(label) {
  return label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '');
}

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
