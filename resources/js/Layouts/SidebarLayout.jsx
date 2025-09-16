import { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const drawerWidth = 240;

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
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => setMobileOpen((v) => !v);
    const isActive = (namePattern) => route().current(namePattern);

    const dataNavItems = [
        {
            label: 'Dashboard',
            icon: <DashboardIcon />,
            href: route('dashboard'),
            active: isActive('dashboard'),
        },
        ...(isFinanceManager || isAdmin
            ? [
                  {
                      label: 'Daftar Invoice',
                      icon: <RequestQuoteIcon />,
                      href: route('invoices.index'),
                      active: isActive('invoices.index'),
                  },
              ]
            : []),
        ...(canViewSuratTugasList
            ? [
                  {
                      label: 'Daftar Surat Tugas',
                      icon: <AssignmentTurnedInIcon />,
                      href: route('surat-tugas.index'),
                      active: isActive('surat-tugas.index'),
                  },
              ]
            : []),
        ...(isAdmin
            ? [
                  {
                      label: 'Users',
                      icon: <PeopleIcon />,
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
                      icon: <RequestQuoteIcon />,
                      href: route('invoices.create'),
                      active: isActive('invoices.create'),
                  },
              ]
            : []),
        ...(canSubmitSuratTugas
            ? [
                  {
                      label: 'Pengajuan Surat Tugas',
                      icon: <RequestQuoteIcon />,
                      href: route('surat-tugas.create'),
                      active: isActive('surat-tugas.create'),
                  },
              ]
            : []),
    ];

    const onLogout = () => router.post(route('logout'));

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" noWrap component={Link} href={route('dashboard')} style={{ textDecoration: 'none', color: 'inherit' }}>
                    Admin Panel
                </Typography>
            </Box>
            <Divider />
            <List sx={{ flex: 1 }}>
                {dataNavItems.map((item) => (
                    <ListItem key={item.label} disablePadding>
                        <ListItemButton selected={item.active} onClick={() => router.visit(item.href)}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}

                {submissionNavItems.length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Pengajuan
                            </Typography>
                        </Divider>
                        {submissionNavItems.map((item) => (
                            <ListItem key={item.label} disablePadding>
                                <ListItemButton selected={item.active} onClick={() => router.visit(item.href)}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </>
                )}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Button startIcon={<AccountCircleIcon />} component={Link} href={route('profile.edit')} sx={{ mr: 1 }}>
                    Profile
                </Button>
                <Button startIcon={<LogoutIcon />} onClick={onLogout} color="error">
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {header || 'Dashboard'}
                    </Typography>
                    <Typography variant="body2" color="inherit">
                        {user?.name}
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
