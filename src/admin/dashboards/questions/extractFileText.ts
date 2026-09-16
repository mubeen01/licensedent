import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a hashed asset URL at build time; pdf.js loads its
// text/font-parsing work off the main thread through it.
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const LINE_Y_TOLERANCE = 2; // px, for grouping text items that sit on the same visual line

interface TextItemLike {
  str: string;
  transform: number[];
}

function pageTextToLines(items: TextItemLike[]): string[] {
  const rows: { y: number; x: number; str: string }[] = items
    .filter((item) => item.str.trim().length > 0)
    .map((item) => ({ y: item.transform[5], x: item.transform[4], str: item.str }));

  rows.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: string[][] = [];
  let currentY: number | null = null;
  for (const row of rows) {
    if (currentY === null || Math.abs(row.y - currentY) > LINE_Y_TOLERANCE) {
      lines.push([]);
      currentY = row.y;
    }
    lines[lines.length - 1].push(row.str);
  }

  return lines.map((parts) => parts.join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const allLines: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    allLines.push(...pageTextToLines(content.items as TextItemLike[]));
  }
  return allLines.join('\n');
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    return extractPdfText(file);
  }
  if (name.endsWith('.txt')) {
    return file.text();
  }
  throw new Error('Only .pdf and .txt files are supported');
}
