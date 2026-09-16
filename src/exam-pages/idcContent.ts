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
  backLinkLabel: 'All exams',

  badgeFlagEmoji: '🇮🇪',
  badgeLabel: 'IDC · Dental Council of Ireland · s.27(2)(d)',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'IDC Ireland licensing exam',
  heroDescription:
    'Everything an Indian BDS graduate needs for the Dental Council statutory examination — once-a-year Part 1 (SAQ written + phantom-head bench) + Part 2 (written + OSCE + vivas), January window with random-selection lottery for ~60 seats, BDS-only eligibility, staged €800 fees, bench/OSCE marking secrets, 6-month prep plan with books, and the family-together Critical Skills route after registration. Built for BDS with a gap, 2 kids at home, DHA background.',

  quickFacts: [
    { label: 'Frequency', value: 'Once a year in Ireland — Part 1 Mar/Apr (e.g. written 23-24 Mar + bench 27-28 Mar 2024), Part 2 Jun/Jul' },
    { label: 'Route', value: 's.27(2)(d) Dentists Act 1985 — non-EEA exam with Irish dental schools, final-year Irish standard' },
    { label: 'Seats', value: 'Lottery — 11 (2018) → +40 (2024) → 60+ (2025). Random selection from short Jan window, no queue advantage' },
    { label: 'Eligibility', value: 'Indian BDS + transcripts + internship + good standing. MDS NOT required. Allow 3 months for paperwork' },
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
      description: 'Irish final-year level, not MDS. BDS + DHA-cleared temperament is enough — bench discipline + Irish guidelines (NICE/IADT/FGDP) decide pass.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: "7-step route for Indian BDS with family",
  roadmapDescription: 'Docs first, lottery second, exam third. Start Oct/Nov — Jan window is 2-3 weeks only.',
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: '1. Lock BDS documents (Oct-Nov)',
      description:
        'Degree + detailed transcripts + internship completion + good standing from DCI/state council. Transcripts take longest from Indian universities — apply now. Council needs 3 months to finalise; incomplete = auto-out of lottery. Keep DHA DataFlow + Sheryan renewal parallel (expires Mar 2027).',
    },
    {
      icon: 'filecheck',
      title: '2. File in January window',
      description:
        'Short Jan window on dentalcouncil.ie. Pay ~€400 application fee, upload complete file. 2024 was first-come-first-served from 26 Jan; 2025+ is random selection — queuing gives zero advantage. Watch FB prep group for opening hour.',
    },
    {
      icon: 'key',
      title: '3. Survive random-selection lottery (Feb)',
      description:
        'Council lotteries ~60 places with dental schools. Ireland-established get active advantage in practice. If selected → pay exam fee + book visa + flights. If not → lose ~€400 only, prep rolls to 2028 at 70% ready, switch to Gulf fixed-salary hunt.',
    },
    {
      icon: 'shield',
      title: '4. Prep SAQ + bench (Sep-Mar)',
      description:
        'SAQ: 1 timed answer/day (history → tests + X-ray justification → diagnosis → plan → prevention + referral + consent). Bench: Class II / crown (taper 6-10°, ferrule 2mm, chamfer 0.5mm) / dam <5 min, timed daily from month 3. OSCE scripts spoken aloud weekly from Nov.',
    },
    {
      icon: 'monitor',
      title: '5. Sit Part 1 in Mar/Apr (Dublin)',
      description:
        'Written 2 days + bench 2 days, physically in Ireland. You arrange entry visa yourself. Fly 10-12 days early for Dublin Dental Hospital 2-day bench update course (Lincoln Place) + HealthPath orientation. PPE + infection control marked throughout bench.',
    },
    {
      icon: 'calendar',
      title: '6. Sit Part 2 in Jun/Jul (if Part 1 pass)',
      description:
        'Only ~10 weeks gap. Written cases + OSCE stations (OPG, perio chart, emergency, consent, safeguarding) + vivas (WHY this material, WHEN to refer to HSE). Safe line that scores: stabilise + safety-net + refer per HSE pathway.',
    },
    {
      icon: 'trophy',
      title: '7. Register → job → family together',
      description:
        'Enter Register of Dentists → private/HSE offer (Ireland needs 500+ now) → employer Critical Skills permit (~3 wks) → spouse + 8yr + infant join together, spouse works full-time on Stamp 1G. Stamp 4 after 21 mo, citizenship after 5 yrs reckonable.',
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
        '11 (2018) → +40 new (2024) → 60+ (2025). Bench + OSCE need chairs + examiners, so expect 70-80 in 2027, not 200. Plan as 50/50 lottery, keep Gulf backup.',
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
        'Council aims to finalise in 3 months; delays from incomplete transcripts/good standing are common. Start Oct, file Jan. Transcripts + internship + standing take longest from India.',
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
      title: 'Already in Ireland? 2-year clock',
      description:
        'Non-EU dentists who move to Ireland first must apply within 2 years of arrival or risk losing the pathway — unrealistic with logistics/kids. From-India lottery avoids this trap.',
    },
    {
      icon: 'rotate',
      title: 'Fail or miss? Prep never wastes',
      description:
        'Miss lottery → re-apply next Jan at 70% ready. Fail Part 1 → re-sit next Mar with bench logs. Use gap year for Gulf fixed-salary (not commission-only) + Q-bank growth.',
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
      question: 'Which books? How to read with 2 kids?',
      answer:
        '4 only: Oxford Handbook (backbone, 70%), Pickard Operative (cavity/crown, 50%), Harty Endo (pulp/RCT, 40%), Scully lesions + Welbury paedo (50% each, library). Daily 2.5h: 40 read → 40 SAQ write → 40 bench/OSCE → 20 flashcards (doses, ppm, times, INR, BPE) → 10 error log. HealthPath Part 1 package filters what matters.',
    },
    {
      id: 7,
      question: 'Bench is toughest — how to pass from India?',
      answer:
        'Daily phantom-head timed: Class II 60 min, crown 60 min (taper 6-10°, chamfer 0.5mm, no adjacent damage), dam + access 30 min. Photo preps weekly. Fly 10-12 days early for Dublin Dental Hospital 2-day bench course — closest to marking. Any ORE/DHA phantom lab in Delhi/Chennai/Hyd works for daily reps (pay monthly).',
    },
    {
      id: 8,
      question: 'OSCE + viva — what scores?',
      answer:
        'Verbalise everything: ID + consent + allergy + history → justified X-ray (FGDP/ALARP) → diagnosis → options + recommendation → steps → prevention + follow-up + red flags + records + HSE referral. Safe viva line: stabilise + safety-net + seek senior advice rather than guess beyond competence.',
    },
    {
      id: 9,
      question: 'Can family move together? Kids + infant?',
      answer:
        'After registration + Critical Skills job, yes — spouse + 8yr + infant join immediately, spouse works full-time on Stamp 1G. 8yr gets free public school; infant childcare €1000-1400/mo in Dublin/Cork. Do NOT use student route — no dependents on initial Stamp 2, 14-20 mo separation.',
    },
    {
      id: 10,
      question: 'What job + salary after registration?',
      answer:
        'Private clinics/HSE hire readily — 500+ needed now, 65 HSE posts vacant, 11k on waiting lists. Entry €88k (1-3yr), average €127k gross + bonus. Employer files Critical Skills permit (~3 wks, €1000). Stamp 4 after 21 mo, citizenship after 5 yrs reckonable.',
    },
    {
      id: 11,
      question: 'Should I do Gulf first? DHA expires Mar 2027.',
      answer:
        'Renew DHA eligibility in Sheryan before Mar 2027 (DataFlow 6-12 wks) + close 4-yr gap with 2-3 days/wk chairside now. Take ONLY fixed + visa + family-visa Gulf offers (Sharjah/Ajman MOH better than Dubai commission-only). Use Gulf 1-2 yrs to fund Ireland retry if 2027 lottery misses — Gulf never gives citizenship.',
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
