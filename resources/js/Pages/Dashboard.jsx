import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard({ widgets = [], quickLinks = [] }) {
  return (
    <SidebarLayout header={<h1 className="text-xl font-semibold text-foreground">Dashboard</h1>}>
      <Head title="Dashboard" />

      <div className="mx-auto max-w-6xl space-y-6">
        {quickLinks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Akses Cepat Pengajuan</CardTitle>
              <CardDescription>Pilih pengajuan yang ingin Anda buka atau buat.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {quickLinks.map((link) => (
                <Button
                  key={link.key}
                  variant={link.canCreate ? 'default' : 'outline'}
                  className="min-w-[180px] justify-start"
                  asChild
                >
                  <Link href={link.href}>{link.canCreate ? `Ajukan ${link.label}` : `Lihat ${link.label}`}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Ringkasan Surat</h2>
            <p className="text-sm text-muted-foreground">Klik kartu untuk membuka halaman terkait.</p>
          </div>

          {widgets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {widgets.map((widget) => (
                <Link
                  key={widget.key}
                  href={widget.href}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Card className="h-full transition hover:shadow-md group-focus-visible:ring-0">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{widget.label}</span>
                        <span className="text-3xl font-semibold text-primary">{widget.count}</span>
                      </CardTitle>
                      <CardDescription>{widget.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Lihat detail lengkap dan kelola seluruh pengajuan {widget.label.toLowerCase()}.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Belum ada modul tersedia</CardTitle>
                <CardDescription>Anda belum memiliki akses ke modul pengajuan apa pun.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      </div>
    </SidebarLayout>
  );
}
