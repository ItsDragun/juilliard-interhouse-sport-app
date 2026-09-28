import os
import base64
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BODY_PATH = ROOT / "scratch" / "body.html"
LOGO_PATH = ROOT / "public" / "assets" / "juilliard-logo.png"
OUTPUT_HTML = ROOT / "scratch" / "styled_prd.html"
OUTPUT_PDF = ROOT / "Juilliard_Academy_Sports_Day_PRD.pdf"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with open(BODY_PATH, "r", encoding="utf-8") as f:
    body_content = f.read()

logo_base64 = ""
if LOGO_PATH.exists():
    with open(LOGO_PATH, "rb") as f:
        logo_base64 = base64.b64encode(f.read()).decode("utf-8")

# Remove redundant top h1 since the cover banner already has it
if body_content.startswith("<h1>PRODUCT REQUIREMENT DOCUMENT (PRD)</h1>"):
    body_content = body_content.replace("<h1>PRODUCT REQUIREMENT DOCUMENT (PRD)</h1>", "", 1)
    body_content = body_content.replace("<h2>Project: Juilliard Academy Interhouse Sports Day Application</h2>", "", 1)

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Juilliard Academy — Interhouse Sports Day PRD</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {{
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9pt;
      line-height: 1.55;
      color: #1E293B;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }}

    /* Cover Page Banner */
    .cover-banner {{
      text-align: center;
      padding: 30px 20px 24px;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: #FFFFFF;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }}

    .cover-logo {{
      width: 70px;
      height: auto;
      margin-bottom: 12px;
      background: #FFFFFF;
      padding: 6px;
      border-radius: 50%;
    }}

    .cover-title {{
      font-family: 'Outfit', sans-serif;
      font-size: 22pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
      color: #FFFFFF;
      text-transform: uppercase;
    }}

    .cover-subtitle {{
      font-family: 'Outfit', sans-serif;
      font-size: 11.5pt;
      font-weight: 600;
      color: #FBBF24;
      margin: 0 0 16px 0;
      letter-spacing: 0.5px;
    }}

    .cover-meta-grid {{
      display: flex;
      justify-content: center;
      gap: 18px;
      flex-wrap: wrap;
      margin-top: 10px;
    }}

    .cover-meta-item {{
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 8pt;
      text-align: left;
    }}

    .cover-meta-item strong {{
      display: block;
      color: #94A3B8;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    .cover-meta-item span {{
      color: #F8FAFC;
      font-weight: 600;
    }}

    /* Headings */
    h1, h2, h3, h4, h5, h6 {{
      font-family: 'Outfit', sans-serif;
      color: #0F172A;
      margin-top: 1.4em;
      margin-bottom: 0.4em;
      page-break-after: avoid;
      break-after: avoid;
    }}

    h1 {{
      font-size: 15pt;
      font-weight: 800;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 5px;
      margin-top: 2em;
    }}

    h2 {{
      font-size: 12.5pt;
      font-weight: 800;
      color: #0F172A;
      border-left: 4px solid #EF4444;
      padding-left: 8px;
      margin-top: 1.6em;
      break-after: avoid;
      page-break-after: avoid;
    }}

    h3 {{
      font-size: 10.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 1.2em;
      break-after: avoid;
      page-break-after: avoid;
    }}

    h4 {{
      font-size: 9.5pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }}

    p {{
      margin: 0.5em 0;
      text-align: justify;
    }}

    /* Tables */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px;
      font-size: 8pt;
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      overflow: hidden;
    }}

    thead {{
      background: #0F172A;
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
    }}

    th {{
      padding: 6px 9px;
      text-align: left;
      border: 1px solid #334155;
      color: #FFFFFF;
      font-size: 8pt;
    }}

    td {{
      padding: 5px 9px;
      border: 1px solid #E2E8F0;
      vertical-align: top;
      color: #334155;
    }}

    tr:nth-child(even) {{
      background: #F8FAFC;
    }}

    /* Blockquotes */
    blockquote {{
      margin: 10px 0;
      padding: 8px 14px;
      border-left: 4px solid #2563EB;
      background: #EFF6FF;
      color: #1E40AF;
      border-radius: 0 6px 6px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    blockquote p {{
      margin: 0;
    }}

    /* Code & Pre */
    pre {{
      background: #0F172A;
      color: #F8FAFC;
      padding: 9px 12px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 7.5pt;
      line-height: 1.42;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 10px 0;
      border: 1px solid #1E293B;
    }}

    code {{
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8pt;
      background: #F1F5F9;
      color: #0F172A;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #E2E8F0;
    }}

    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }}

    ul, ol {{
      margin: 0.4em 0;
      padding-left: 18px;
    }}

    li {{
      margin-bottom: 0.25em;
    }}

    hr {{
      border: none;
      border-top: 1px solid #E2E8F0;
      margin: 18px 0;
    }}

    /* Running Document Footer */
    .doc-footer {{
      margin-top: 30px;
      padding-top: 12px;
      border-top: 2px solid #E2E8F0;
      font-size: 7.5pt;
      color: #64748B;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }}
  </style>
</head>
<body>

  <div class="cover-banner">
    {"<img src='data:image/png;base64," + logo_base64 + "' class='cover-logo' alt='Juilliard Academy' />" if logo_base64 else ""}
    <div class="cover-title">Juilliard Academy</div>
    <div class="cover-subtitle">Interhouse Sports Day — Product Requirement Document (PRD)</div>
    <div class="cover-meta-grid">
      <div class="cover-meta-item">
        <strong>Platform Identifier</strong>
        <span>ja-mega-26</span>
      </div>
      <div class="cover-meta-item">
        <strong>Target Session</strong>
        <span>2026 Academic Year</span>
      </div>
      <div class="cover-meta-item">
        <strong>Document Status</strong>
        <span>Production Baseline</span>
      </div>
      <div class="cover-meta-item">
        <strong>Version</strong>
        <span>1.0.0 (Official Release)</span>
      </div>
    </div>
  </div>

  <div class="content-body">
    {body_content}
  </div>

  <div class="doc-footer">
    Juilliard Academy Interhouse Sports Day Application &bull; Project Identifier: ja-mega-26 &bull; Official Architecture Specification &bull; Confidential
  </div>

</body>
</html>
"""

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html_template)

print(f"Generated {OUTPUT_HTML}")

# Command to execute headless Chrome to PDF
cmd = [
    CHROME_PATH,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={OUTPUT_PDF}",
    OUTPUT_HTML.as_uri()
]

print("Executing Chrome headless print-to-pdf...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0 and OUTPUT_PDF.exists():
    size_kb = OUTPUT_PDF.stat().st_size / 1024
    print(f"SUCCESS: Generated PDF at: {OUTPUT_PDF} ({size_kb:.1f} KB)")
else:
    print(f"FAILED to generate PDF. Exit code: {res.returncode}")
    print(res.stderr)
