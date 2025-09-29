<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Surat Tugas PDF</title>
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
        <div class="title">TEST PDF TEMPLATE</div>
        <div class="subtitle">This is a test template for PDF generation</div>
    </div>

    <div class="content">
        <div class="section-title">Test Section</div>
        <div class="info-box">
            <p>This is a test PDF template to verify that the PDF generation functionality is working properly.</p>
            <p>If you see this, the PDF generation with DomPDF is working correctly.</p>
        </div>
        
        <div class="section-title">Sample Data</div>
        <div class="info-box">
            <table>
                <tr>
                    <td width="30%"><strong>Sample Field</strong></td>
                    <td width="70%">Sample Value</td>
                </tr>
                <tr>
                    <td><strong>Another Field</strong></td>
                    <td>Another Value</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="footer">
        <p>This is a test document.</p>
    </div>
</body>
</html>