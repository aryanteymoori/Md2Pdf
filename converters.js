const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const Turndown = require('turndown');

const turndown = new Turndown();

const SUPPORTED = {
  '.pdf': 'PDF',
  '.docx': 'Word',
  '.doc': 'Word (old)',
  '.xlsx': 'Excel',
  '.xls': 'Excel (old)',
  '.pptx': 'PowerPoint',
};

function isSupported(ext) {
  return ext in SUPPORTED;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function outputPathFor(inputPath, outDir) {
  const ext = path.extname(inputPath).toLowerCase();
  const base = path.basename(inputPath, ext);
  const suffix = ext.slice(1);
  const name = outDir
    ? path.join(outDir, `${base}.${suffix}.md`)
    : inputPath.replace(ext, `.${suffix}.md`);
  return name;
}

async function convertPdf(inputPath) {
  const buf = fs.readFileSync(inputPath);
  const data = await pdfParse(buf);
  const ext = path.extname(inputPath);
  let md = `# ${path.basename(inputPath, ext)}\n\n`;
  if (data.info?.Title) md += `**Title:** ${data.info.Title}\n`;
  if (data.info?.Author) md += `**Author:** ${data.info.Author}\n`;
  if (data.numpages) md += `**Pages:** ${data.numpages}\n\n`;
  md += `---\n\n${data.text}`;
  return md;
}

async function convertDocx(inputPath) {
  const buf = fs.readFileSync(inputPath);
  const result = await mammoth.convertToHtml({ buffer: buf });
  const ext = path.extname(inputPath);
  let md = `# ${path.basename(inputPath, ext)}\n\n`;
  md += turndown.turndown(result.value);
  if (result.messages.length) {
    md += `\n\n> ⚠️ ${result.messages.map(m => m.message).join('; ')}`;
  }
  return md;
}

async function convertXlsx(inputPath) {
  const wb = XLSX.readFile(inputPath);
  const ext = path.extname(inputPath);
  let md = `# ${path.basename(inputPath, ext)}\n\n`;

  wb.SheetNames.forEach((name, idx) => {
    const ws = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!json.length) return;

    if (idx > 0) md += `\n\n---\n\n`;
    md += `## ${name}\n\n`;

    const rows = json;
    const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);

    if (rows.length > 0) {
      md += `| ${rows[0].map(c => c ?? '').join(' | ')} |\n`;
      md += `| ${Array(maxCols).fill('---').join(' | ')} |\n`;
    }

    for (let i = 1; i < rows.length; i++) {
      md += `| ${rows[i].map(c => c ?? '').join(' | ')} |\n`;
    }
  });

  return md;
}

async function convertPptx(inputPath) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(inputPath));
  const ext = path.extname(inputPath);
  let md = `# ${path.basename(inputPath, ext)}\n\n`;
  let slideNum = 0;

  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort();

  for (const slideFile of slideFiles) {
    slideNum++;
    const xml = await zip.files[slideFile].async('text');
    const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map(m => m[1]);
    if (texts.length) {
      md += `## Slide ${slideNum}\n\n${texts.join('\n\n')}\n\n`;
    }
  }

  if (slideNum === 0) md += '*No slides found.*\n';
  return md;
}

async function convertFile(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`);

  const ext = path.extname(inputPath).toLowerCase();
  if (!isSupported(ext)) {
    throw new Error(`Unsupported format: ${ext}. Supported: ${Object.keys(SUPPORTED).join(', ')}`);
  }

  let md;
  switch (ext) {
    case '.pdf':
      md = await convertPdf(inputPath);
      break;
    case '.docx':
    case '.doc':
      md = await convertDocx(inputPath);
      break;
    case '.xlsx':
    case '.xls':
      md = await convertXlsx(inputPath);
      break;
    case '.pptx':
      md = await convertPptx(inputPath);
      break;
    default:
      throw new Error(`Unsupported format: ${ext}`);
  }

  if (!outputPath) outputPath = outputPathFor(inputPath, null);
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, md, 'utf-8');

  return { input: inputPath, output: outputPath };
}

async function convertFolder(inputDir, outputDir, recursive) {
  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(inputDir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        const subOut = path.join(outputDir, entry.name);
        const subResults = await convertFolder(fullPath, subOut, true);
        results.push(...subResults);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (isSupported(ext)) {
        const outPath = outputPathFor(fullPath, outputDir);
        const r = await convertFile(fullPath, outPath);
        results.push(r);
      }
    }
  }

  return results;
}

module.exports = { convertFile, convertFolder, SUPPORTED };
