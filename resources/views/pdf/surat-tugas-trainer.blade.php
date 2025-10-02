<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Tugas Instruktor - {{ $selectedInstructor['name'] ?? $suratTugas->instruktor_1_nama ?? $suratTugas->instruktor_2_nama ?? '{Nama Trainer}' }}</title>
    <style>
        @page {
            margin: 20px;
            size: A4;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.4;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
        }
        .date-place {
            text-align: left;
            font-size: 11px;
            margin-bottom: 10px;
        }
        .greeting {
            margin: 8px 0;
        }
        .content {
            margin: 10px 0;
            text-align: justify;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 11px;
        }
        th, td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
        }
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .signature-table td {
            border: none;
            padding: 3px 5px;
        }
        .closing {
            margin-top: 20px;
            clear: both;
        }
        .footer {
            position: absolute;
            bottom: 10px;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="date-place">
        Tanggal&#9;&#9;: {{ optional($suratTugas->tanggal_pengajuan)->translatedFormat('d F Y') ?? '{Tanggal Pengajuan}' }}<br>
        No&#9;&#9;: {{ $suratTugas->nomorSurat ? $suratTugas->nomorSurat->formatted_nomor_surat : '{Nomor Surat}' }}
    </div>

    <div class="greeting">
        Kepada Yth : <br>
        {{ $selectedInstructor['name'] ?? $suratTugas->instruktor_1_nama ?? $suratTugas->instruktor_2_nama ?? '{Nama Trainer}' }}<br>
    </div>

    <div class="content">
        <p>Assalamu'alaikum Wr.Wb.
        Semoga Allah SWT selalu melimpahkan rahmat dan karunia Nya kepada kita semua, Amin YRA.</p>

        <p>Sehubung dengan adanya kegiatan di {{ $suratTugas->nomorSurat ? $suratTugas->nomorSurat->nama_klien : '{Nama Bank}' }}
        maka kami menugaskan {Ibu/Bapak} sebagai Trainer secara {{ $suratTugas->kegiatan ? 'Offline' : '{Online/Offline}' }}
        Dengan jadwal sebagai berikut :</p>

        @php
            $jumlahJpl = $suratTugas->jumlah_jpl ?? 1;
            $instruktors = collect(range(1, 5))->map(function ($index) use ($suratTugas) {
                $name = $suratTugas->{"instruktor_{$index}_nama"};
                $fee = $suratTugas->{"instruktor_{$index}_fee"} ?? 0;
                return $name ? ['index' => $index, 'nama' => $name, 'fee' => (int) $fee] : null;
            })->filter()->values();

            if (!empty($selectedInstructor['name'] ?? null)) {
                $instruktors = collect([$selectedInstructor])->map(function ($instr) {
                    return [
                        'index' => $instr['index'] ?? null,
                        'nama' => $instr['name'],
                        'fee' => (int) ($instr['fee'] ?? 0),
                    ];
                });
            }

            $totalFee = $instruktors->sum('fee') * $jumlahJpl;
        @endphp

        <table>
            <thead>
                <tr>
                    <th>Tanggal Kegiatan</th>
                    <th>Nama Kegiatan</th>
                    <th>Fee</th>
                </tr>
            </thead>
            <tbody>
                @forelse($instruktors as $instruktor)
                <tr>
                    <td>{{ optional($suratTugas->tanggal_kegiatan)->translatedFormat('d F Y') ?: '{Tanggal Kegiatan}' }}</td>
                    <td>{{ $suratTugas->kegiatan ?: '{Nama Kegiatan}' }} - {{ $instruktor['nama'] }}</td>
                    <td>Rp {{ number_format($instruktor['fee'], 0, ',', '.') }} x {banyak jpl}</td>
                </tr>
                @empty
                <tr>
                    <td>{{ optional($suratTugas->tanggal_kegiatan)->translatedFormat('d F Y') ?: '{Tanggal Kegiatan}' }}</td>
                    <td>{{ $suratTugas->kegiatan ?: '{Nama Kegiatan}' }}</td>
                    <td>-</td>
                </tr>
                @endforelse
            </tbody>
        </table>
        
        <p><strong>Total: Rp {{ number_format($totalFee, 0, ',', '.') }}</strong></p>

        <p><strong>Dengan Tugas sebagai berikut :</strong></p>
        <ol>
            <li>Mengajar peserta sesuai Rundown yang di berikan</li>
            <li>Menjadikan komunikasi 2 arah dengan peserta</li>
            <li>Memberikan RolePlay soal dan pembahasan</li>
        </ol>

        <p>Terima kasih atas kerja sama dan supporting {Ibu/Bapak} kepada Synergy Partner Prima semoga terjalin komunikasi, kerja sama yang harmonis dan berdampak.</p>

        <p class="closing">Wassalamu'alaikum Wr.Wb.</p>
        <p class="closing">Hormat Kami,<Br>
        <b>Synergy Partner Prima</b></p>
    </div>

    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td>Manager</td>
                <td>PIC</td>
            </tr>
            <tr>
                <td style="padding-top: 40px;">(..................)</td>
                <td style="padding-top: 40px;">(..................)</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Dokumen ini dihasilkan oleh sistem AP Operasional.</p>
    </div>
</body>
</html>
