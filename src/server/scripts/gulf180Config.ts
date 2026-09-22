/**
 * Shared prefix -> Subject mapping for the Gulf-180 pipeline (see
 * D:\Dental\lessons\GULF-180-MASTER-REFERENCE.md), used by both
 * importGulf180Videos.ts (video -> LessonPart order) and importMcqBatches.ts
 * (mcq-batches/<prefix>/*.json -> Subject). Single source of truth so a
 * folder's prefix always resolves to the same canonical Subject name
 * regardless of what a given batch file's own `subjectName` field says --
 * content generators have repeatedly invented slightly different labels per
 * batch (e.g. "Oral Surgery + LA" vs. the actual existing Subject "Oral and
 * Maxillofacial Surgery"), which would otherwise silently fork a duplicate
 * Subject on every naming drift instead of merging into the existing one.
 *
 * `offset` is the Gulf-180 global video-number offset (section 4 of the
 * master reference: ENDO 1-25, PERIO 26-50, SURG 51-75, OPER 76-95,
 * PROS 96-115, PHARMA 116-130, PATH 131-145, PEDO 146-165, RADIO 166-180) --
 * only meaningful for importGulf180Videos.ts's LessonPart ordering, unused
 * by importMcqBatches.ts.
 */
export const PREFIX_CONFIG: Record<string, { subject: string; offset: number }> = {
  endo: { subject: 'Endodontics', offset: 0 },
  perio: { subject: 'Periodontics', offset: 25 },
  surg: { subject: 'Oral and Maxillofacial Surgery', offset: 50 },
  oper: { subject: 'Operative Dentistry', offset: 75 },
  pros: { subject: 'Prosthodontics', offset: 95 },
  pharma: { subject: 'Pharmacology', offset: 115 },
  // Added 2026-09-22 at the user's request -- no existing Subject matched
  // PATH/MED or RADIO/ETHICS/RECALL before this.
  path: { subject: 'Oral Pathology and Medicine', offset: 130 },
  pedo: { subject: 'Orthodontics and Pediatric Dentistry', offset: 145 },
  // ortho: same Subject + number range as pedo -- the content generator
  // started splitting PEDO/ORTHO/PREV's MCQ batches into separate pedo/ and
  // ortho/ folders, but they're still one Subject (Gulf-180 groups
  // PEDO/ORTHO/PREV together, offset 145).
  ortho: { subject: 'Orthodontics and Pediatric Dentistry', offset: 145 },
  radio: { subject: 'Radiology, Ethics and Law', offset: 165 },
};

/**
 * Label -> canonical Subject, for batches that don't live in a single-
 * subject PREFIX_CONFIG folder and so must be grouped by each question's own
 * `subjectName` (importMcqBatches.ts's fallback path) -- e.g. a mixed folder
 * like `mcq-batches/operpros/` whose files interleave both "Operative +
 * Cariology" and "Prosthodontics + RPD/CD" questions in the same file.
 * Without this, that fallback path would create two more splinter Subjects
 * instead of merging into the real "Operative Dentistry" / "Prosthodontics".
 * Keys are matched exactly as the content generator has written them so far
 * -- add an entry here the first time a new off-label variant shows up.
 */
export const SUBJECT_LABEL_ALIASES: Record<string, string> = {
  'Operative + Cariology': 'Operative Dentistry',
  'Prosthodontics + RPD/CD': 'Prosthodontics',
  'Oral Surgery + LA': 'Oral and Maxillofacial Surgery',
  'Pharmacology + Emergencies': 'Pharmacology',
  'Pedo + Ortho + Prevention': 'Orthodontics and Pediatric Dentistry',
  'Oral Pathology + Medicine': 'Oral Pathology and Medicine',
  'Radiology + Ethics + Recalls': 'Radiology, Ethics and Law',
};
