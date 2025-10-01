import { Head, Link, router } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SuratTugasPdfPreview({
  submission,
  previewUrl,
  downloadUrl,
  backUrl,
  picOptions = [],
  selectedPicId = null,
  instructorOptions = [],
  selectedInstructorIndex = null,
  template = 'pic',
}) {
  const title = submission?.id ? `Preview Surat Tugas #${submission.id}` : 'Preview Surat Tugas';
  const availablePics = Array.isArray(picOptions) ? picOptions : [];
  const availableInstructors = Array.isArray(instructorOptions) ? instructorOptions : [];
  const currentTemplate = template || 'pic';

  const buildQuery = (overrides = {}) => {
    const params = {};
    const nextTemplate = overrides.template ?? currentTemplate;

    if (nextTemplate && nextTemplate !== 'pic') {
      params.template = nextTemplate;
    }

    const nextPicId = overrides.pic_id ?? selectedPicId;
    if (nextTemplate === 'pic' && nextPicId) {
      params.pic_id = nextPicId;
    }

    const nextInstructor = overrides.instructor ?? selectedInstructorIndex;
    if (nextTemplate === 'trainer' && nextInstructor) {
      params.instructor = nextInstructor;
    }

    return params;
  };

  const navigateWithParams = (overrides) => {
    router.get(
      route('surat-tugas.preview-pdf', submission.id),
      buildQuery(overrides),
      {
        preserveScroll: true,
        preserveState: true,
      }
    );
  };

  const handlePicChange = (event) => {
    navigateWithParams({ pic_id: event.target.value, template: 'pic' });
  };

  const handleTemplateChange = (event) => {
    const nextTemplate = event.target.value;
    navigateWithParams({ template: nextTemplate });
  };

  const handleInstructorChange = (event) => {
    navigateWithParams({ instructor: event.target.value, template: 'trainer' });
  };

  return (
    <SidebarLayout header={<Typography>{title}</Typography>}>
      <Head title={title} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{submission?.kegiatan || 'Surat Tugas'}</h2>
            <p className="text-sm text-muted-foreground">
              Tanggal Pengajuan: {submission?.tanggal_pengajuan || '-'} | PIC: {submission?.nama_pic || '-'}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status: {submission?.status || '-'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="preview-template-select" className="text-sm text-muted-foreground">
                Template
              </label>
              <select
                id="preview-template-select"
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                value={currentTemplate}
                onChange={handleTemplateChange}
              >
                <option value="pic">PIC</option>
                <option value="trainer" disabled={availableInstructors.length === 0}>
                  Trainer
                </option>
              </select>
            </div>
            {currentTemplate === 'pic' && availablePics.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="preview-pic-select" className="text-sm text-muted-foreground">
                  Pilih PIC
                </label>
                <select
                  id="preview-pic-select"
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                  value={selectedPicId || ''}
                  onChange={handlePicChange}
                >
                  {availablePics.map((pic) => (
                    <option key={pic.id} value={pic.id}>
                      {pic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {currentTemplate === 'trainer' && availableInstructors.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="preview-instructor-select" className="text-sm text-muted-foreground">
                  Pilih Trainer
                </label>
                <select
                  id="preview-instructor-select"
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                  value={selectedInstructorIndex || ''}
                  onChange={handleInstructorChange}
                >
                  {availableInstructors.map((instructor) => (
                    <option key={instructor.index} value={instructor.index}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {downloadUrl && (
              <Button asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  {`Download PDF (${currentTemplate === 'trainer' ? 'Trainer' : 'PIC'})`}
                </a>
              </Button>
            )}
            {backUrl && (
              <Button asChild variant="outline">
                <Link href={backUrl}>Kembali</Link>
              </Button>
            )}
          </div>
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Pratinjau Surat Tugas (Template PIC)</CardTitle>
            <CardDescription>Periksa dokumen sebelum mencetak atau mengunduh.</CardDescription>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title={title}
                className="h-[80vh] w-full rounded-md border border-border"
              />
            ) : (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Pratinjau tidak tersedia.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
