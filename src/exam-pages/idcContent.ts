/**
 * Content for the IDC Ireland exam guide page — EXPANDED 2026-09-16.
 *
 * Sources: Dental Council of Ireland Examination Details (s.27(2)(d), Part 1 Mar/Apr + Part 2 Jun/Jul,
 * random-selection, 3-month lead), Dental Council Exams news 2024-01-17 (written 23-24 Mar + bench 27-28 Mar,
 * +40 places), Dentists registration + Fees pages, Oireachtas 2025-04-29 (11 places 2018 → 60+ 2025,
 * advantage to Ireland-established), IDA Workforce Plan (500+ dentists needed), HSE crisis data.
 * Where Council doesn't publish (2027 exact dates/fees) this says so.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const idcExamGuide: ExamGuideConfig = {
  accent: 'emerald',
  questionFormat: 'saq',
  backLinkLabel: 'All exams',

  seo: {
    title: 'IDC Ireland Exam Guide — Dental Council Statutory Exam | LicenseDent',
    description:
      "Guide to Ireland's Dental Council statutory exam for BDS graduates: Part 1 SAQ + bench, Part 2 OSCE, the January lottery, fees, and a 6-month prep plan.",
    path: '/exams/idc-ireland',
  },

  badgeFlagEmoji: '🇮🇪',
  badgeLabel: 'IDC · Dental Council of Ireland · s.27(2)(d)',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'IDC Ireland licensing exam',
  heroDescription:
    "Everything a non-EEA dental graduate needs for Ireland's Dental Council statutory examination — once-a-year Part 1 (SAQ written + phantom-head bench) and Part 2 (written + OSCE + vivas), the January application window with random-selection lottery for a limited number of seats, BDS-level eligibility (no MDS required), staged fees around €800, what the bench and OSCE actually mark, and the route family can join you on once you're registered and working.",

  quickFacts: [
    { label: 'Frequency', value: 'Once a year in Ireland — Part 1 Mar/Apr (e.g. written 23-24 Mar + bench 27-28 Mar 2024), Part 2 Jun/Jul' },
    { label: 'Route', value: 's.27(2)(d) Dentists Act 1985 — non-EEA exam with Irish dental schools, final-year Irish standard' },
    { label: 'Seats', value: 'Lottery — 11 (2018) → +40 (2024) → 60+ (2025). Random selection from short Jan window, no queue advantage' },
    { label: 'Eligibility', value: 'BDS degree + transcripts + internship + good standing certificate. MDS NOT required. Allow 3 months for paperwork' },
  ],

  statSectionEyebrow: "Straight from the Dental Council",
  statSectionTitle: 'Part 1 + Part 2, exactly as the Council runs it',
  statSectionDescription: '2024 cycle + 2025 capacity + live Examination Details — no forum guesses. 2027 exact dates publish in winter.',
  statCards: [
    {
      value: '3 + bench',
      label: 'Part 1: SAQ + practical',
      description: '3 SAQ papers — Restorative, Surgery/Medicine, Child Health — over 2 days, plus 2-day bench: Class II, crown prep, endo access + dam. Must pass to enter Part 2.',
    },
    {
      value: '3-way',
      label: 'Part 2: no compensation',
      description: 'Written + OSCE circuit + clinical vivas. Each must be passed individually. Ace OSCE but fail viva = fail Part 2.',
    },
    {
      value: '~€800',
      label: 'Staged fees',
      description: '~€400 application in Jan + ~€400 exam only if lotteried. Miss lottery = lose ~€400 only. Plus ~€1200-1500 Dublin travel + bench course.',
    },
    {
      value: 'BDS ok',
      label: 'Final-year standard',
      description: 'Irish final-year level, not MDS. A solid BDS foundation is enough — bench discipline and fluency with Irish guidelines (NICE/IADT/FGDP) decide the pass.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'The 7-step route to registration',
  roadmapDescription: 'Documents first, lottery second, exam third. Start gathering paperwork in Oct/Nov — the January application window is only 2-3 weeks.',
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: '1. Lock down your documents (Oct-Nov)',
      description:
        'Degree certificate, detailed transcripts, internship completion certificate, and a good-standing certificate from your home dental council. Transcripts usually take longest to arrive — request them early. The Council needs about 3 months to finalise a file; an incomplete application is automatically out of the lottery.',
    },
    {
      icon: 'filecheck',
      title: '2. File in the January window',
      description:
        'A short application window opens each January on dentalcouncil.ie. Pay the application fee (~€400) and upload a complete file. Selection is by random draw, not first-come-first-served — filing early doesn\'t improve your odds, but a complete file matters.',
    },
    {
      icon: 'key',
      title: '3. Wait for the random-selection lottery (Feb)',
      description:
        'The Council allocates a limited number of places with the dental schools by random draw. If selected, you pay the exam fee and arrange your visa and travel. If not selected, you only lose the application fee — you can re-apply the following year with a head start on preparation.',
    },
    {
      icon: 'shield',
      title: '4. Prepare SAQ + bench (roughly 6 months out)',
      description:
        'SAQ practice: one timed written answer a day, working through history, test and radiograph justification, diagnosis, treatment plan, and prevention/referral/consent. Bench practice: Class II and crown preparation (taper 6-10°, ferrule 2mm, chamfer 0.5mm) and rubber dam placement under 5 minutes, building up to daily timed reps. OSCE scenarios are worth rehearsing out loud.',
    },
    {
      icon: 'monitor',
      title: '5. Sit Part 1 in Mar/Apr (Dublin)',
      description:
        'Two days of written papers plus two days of bench, held in person in Ireland. You arrange your own entry visa. Many candidates arrive 10-12 days early for a bench refresher course and to acclimatise. Infection control and PPE are marked throughout the bench component.',
    },
    {
      icon: 'calendar',
      title: '6. Sit Part 2 in Jun/Jul (if Part 1 passes)',
      description:
        "There's only around a 10-week gap between parts. Part 2 combines written cases, an OSCE circuit (OPG interpretation, perio charting, medical emergencies, consent, safeguarding) and clinical vivas testing why you'd choose a treatment and when you'd refer via the HSE pathway. Each component is marked — and must be passed — individually.",
    },
    {
      icon: 'trophy',
      title: '7. Register, find a role, and settle in',
      description:
        "Once you're on the Register of Dentists, private practices and the HSE are actively hiring. Most employers sponsor a Critical Skills Employment Permit, which also lets your spouse and children join you and allows your spouse to work.",
    },
  ],

  rulesEyebrow: 'Read this before you apply',
  rulesTitle: 'Lottery, fees, visa + BDS rules that matter',
  rulesDescription: 'The fine print that wastes years if missed — from live Council pages + Oireachtas.',
  ruleCards: [
    {
      icon: 'users',
      title: 'Seats are the bottleneck',
      description:
        'Capacity has grown steadily (11 places in 2018 to 60+ by 2025), but bench and OSCE examining is capacity-limited by chairs and examiners, so growth is gradual rather than open-ended. Treat the lottery as genuinely uncertain when planning your year.',
    },
    {
      icon: 'timerreset',
      title: 'Once a year — no second chance',
      description:
        'Part 1 Mar/Apr, Part 2 Jun/Jul. Miss January = wait to next March. 2027 exact dates publish in winter on Examination Details — plan late-Mar + late-Jun until then.',
    },
    {
      icon: 'eyeoff',
      title: 'Random selection, not merit queue',
      description:
        'Council states random selection allocates places — no advantage queuing or applying day 1. Complete file matters more than fast file.',
    },
    {
      icon: 'ban',
      title: 'Incomplete docs = rejected',
      description:
        'The Council aims to finalise a file within 3 months; delays from incomplete transcripts or good-standing certificates are the most common reason applications fall through. Start requesting documents in October so you can file a complete application in January.',
    },
    {
      icon: 'scale',
      title: 'Staged €800 — not all at risk',
      description:
        '~€400 application (Jan, non-refundable if lotteried out) + ~€400 exam (only if selected). Add Dublin flights + 12-day stay + bench course = ~€2000-2300 per sitting. Check Fees page before budgeting.',
    },
    {
      icon: 'globe',
      title: 'You arrange exam visa yourself',
      description:
        'Council: candidates needing visa/permit to enter Ireland for exam are solely responsible. Apply early for Mar travel — no Council invitation letter shortcut.',
    },
    {
      icon: 'building',
      title: 'BDS enough, MDS not needed',
      description:
        'Requirement is BDS + transcripts + internship + standing. Exam is final-year Irish standard: pulp tables, crown principles, NICE 3rds, Hall, emergencies — not MDS thesis.',
    },
    {
      icon: 'recognition',
      title: "Already living in Ireland? There's a 2-year clock",
      description:
        "Non-EU dentists who move to Ireland before applying must sit the exam within 2 years of arrival or risk losing eligibility for this pathway — factor that in if you're planning to relocate before your application.",
    },
    {
      icon: 'rotate',
      title: "A missed year isn't wasted preparation",
      description:
        'Miss the lottery and you can re-apply the following January with most of your prep already done. Fail Part 1 and you can re-sit the next March with your bench logs and SAQ practice intact.',
    },
  ],

  subjectsEyebrow: "Council's exam coverage",
  subjectsTitle: '10 domains → SAQ + bench + OSCE mapped',
  subjectsDescription:
    'Final-year Irish standard. LicenseDent maps each below to timed SAQs, bench drills and OSCE stations with NICE/IADT/FGDP + safety-net + HSE referral in every answer.',
  examSubjects: [
    { name: 'Restorative — caries, ICDAS, composites', weight: 'Part 1' },
    { name: 'Endo — pulp table, RCT + dam mandatory', weight: 'High-yield' },
    { name: 'Perio — BPE → Stage/Grade + smoking/diabetes', weight: 'High-yield' },
    { name: 'Crown vs onlay — ferrule, taper, margins', weight: 'Bench' },
    { name: 'Surgery — NICE 3rds + IAN/CBCT', weight: 'Part 1' },
    { name: 'Medicine — leukoplakia, ulcer >3wks → 2-wk referral', weight: 'OSCE' },
    { name: 'Emergencies — adrenaline 0.5mg, asthma, syncope', weight: 'OSCE' },
    { name: 'Child — Hall (no LA/removal), fluoride ppm, avulsion', weight: 'Part 1' },
    { name: 'Radiology — FGDP justification + ALARP', weight: 'Viva' },
    { name: 'OSCE + Viva — consent, GDPR, HSE referral', weight: 'Part 2' },
  ],

  sampleQuestion: {
    subject: 'Endodontics — IDC SAQ style',
    stem:
      'A 35-year-old presents with deep caries on 36, lingering cold pain 40 sec, tender percussion. PA shows widened PDL, no defined radiolucency. List history questions, tests + radiographic justification, diagnosis, options with chosen plan + steps, material, prevention + follow-up + referral.',
    options: [
      { key: 'A', text: 'Reversible pulpitis — indirect pulp cap (Biodentine) + review' },
      { key: 'B', text: 'Irreversible + symptomatic apical periodontitis — RCT + cuspal coverage (dam, WL, NaOCl+EDTA)' },
      { key: 'C', text: 'Necrosis + chronic abscess — extraction + implant discussion' },
      { key: 'D', text: 'Cracked tooth — crown without endo + occlusal guard' },
    ],
    correctKey: 'B',
    explanation:
      'History: duration, night pain, analgesics, medical/allergy. Tests: cold (lingering >30s), EPT, percussion, bite, PA + bitewing justified per FGDP/ALARP. Diagnosis: irreversible + symptomatic apical periodontitis. Plan: RCT + onlay/crown — LA, dam mandatory, access, WL (apex locator + PA), NaOCl + EDTA no extrusion, obturation, cuspal coverage, occlusion. No antibiotics (no spread) + safety-net + review. Refer via HSE if complex curvature beyond competence. Prevention: 1450ppm fluoride, interdental, diet, 3-6 mo recall.',
  },

  faqEyebrow: 'IDC FAQ',
  faqTitle: 'BDS, lottery, fees, family + prep — answered',
  faqDescription: 'Against live Council pages + 2025 capacity + HSE shortage — with Gulf backup logic.',
  faqs: [
    {
      id: 1,
      question: 'Is BDS enough, or MDS required?',
      answer:
        'BDS is enough. You need BDS degree + transcripts + internship + good standing. Standard is Irish final-year, not MDS. Your DHA-cleared temperament + bench discipline + NICE/IADT/FGDP guidelines decide pass, not extra degree.',
    },
    {
      id: 2,
      question: 'When is 2027 exam? Give me dates.',
      answer:
        'Exact 2027 dates are NOT published yet — Council posts them in winter on Examination Details. Plan: Jan application window (2-3 wks) → Feb lottery → Part 1 late Mar/early Apr (2024 was written 23-24 Mar + bench 27-28 Mar) → Part 2 late Jun/early Jul.',
    },
    {
      id: 3,
      question: 'What are total fees? Is €800 wasted if no lottery?',
      answer:
        '~€400 application (Jan) + ~€400 exam (only if lotteried). Miss lottery = lose ~€400 only, no travel. Selected = + flights + 12-day Dublin stay + bench course = ~€2000-2300 total. Verify on Fees page before paying.',
    },
    {
      id: 4,
      question: 'How does lottery work? Can I improve odds?',
      answer:
        'Random selection from complete Jan files for ~60 places — queuing gives zero advantage. Only lever is complete file (3-mo lead) + Ireland-established advantage. No merit weight. Keep DHA fixed-salary backup so a miss year still earns.',
    },
    {
      id: 5,
      question: 'Part 1 vs Part 2 pattern in detail?',
      answer:
        'Part 1: 3 SAQ papers (Restorative, Surgery/Medicine, Child) over 2 days + 2-day bench (Class II, crown, endo access + dam <5 min, infection control throughout). Part 2: written cases + OSCE circuit (OPG, perio, emergency, consent, safeguarding) + vivas (WHY + WHEN to refer). No compensation in Part 2.',
    },
    {
      id: 6,
      question: 'Which books should I actually read?',
      answer:
        'Four cover most of the syllabus: the Oxford Handbook of Clinical Dentistry (the backbone), Pickard\'s Manual of Operative Dentistry (cavity and crown preparation), Harty\'s Endodontics in Clinical Practice (pulp diagnosis and RCT), and Scully\'s Oral and Maxillofacial Medicine plus Welbury\'s Paediatric Dentistry for the remaining domains. A focused daily block — reading, SAQ practice, bench or OSCE rehearsal, and flashcards for key numbers (doses, fluoride ppm, timings) — covers more ground than reading passively.',
    },
    {
      id: 7,
      question: 'The bench is the toughest part — how do I prepare from abroad?',
      answer:
        "Regular timed phantom-head sessions: Class II preparation (60 min), crown preparation (60 min, watching taper and avoiding adjacent tooth damage), and dam placement plus access (30 min). Photograph your preparations weekly to track progress. Most phantom-head/simulation labs used for other exam boards (e.g. ORE, DHA) work fine for building these reps, and arriving 10-12 days early for a Dublin bench refresher course closest to your exam date is worth the cost.",
    },
    {
      id: 8,
      question: 'OSCE + viva — what scores?',
      answer:
        'Verbalise everything: ID + consent + allergy + history → justified X-ray (FGDP/ALARP) → diagnosis → options + recommendation → steps → prevention + follow-up + red flags + records + HSE referral. Safe viva line: stabilise + safety-net + seek senior advice rather than guess beyond competence.',
    },
    {
      id: 9,
      question: 'Can my family move with me?',
      answer:
        "Once you're registered and working under a Critical Skills Employment Permit, yes — your spouse and children can join you, and your spouse is entitled to work. School-age children get access to free public education, and childcare is widely available in cities like Dublin and Cork (budget for it — it isn't cheap). Avoid the student-visa route for the exam itself if family reunification matters to you: it doesn't carry the same dependent rights as the Critical Skills permit.",
    },
    {
      id: 10,
      question: 'What job + salary after registration?',
      answer:
        'Private clinics/HSE hire readily — 500+ needed now, 65 HSE posts vacant, 11k on waiting lists. Entry €88k (1-3yr), average €127k gross + bonus. Employer files Critical Skills permit (~3 wks, €1000). Stamp 4 after 21 mo, citizenship after 5 yrs reckonable.',
    },
    {
      id: 11,
      question: 'Should I gain clinical experience elsewhere first?',
      answer:
        "It's common to keep practising — through a Gulf licensing exam (DHA, MOH, HAAD or similar) or clinical work at home — while your Ireland application is pending. That keeps your income and clinical skills current if the lottery doesn't select you in a given year, and Gulf licenses generally have their own multi-year validity windows worth tracking separately.",
    },
    {
      id: 12,
      question: 'Is LicenseDent affiliated with Dental Council?',
      answer:
        'No. Independent prep — not affiliated with, endorsed by, or acting for Dental Council of Ireland, DHA, MOH or any authority. We make original Irish-pattern Qs (never copied pages) with dentist-verified answers, NICE/IADT/FGDP refs and HSE pathways.',
    },
  ],

  closingTitle: 'Prepare the Irish way — SAQ + bench + OSCE together',
  closingDescription:
    '600-Q endo bank + Restorative/Surgery/Paedo tracks, bench checklists, 12-station OSCE bank, timed mocks — every answer dentist-verified with why-correct + why-distractor-wrong + guideline + safety-net. Start with Jan lottery docs, not just books.',
};
