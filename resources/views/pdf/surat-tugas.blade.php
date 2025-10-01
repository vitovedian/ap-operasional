<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Tugas - {{ $suratTugas->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .subtitle {
            font-size: 16px;
            color: #666;
        }
        .content {
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #888;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #444;
        }
        .info-box {
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SURAT TUGAS</div>
        <div class="subtitle">
            Nomor: {{ $suratTugas->nomorSurat ? $suratTugas->nomorSurat->formatted_nomor_surat : sprintf('ID: %d', $suratTugas->id) }}
        </div>
        <div class="subtitle">
            Tanggal Terbit: {{ optional($suratTugas->tanggal_pengajuan)->translatedFormat('d F Y') ?? '-' }}
        </div>
    </div>

    <div class="content">
        <div class="section-title">DETAIL PENUGASAN</div>
        <div class="info-box">
            <table>
                <tr>
                    <td width="30%"><strong>Nama Kegiatan</strong></td>
                    <td width="70%">{{ $suratTugas->kegiatan }}</td>
                </tr>
                <tr>
                    <td><strong>Tanggal Kegiatan</strong></td>
                    <td>{{ optional($suratTugas->tanggal_kegiatan)->translatedFormat('d F Y') ?? '-' }}</td>
                </tr>
                <tr>
                    <td><strong>Nama Pendampingan</strong></td>
                    <td>{{ $suratTugas->nama_pendampingan ?: '-' }}</td>
                </tr>
                <tr>
                    <td><strong>PIC Penanggung Jawab</strong></td>
                    @php
                        $picNames = $suratTugas->pics->pluck('name')->filter()->implode(', ');
                    @endphp
                    <td>{{ $picNames !== '' ? $picNames : ($suratTugas->pic ? $suratTugas->pic->name : '-') }}</td>
                </tr>
                <tr>
                    <td><strong>Pengaju</strong></td>
                    <td>{{ $suratTugas->user ? $suratTugas->user->name : '-' }}</td>
                </tr>
            </table>
        </div>

        <div class="section-title">PEMBIAYAAN</div>
        <div class="info-box">
            <table>
                <tr>
                    <td width="30%"><strong>Fee Pendampingan</strong></td>
                    <td width="70%">Rp {{ number_format($suratTugas->fee_pendampingan, 0, ',', '.') }}</td>
                </tr>
                @php
                    $instruktors = collect(range(1, 5))->map(function ($index) use ($suratTugas) {
                        $name = $suratTugas->{"instruktor_{$index}_nama"};
                        $fee = $suratTugas->{"instruktor_{$index}_fee"} ?? 0;

                        return $name ? ['nama' => $name, 'fee' => (int) $fee] : null;
                    })->filter()->values();
                    $totalInstruktur = $instruktors->sum('fee');
                @endphp

                @if($instruktors->isEmpty())
                <tr>
                    <td><strong>Instruktur</strong></td>
                    <td>-</td>
                </tr>
                @else
                    @foreach($instruktors as $idx => $instruktor)
                    <tr>
                        <td><strong>Instruktur {{ $idx + 1 }}</strong></td>
                        <td>{{ $instruktor['nama'] }} (Rp {{ number_format($instruktor['fee'], 0, ',', '.') }})</td>
                    </tr>
                    @endforeach
                @endif
                <tr>
                    <td><strong>Total Estimasi</strong></td>
                    <td>Rp {{ number_format(($suratTugas->fee_pendampingan ?? 0) + $totalInstruktur, 0, ',', '.') }}
                    </td>
                </tr>
            </table>
        </div>

        <div class="section-title">INFORMASI TAMBAHAN</div>
        <div class="info-box">
            <table>
                <tr>
                    <td width="30%"><strong>Status Persetujuan</strong></td>
                    <td width="70%">{{ strtoupper($suratTugas->status ?? 'PENDING') }}</td>
                </tr>
                <tr>
                    <td><strong>Tanggal Dibuat</strong></td>
                    <td>{{ optional($suratTugas->created_at)->format('d F Y H:i') ?? '-' }}</td>
                </tr>
                @if($suratTugas->catatan_revisi)
                <tr>
                    <td><strong>Catatan Revisi</strong></td>
                    <td>{{ $suratTugas->catatan_revisi }}</td>
                </tr>
                @endif
                @if($suratTugas->processed_by)
                <tr>
                    <td><strong>Di Proses Oleh</strong></td>
                    <td>{{ $suratTugas->processor ? $suratTugas->processor->name : '-' }}</td>
                </tr>
                <tr>
                    <td><strong>Tanggal Proses</strong></td>
                    <td>{{ optional($suratTugas->processed_at)->format('d F Y H:i') ?? '-' }}</td>
                </tr>
                @endif
            </table>
        </div>
    </div>

    <div class="footer">
        <p>Dokumen ini dihasilkan oleh sistem AP Operasional.</p>
    </div>
</body>
</html>
