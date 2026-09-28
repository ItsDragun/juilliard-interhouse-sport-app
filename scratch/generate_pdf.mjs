const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildPdf() {
  const prdPath = path.join(__dirname, '..', 'PRD.md');
  const mdContent = fs.readFileSync(prdPath, 'utf8');

  // Load marked dynamically using import or require
  const { marked } = await import('marked');

  const htmlBody = marked.parse(mdContent);

  // Logo base64 if exists
  const logoPath = path.join(__dirname, '..', 'public', 'assets', 'juilliard-logo.png');
  let logoBase64 = '';
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Juilliard Academy — Interhouse Sports Day PRD</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748B;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #1E293B;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    /* Cover Page Banner */
    .cover-container {
      text-align: center;
      padding: 40px 20px 30px;
      margin-bottom: 25px;
      border-bottom: 3px solid #0F172A;
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
      border-radius: 8px;
    }

    .cover-logo {
      width: 80px;
      height: auto;
      margin-bottom: 14px;
    }

    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 26pt;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
      text-transform: uppercase;
    }

    .cover-subtitle {
      font-family: 'Outfit', sans-serif;
      font-size: 13pt;
      font-weight: 600;
      color: #DC2626;
      margin: 0 0 16px 0;
      letter-spacing: 0.5px;
    }

    .cover-meta-grid {
      display: inline-grid;
      grid-template-columns: repeat(4, auto);
      gap: 16px;
      margin-top: 15px;
      padding: 10px 20px;
      background: #F1F5F9;
      border-radius: 6px;
      font-size: 8.5pt;
      color: #475569;
      text-align: left;
    }

    .cover-meta-item strong {
      color: #0F172A;
      display: block;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Outfit', sans-serif;
      color: #0F172A;
      font-weight: 800;
      margin-top: 1.6em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 18pt;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 6px;
      margin-top: 2.2em;
      break-before: page;
      page-break-before: always;
    }

    /* Exclude the very first h1 on page 1 from forced page break */
    .content-body > h1:first-of-type {
      break-before: auto;
      page-break-before: auto;
      margin-top: 0.5em;
    }

    h2 {
      font-size: 13pt;
      color: #1E293B;
      border-left: 4px solid #EF4444;
      padding-left: 8px;
      margin-top: 1.5em;
    }

    h3 {
      font-size: 11pt;
      color: #334155;
      margin-top: 1.2em;
    }

    h4 {
      font-size: 10pt;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    p {
      margin: 0.6em 0;
      text-align: justify;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      overflow: hidden;
    }

    thead {
      background: #0F172A;
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    th {
      padding: 7px 10px;
      text-align: left;
      border: 1px solid #334155;
      font-size: 8.5pt;
      color: #FFFFFF;
    }

    td {
      padding: 6px 10px;
      border: 1px solid #E2E8F0;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background: #F8FAFC;
    }

    tr:hover {
      background: #F1F5F9;
    }

    /* Callout & Blockquotes */
    blockquote {
      margin: 12px 0;
      padding: 10px 14px;
      border-left: 4px solid #2563EB;
      background: #EFF6FF;
      color: #1E40AF;
      border-radius: 0 6px 6px 0;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    /* Code blocks */
    pre {
      background: #0F172A;
      color: #F8FAFC;
      padding: 10px 12px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 7.5pt;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 10px 0;
      border: 1px solid #1E293B;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8pt;
      background: #F1F5F9;
      color: #0F172A;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #E2E8F0;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* Lists */
    ul, ol {
      margin: 0.5em 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 0.3em;
    }

    hr {
      border: none;
      border-top: 1px solid #E2E8F0;
      margin: 20px 0;
    }

    /* Tag and Medal Badges */
    .badge-gold { color: #B45309; font-weight: 700; }
    .badge-silver { color: #475569; font-weight: 700; }
    .badge-bronze { color: #92400E; font-weight: 700; }

    /* Footer stamp */
    .document-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #E2E8F0;
      font-size: 8pt;
      color: #94A3B8;
      text-align: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <div class="cover-container">
    ${logoBase64 ? `<img src="${logoBase64}" class="cover-logo" alt="Juilliard Academy" />` : ''}
    <div class="cover-title">Juilliard Academy</div>
    <div class="cover-subtitle">Interhouse Sports Day — Product Requirement Document (PRD)</div>
    <div class="cover-meta-grid">
      <div class="cover-meta-item">
        <strong>Platform ID</strong>
        ja-mega-26
      </div>
      <div class="cover-meta-item">
        <strong>Release Target</strong>
        2026 Sports Day
      </div>
      <div class="cover-meta-item">
        <strong>Document Status</strong>
        Production Baseline
      </div>
      <div class="cover-meta-item">
        <strong>Version</strong>
        1.0.0 (Official)
      </div>
    </div>
  </div>

  <div class="content-body">
    ${htmlBody}
  </div>

  <div class="document-footer">
    Juilliard Academy Interhouse Sports Day Application &bull; Project ID: ja-mega-26 &bull; Confidential &amp; Proprietary &bull; Approved by Tournament Secretariat
  </div>

</body>
</html>`;

  const htmlOutputPath = path.join(__dirname, 'prd_print.html');
  fs.writeFileSync(htmlOutputPath, fullHtml, 'utf8');
  console.log('Generated prd_print.html at:', htmlOutputPath);

  const pdfOutputPath = path.join(__dirname, '..', 'Juilliard_Academy_Sports_Day_PRD.pdf');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfOutputPath}" "file:///${htmlOutputPath.replace(/\\/g, '/')}"`;

  console.log('Running Chrome to generate PDF...');
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(pdfOutputPath)) {
    const stats = fs.statSync(pdfOutputPath);
    console.log(`Successfully generated PDF!`);
    console.log(`Path: ${pdfOutputPath}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.error('PDF file was not created.');
  }
}

buildPdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
