import { useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { Menu, LogOut, UserCircle, LayoutDashboard, FileText, Users, FileEdit, ScrollText, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const drawerWidth = 260;

export default function SidebarLayout({ header, children }) {
  const { props } = usePage();
  const user = props.auth.user;
  const isAdmin = props.auth.isAdmin;
  const isFinanceManager = props.auth.isFinanceManager;
  const isOperationalManager = props.auth.isOperationalManager;
  const isKaryawan = props.auth.isKaryawan;
  const canSubmitSuratTugas = props.auth.canSubmitSuratTugas;
  const canSubmitInvoice = props.auth.canSubmitInvoice;
  const canViewSuratTugasList = isAdmin || isOperationalManager || isKaryawan;
  const canViewNomorSuratList = props.auth.canViewNomorSuratList;
  const canSubmitNomorSurat = props.auth.canSubmitNomorSurat;

  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const isActive = (namePattern) => route().current(namePattern);

  const dataNavItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: route('dashboard'),
      active: isActive('dashboard'),
    },
    ...(isFinanceManager || isAdmin
      ? [
          {
            label: 'Daftar Invoice',
            icon: FileText,
            href: route('invoices.index'),
            active: isActive('invoices.index'),
          },
        ]
      : []),
    ...(canViewSuratTugasList
      ? [
          {
            label: 'Daftar Surat Tugas',
            icon: ScrollText,
            href: route('surat-tugas.index'),
            active: isActive('surat-tugas.index'),
          },
        ]
      : []),
    ...(canViewNomorSuratList
      ? [
          {
            label: 'Daftar Nomor Surat',
            icon: FileSignature,
            href: route('nomor-surat.index'),
            active: isActive('nomor-surat.index'),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: 'Users',
            icon: Users,
            href: route('users.index'),
            active: isActive('users.*'),
          },
        ]
      : []),
  ];

  const submissionNavItems = [
    ...(canSubmitInvoice
      ? [
          {
            label: 'Pengajuan Invoice',
            icon: FileEdit,
            href: route('invoices.create'),
            active: isActive('invoices.create'),
          },
        ]
      : []),
    ...(canSubmitSuratTugas
      ? [
          {
            label: 'Pengajuan Surat Tugas',
            icon: FileEdit,
            href: route('surat-tugas.create'),
            active: isActive('surat-tugas.create'),
          },
        ]
      : []),
    ...(canSubmitNomorSurat
      ? [
          {
            label: 'Pengajuan Nomor Surat',
            icon: FileEdit,
            href: route('nomor-surat.create'),
            active: isActive('nomor-surat.create'),
          },
        ]
      : []),
  ];

  const onLogout = () => router.post(route('logout'));

  const drawerContent = (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href={route('dashboard')} className="text-base font-semibold">
          Admin Panel
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <NavSection title="Navigasi" items={dataNavItems} closeDrawer={() => setMobileOpen(false)} />
        {submissionNavItems.length > 0 && (
          <NavSection title="Pengajuan" items={submissionNavItems} closeDrawer={() => setMobileOpen(false)} />
        )}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={route('profile.edit')} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <UserCircle className="mr-2 h-4 w-4" />
            {user?.name || 'Profile'}
          </Link>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {/* Sidebar Desktop */}
      <aside className="hidden w-[260px] shrink-0 lg:block">{drawerContent}</aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={handleDrawerToggle} />
          <aside className="relative ml-auto h-full w-[260px] bg-card shadow-lg">{drawerContent}</aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="flex h-14 items-center gap-3 px-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={handleDrawerToggle}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-1 items-center justify-between">
              <Typography as="h1" className="text-base font-semibold">
                {header || 'Dashboard'}
              </Typography>
              <span className="hidden text-sm font-medium text-muted-foreground lg:block">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function NavSection({ title, items, closeDrawer }) {
  if (!items.length) return null;

  return (
    <div className="mb-6">
      <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map(({ label, icon: Icon, href, active }) => (
          <li key={label}>
            <Link
              href={href}
              onClick={closeDrawer}
              className={cn(
                'flex items-center rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              )}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Typography({ as = 'p', className, children }) {
  const Comp = as;
  return <Comp className={cn('leading-tight', className)}>{children}</Comp>;
}
