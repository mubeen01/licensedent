import { existsSync, readFileSync } from 'node:fs';
import { type PrismaClient } from '@prisma/client';

/**
 * Bulk-attach IDC lesson videos from D:\Dental\lessons\IDC-YOUTUBE-CHECKLIST.csv
 * (132 rows, one per LessonPart). The owner pastes each video's YouTube link
 * into the "YouTube link" column; this sets LessonPart.youtubeId for every
 * row that has one, matched by the CSV's lesson_slug + part columns.
 *
 * Usage (from ~/LicenseDent/app):
 *   DRY_RUN=1 wasp db seed attachIdcVideos      # report only
 *   wasp db seed attachIdcVideos
 *   IDC_VIDEOS_CSV=/path/to.csv wasp db seed attachIdcVideos   # other file
 *
 * Idempotent: rows with an empty link are skipped (an existing id is never
 * cleared), and re-running with the same links changes nothing. Accepts any
 * link form the admin page accepts (youtu.be, watch?v=, embed, shorts, bare id).
 */

const DEFAULT_CSV = '/mnt/d/Dental/lessons/IDC-YOUTUBE-CHECKLIST.csv';

// Same patterns as LessonsManagementPage's extractYoutubeId.
function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/watch\?(?:.*&)?v=|youtube(?:-nocookie)?\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (match) return match[1];
  return /^[A-Za-z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}

// Minimal RFC-4180 parser: quoted fields, "" escapes, CRLF (Excel's output).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

export async function attachIdcVideos(prismaClient: PrismaClient) {
  const csvPath = process.env.IDC_VIDEOS_CSV || DEFAULT_CSV;
  const dryRun = process.env.DRY_RUN === '1';
  if (!existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);

  const [header, ...rows] = parseCsv(readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''));
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`CSV is missing the "${name}" column`);
    return i;
  };
  const iSlug = col('lesson_slug');
  const iPart = col('part');
  const iLink = col('YouTube link');

  let attached = 0;
  let unchanged = 0;
  let empty = 0;
  const problems: string[] = [];

  for (const r of rows) {
    const slug = r[iSlug]?.trim();
    const order = Number(r[iPart]);
    const link = r[iLink]?.trim() ?? '';
    if (!link) {
      empty++;
      continue;
    }
    const youtubeId = extractYoutubeId(link);
    if (!youtubeId) {
      problems.push(`${slug} part ${order}: not a YouTube link: "${link}"`);
      continue;
    }
    const part = await prismaClient.lessonPart.findFirst({
      where: { order, lesson: { slug } },
      select: { id: true, youtubeId: true },
    });
    if (!part) {
      problems.push(`${slug} part ${order}: no such lesson part in this database`);
      continue;
    }
    if (part.youtubeId === youtubeId) {
      unchanged++;
      continue;
    }
    if (!dryRun) {
      await prismaClient.lessonPart.update({ where: { id: part.id }, data: { youtubeId } });
    }
    attached++;
    console.log(`  ${dryRun ? '[dry run] would attach' : 'attached'} ${slug} part ${order} -> ${youtubeId}${part.youtubeId ? ` (was ${part.youtubeId})` : ''}`);
  }

  console.log(
    `\n${dryRun ? '[DRY RUN] ' : ''}${attached} attached, ${unchanged} already correct, ${empty} rows without a link, ${problems.length} problems`
  );
  for (const p of problems) console.log(`  PROBLEM: ${p}`);
}
