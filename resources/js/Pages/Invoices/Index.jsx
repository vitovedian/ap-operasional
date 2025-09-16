import { Head, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Container, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Button } from '@mui/material';

function toIDR(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function InvoicesIndex({ invoices }) {
  const { props } = usePage();

  return (
    <SidebarLayout header={<Typography variant="h6">Daftar Invoice</Typography>}>
      <Head title="Daftar Invoice" />
      <Container sx={{ py: 2 }}>
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tgl Pengajuan</TableCell>
                <TableCell>Tgl Invoice</TableCell>
                <TableCell>Kegiatan</TableCell>
                <TableCell align="right">Tagihan (Rp)</TableCell>
                <TableCell>PPN</TableCell>
                <TableCell align="right">Total OPE (Rp)</TableCell>
                <TableCell>Diajukan oleh</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.data.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.tanggal_pengajuan}</TableCell>
                  <TableCell>{inv.tanggal_invoice}</TableCell>
                  <TableCell>{inv.kegiatan}</TableCell>
                  <TableCell align="right">{toIDR(inv.tagihan_invoice)}</TableCell>
                  <TableCell>{inv.ppn}</TableCell>
                  <TableCell align="right">{toIDR(inv.total_invoice_ope)}</TableCell>
                  <TableCell>{inv.user?.name || '-'}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" component="a" href={inv.download_url} target="_blank" rel="noopener">Unduh Bukti</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Stack direction="row" spacing={1} sx={{ p: 2 }}>
            {invoices.links.map((l, idx) => (
              <Button key={idx} size="small" variant={l.active ? 'contained' : 'text'} disabled={!l.url} href={l.url || '#'}>
                {l.label.replace(/&laquo;|&raquo;|&lsaquo;|&rsaquo;/g, '')}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Container>
    </SidebarLayout>
  );
}
