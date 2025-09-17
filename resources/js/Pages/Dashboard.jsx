import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <SidebarLayout header={<h1 className="text-xl font-semibold text-foreground">Dashboard</h1>}>
      <Head title="Dashboard" />

      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Selamat datang!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Anda berhasil masuk. Gunakan menu di samping untuk mengelola data operasional.</p>
            <Button variant="outline" asChild>
              <a href="https://shadcn.com" target="_blank" rel="noopener">
                Lihat dokumentasi komponen baru
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
