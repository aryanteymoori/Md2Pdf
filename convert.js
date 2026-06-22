const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MD_PATH = path.resolve(__dirname, '..', 'API-Document.md');
const PDF_PATH = path.resolve(__dirname, 'API-Document-v2.pdf');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false
});

function buildHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<style>
@font-face {
  font-family: 'Vazirmatn';
  src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Vazirmatn';
  src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Vazirmatn', 'Tahoma', sans-serif;
  font-size: 11px;
  line-height: 1.7;
  color: #1a1a1a;
  direction: rtl;
  text-align: right;
  padding: 20px 25px;
}
a { color: #0366d6; text-decoration: none; }
h1 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #0366d6; color: #0366d6; }
h2 { font-size: 16px; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #ccc; color: #24292e; }
h3 { font-size: 14px; margin: 16px 0 8px; color: #24292e; }
h4 { font-size: 12px; margin: 12px 0 6px; }
p { margin: 6px 0; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 10px;
}
th, td {
  border: 1px solid #bbb;
  padding: 5px 7px;
  text-align: right;
  vertical-align: top;
}
th {
  background: #e8f0fe;
  font-weight: 700;
  color: #1a1a1a;
}
tr:nth-child(even) { background: #f6f8fa; }
code {
  font-family: 'Cascadia Code', 'Consolas', monospace;
  font-size: 9.5px;
  direction: ltr;
  text-align: left;
  display: inline-block;
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 3px;
  unicode-bidi: embed;
}
pre {
  background: #f6f8fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px 12px;
  margin: 8px 0;
  direction: ltr;
  text-align: left;
  overflow-x: auto;
  page-break-inside: avoid;
}
pre code {
  background: none;
  padding: 0;
  border-radius: 0;
  display: block;
  white-space: pre;
}
ul, ol { margin: 5px 0; padding-right: 20px; }
li { margin: 3px 0; }
blockquote {
  border-right: 3px solid #0366d6;
  margin: 8px 0;
  padding: 5px 12px;
  background: #f0f7ff;
  color: #444;
}
hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
strong { font-weight: 700; }
.page-break { page-break-before: always; }
@media print {
  body { padding: 15px; }
  h1, h2, h3 { page-break-after: avoid; }
  pre, table { page-break-inside: avoid; }
}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

async function main() {
  const markdown = fs.readFileSync(MD_PATH, 'utf-8');
  const bodyHtml = md.render(markdown);
  const html = buildHtml(bodyHtml);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.pdf({
      path: PDF_PATH,
      format: 'A4',
      margin: { top: '15mm', bottom: '15mm', right: '15mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="width:100%;font-size:8px;font-family:Vazirmatn,sans-serif;
                    text-align:center;color:#888;padding:3px 15mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`
    });

    console.log(`PDF created: ${PDF_PATH}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
