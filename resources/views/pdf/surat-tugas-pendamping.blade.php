<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Tugas Pendamping - {{ $suratTugas->nama_pendampingan ?? '{Nama Pendamping}' }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .date-place {
            text-align: right;
            margin-bottom: 20px;
        }
        .greeting {
            margin: 10px 0;
        }
        .content {
            margin: 20px 0;
            text-align: justify;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
        }
        .signature-table {
            width: 40%;
            margin: 40px auto 0 0;
            border-collapse: collapse;
        }
        .signature-table td {
            border: none;
            padding: 15px 5px;
        }
        .closing {
            margin-top: 30px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="date-place">
        Jakarta, {{ optional($suratTugas->tanggal_pengajuan)->translatedFormat('d F Y') ?? '{Tanggal berformat}' }}
    </div>

    @php
        $tanggalMulai = optional($suratTugas->tanggal_kegiatan)->translatedFormat('d F Y');
        $tanggalSelesai = optional($suratTugas->tanggal_kegiatan_berakhir)->translatedFormat('d F Y');
        $rentangTanggal = $tanggalMulai && $tanggalSelesai
            ? $tanggalMulai . ' s.d. ' . $tanggalSelesai
            : ($tanggalMulai ?? '{Tanggal Kegiatan}');
        $jenisKegiatan = $suratTugas->jenis_kegiatan
            ? ucfirst($suratTugas->jenis_kegiatan)
            : '{Online/Offline}';
    @endphp

    <div class="greeting">
        Ykh {{ $suratTugas->nama_pendampingan ?? '{Nama Pendamping}' }}<br>
        Assalamu'alaikum Wr.Wb.
    </div>

    <div class="content">
        <p>Semoga Allah SWT selalu melimpahkan rahmat dan karunia Nya kepada kita semua, Amin YRA.</p>

        <p>Sehubung dengan adanya kegiatan di {{ $suratTugas->nomorSurat ? $suratTugas->nomorSurat->nama_klien : '{Nama Bank}' }}
        secara {{ $jenisKegiatan }} maka kami menugaskan {Ibu/Bapak} sebagai {Pendamping}.</p>

        <p>Dengan agenda acara kegiatan:</p>

        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Tempat & Kegiatan</th>
                    <th>Tanggal</th>
                    <th>Bank</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>{{ $suratTugas->kegiatan ?: '{Nama Kegiatan}' }}</td>
                    <td>{{ $rentangTanggal }}</td>
                    <td>{{ $suratTugas->nomorSurat ? $suratTugas->nomorSurat->nama_klien : '{Nama Bank}' }}</td>
                </tr>
            </tbody>
        </table>

        <p>Untuk itu {Ibu/Bapak} ditugaskan untuk menjadi Pendamping untuk acara tersebut.</p>

        <p>Demikian surat tugas ini kami sampaikan agar dilaksanakan dengan penuh tanggung jawab dan atas kerjasamanya kami ucapkan terima kasih.</p>

        <p class="closing">Wassalamu'alaikum Wr.Wb.</p>
    </div>

    <table class="signature-table">
        <tr>
            <td>Manager,</td>
        </tr>
        <tr>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>(..................)</td>
        </tr>
    </table>

    <div class="footer">
        <p>Dokumen ini dihasilkan oleh sistem AP Operasional.</p>
    </div>
</body>
</html>
