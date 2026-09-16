export interface VideoLecture {
  id: string;
  subject: string;
  title: string;
  durationMinutes: number;
  /** Unlisted/private YouTube video id (the part after "v=" or in the /embed/ URL). null = not uploaded yet. */
  youtubeId: string | null;
  description: string;
}

/* -------------------------------------------------------------------------- */
/*  VIDEO LECTURES  (Extended-plan perk)                                        */
/*  ⚠️ PLACEHOLDER — youtubeId is null for every entry below. Replace with the  */
/*  real unlisted/private YouTube video ids as each lecture is recorded and     */
/*  uploaded. The "100+ hours" marketing claim was removed (2026-08-18): we     */
/*  advertise the library, not invented hours.                                  */
/* -------------------------------------------------------------------------- */
export const videoLectures: VideoLecture[] = [
  {
    id: 'oral-path-01',
    subject: 'Oral Pathology',
    title: 'Odontogenic cysts — radicular, dentigerous & OKC',
    durationMinutes: 42,
    youtubeId: null,
    description: 'Radiographic and histologic features that distinguish the high-yield odontogenic cysts.',
  },
  {
    id: 'endo-01',
    subject: 'Endodontics',
    title: 'Working length determination & apex locators',
    durationMinutes: 35,
    youtubeId: null,
    description: 'Radiographic vs electronic apex locator methods, and the pitfalls examiners test.',
  },
  {
    id: 'perio-01',
    subject: 'Periodontics',
    title: 'Periodontal disease classification (2017 workshop)',
    durationMinutes: 50,
    youtubeId: null,
    description: 'Staging and grading walked through with the case-based questions the exam favours.',
  },
  {
    id: 'pharm-01',
    subject: 'Pharmacology',
    title: 'Local anesthetics — metabolism & contraindications',
    durationMinutes: 38,
    youtubeId: null,
    description: 'Ester vs amide metabolism, max doses and the contraindication scenarios that repeat.',
  },
  {
    id: 'prostho-01',
    subject: 'Prosthodontics',
    title: 'Complete denture occlusion schemes',
    durationMinutes: 44,
    youtubeId: null,
    description: 'Balanced, lingualized and monoplane occlusion — when each is indicated.',
  },
  {
    id: 'oms-01',
    subject: 'Oral & Maxillofacial Surgery',
    title: 'Third molar impaction classification & complications',
    durationMinutes: 40,
    youtubeId: null,
    description: 'Winter’s and Pell & Gregory classifications plus the complications the exam asks about.',
  },
];
