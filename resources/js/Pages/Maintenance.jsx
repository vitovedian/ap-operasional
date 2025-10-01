import { Head, Link } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';

export default function Maintenance() {
  return (
    <SidebarLayout header={<Typography>Sedang Maintenance</Typography>}>
      <Head title="Sedang Maintenance" />
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-foreground">Sedang Maintenance</h2>
            <p className="text-sm text-muted-foreground">
              Halaman ini untuk sementara tidak dapat diakses karena sedang dalam proses pemeliharaan.
              Silakan kembali lagi nanti atau hubungi administrator apabila Anda membutuhkan akses segera.
            </p>
          </div>
          <Button asChild size="lg" className="mx-auto">
            <Link href={route('dashboard')}>Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
}

function Typography({ children }) {
  return <h1 className="text-xl font-semibold text-foreground">{children}</h1>;
}
