# Md2Pdf / Universal Converter

A unified Node.js tool that converts **Markdown ↔ PDF** and **Office files (Word, Excel, PowerPoint, PDF) → Markdown**.

---

## Features

- Convert any `.md` file to beautifully styled RTL PDF (Persian/Arabic support)
- Convert `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx` files to Markdown
- Batch convert entire folders (with recursive option)
- RTL support with Vazirmatn font for PDF output
- Page numbers in footer
- Cross-platform (Windows, macOS, Linux)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Google Chrome](https://www.google.com/chrome/) installed in default location (for MD → PDF)
- npm packages:

```bash
npm install
```

---

## Usage

```
node convert.js <input-path> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | Output file or folder path |
| `-r, --recursive` | Process subdirectories recursively (folder mode) |

### Examples

**Markdown → PDF:**
```bash
node convert.js document.md
node convert.js document.md -o output.pdf
```

**PDF → Markdown:**
```bash
node convert.js document.pdf
```

**Word → Markdown:**
```bash
node convert.js report.docx
```

**Excel → Markdown:**
```bash
node convert.js data.xlsx
```

**PowerPoint → Markdown:**
```bash
node convert.js slides.pptx
```

**Batch convert folder:**
```bash
node convert.js ./docs -o ./output
node convert.js ./docs -o ./output -r
```

### Using `md2pdf` command (Windows)

Add the project folder to your `PATH`, then:

```bash
md2pdf document.md
md2pdf document.docx
md2pdf ./docs -o ./output -r
```

---

## Supported formats

| Input | Output |
|-------|--------|
| `.md` | `.pdf` |
| `.pdf` | `.md` |
| `.docx`, `.doc` | `.md` |
| `.xlsx`, `.xls` | `.md` |
| `.pptx` | `.md` |

---

## Configuration (MD → PDF)

Edit `convert.js` to customize:

| Setting | Location | Description |
|---------|----------|-------------|
| Chrome path | `CHROME_PATH` | Path to Chrome executable |
| Paper size | `page.pdf()` options | A4, Letter, etc. |
| Margins | `page.pdf()` options | Top, bottom, left, right |
| Font | CSS `@font-face` | Change or remove font |

---

## License

MIT
