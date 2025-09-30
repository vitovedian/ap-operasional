<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Tugas Trainer - {{ $suratTugas->instruktor_1_nama ?? $suratTugas->instruktor_2_nama ?? '{Nama Trainer}' }}</title>
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
        Tanggal: {{ optional($suratTugas->tanggal_pengajuan)->translatedFormat('d F Y') ?? '{Tanggal Pengajuan}' }}<br>
        Nomor Surat: {{ $suratTugas->nomorSurat ? $suratTugas->nomorSurat->formatted_nomor_surat : '{Nomor Surat}' }}
    </div>

    <div class="greeting">
        Kepada Yth,<br>
        {{ $suratTugas->instruktor_1_nama ?? $suratTugas->instruktor_2_nama ?? '{Nama Trainer}' }}<br>
        Assalamu'alaikum Wr.Wb.
    </div>

    <div class="content">
        <p>Semoga Allah SWT selalu melimpahkan rahmat dan karunia Nya kepada kita semua, Amin YRA.</p>

        <p>Sehubung dengan adanya kegiatan di {{ $suratTugas->nomorSurat ? $suratTugas->nomorSurat->nama_klien : '{Nama Bank}' }}
        maka kami menugaskan {Ibu/Bapak} sebagai Trainer secara {{ $suratTugas->kegiatan ? 'Offline' : '{Online/Offline}' }}</p>

        <p>Dengan jadwal sebagai berikut :</p>

        <table>
            <thead>
                <tr>
                    <th>Tanggal Kegiatan</th>
                    <th>Nama Kegiatan</th>
                    <th>Fee</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ optional($suratTugas->tanggal_kegiatan)->translatedFormat('d F Y') ?: '{Tanggal Kegiatan}' }}</td>
                    <td>{{ $suratTugas->kegiatan ?: '{Nama Kegiatan}' }}</td>
                    <td>Rp {{ number_format($suratTugas->instruktor_1_fee ?? 0, 0, ',', '.') }} x {banyak jpl}</td>
                </tr>
            </tbody>
        </table>

        <p><strong>Total: Rp {{ number_format(($suratTugas->instruktor_1_fee ?? 0) * ($suratTugas->jumlah_jpl ?? 1), 0, ',', '.') }}</strong></p>

        <p><strong>Dengan Tugas sebagai berikut :</strong></p>
        <ol>
            <li>Mengajar peserta sesuai Rundown yang di berikan</li>
            <li>Menjadikan komunikasi 2 arah dengan peserta</li>
            <li>Memberikan RolePlay soal dan pembahasan</li>
        </ol>

        <p>Terima kasih atas kerja sama dan supporting {Ibu/Bapak} kepada Synergy Partner Prima semoga terjalin komunikasi, kerja sama yang harmonis dan berdampak.</p>

        <p class="closing">Wassalamu'alaikum Wr.Wb.</p>
        <p class="closing">Hormat Kami,</p>
        <p><b>Synergy Partner Prima</b></p>
    </div>

    <table class="signature-table">
        <thead>
            <tr>
                <th>Manager,</th>
                <th>PIC,</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>(..................)</td>
                <td>(..................)</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>Dokumen ini dihasilkan oleh sistem AP Operasional.</p>
    </div>
</body>
</html>
