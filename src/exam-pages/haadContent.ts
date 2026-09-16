/**
 * Content for the HAAD (DOH) exam guide page.
 *
 * Updated 2026-08-04 after web research corrected a real error: DOH has
 * delivered this exam via Pearson VUE since 2023, not Prometric -- the
 * earlier draft had it wrong, describing it as "Prometric-style" like DHA.
 * Application booking runs through Abu Dhabi's TAMM portal. There's no
 * single DOH-published policy PDF the way there is for DHA, but the
 * 150-question format, Pearson VUE delivery and DataFlow requirement are
 * corroborated across multiple independent sources. The 5-subject blueprint
 * and weighted-pass rule below (60% aggregate AND 60%+ in at least one of
 * Restorative/Oral Medicine & Surgery/Periodontics) come from two
 * independently-agreeing secondary sources, not a DOH primary document --
 * flagged as such rather than presented with DHA-level certainty.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const haadExamGuide: ExamGuideConfig = {
  accent: 'teal',
  backLinkLabel: 'All Gulf exams',

  seo: {
    title: 'HAAD (DOH) Exam Guide — Abu Dhabi Dental Licensing | LicenseDent',
    description:
      'How the Abu Dhabi dental licensing exam (still called HAAD, now run by DOH) actually works — PQR, DataFlow, shared-attempt rules with DHA and MOH, plus free practice.',
    path: '/exams/haad',
  },

  badgeFlagEmoji: '🇦🇪',
  badgeLabel: 'HAAD · Abu Dhabi (now DOH)',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'HAAD (DOH) licensing exam',
  heroDescription:
    "Everyone still calls it the HAAD exam. Since 2018 it's actually run by the Department of Health – Abu Dhabi (DOH), on the same national PQR, DataFlow and shared-attempt framework as DHA and MOH. Here's what carried over from HAAD, what's DOH's own, and how to prepare.",

  quickFacts: [
    { label: 'Regulator', value: "Department of Health – Abu Dhabi (DOH), HAAD's successor since 2018" },
    { label: 'Delivery', value: 'Computer-based test via Pearson VUE — not Prometric — since 2023' },
    { label: 'Format', value: '150 questions, booked through the TAMM portal' },
    { label: 'Attempts', value: '3 per specialty, pooled across MOH, HAAD/DOH and DHA' },
  ],

  statSectionEyebrow: "What's actually different from DHA",
  statSectionTitle: 'The HAAD-to-DOH facts worth knowing',
  statSectionDescription: "The exam's nickname hasn't caught up with the paperwork — here's what changed and what didn't.",
  statCards: [
    {
      value: '2018',
      label: 'HAAD became DOH',
      description:
        "The year Abu Dhabi's licensing function moved from HAAD to the Department of Health — the exam is still called \"the HAAD exam\" by almost everyone, candidates and agents included.",
    },
    {
      value: '2023',
      label: 'Switched to Pearson VUE',
      description: "DOH moved delivery from Prometric to Pearson VUE — booking now runs through Abu Dhabi's TAMM portal, a different vendor and login from DHA's Prometric system.",
    },
    {
      value: '3',
      label: 'Attempts, total',
      description: 'Same national pool as DHA and MOH — a fail at one authority counts against all three for that specialty.',
    },
    {
      value: 'Abu Dhabi',
      label: 'Jurisdiction',
      description: 'A DOH license lets you practice within the emirate of Abu Dhabi specifically — not federally, and not in Dubai.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From PQR to an Abu Dhabi license',
  roadmapDescription: 'The same seven-stage framework as DHA, run through DOH instead — same verification chain, different door.',
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Confirm you meet the PQR',
      description:
        "DOH sets its own version of the Professional Qualification Requirements for the General Dentist title — closely mirrors DHA's, but check the current version on DOH's own portal rather than assuming it's identical.",
    },
    {
      icon: 'shield',
      title: 'DataFlow Primary Source Verification',
      description:
        'DataFlow verifies your degree, licence, experience letters and good-standing certificate against DOH\'s requirements — the same nationally standardized PSV process used for DHA and MOH applications.',
    },
    {
      icon: 'filecheck',
      title: 'DOH credentials your file',
      description:
        "Abu Dhabi's own licensing team reviews your verified documents against the PQR for your title. As with DHA, an incomplete file here is the most common source of delay.",
    },
    {
      icon: 'key',
      title: 'Your eligibility to book activates',
      description:
        "Once DOH clears your file, you're able to book a CBT slot. The exact activation and booking-window timelines are set by DOH and can differ from DHA's — confirm the current numbers on your DOH portal rather than assuming they match.",
    },
    {
      icon: 'calendar',
      title: 'Book through TAMM and Pearson VUE',
      description:
        "Applications go through Abu Dhabi's TAMM portal; once approved, booking your test slot runs through Pearson VUE — a completely different vendor from DHA's Prometric system, not just a different login.",
    },
    {
      icon: 'monitor',
      title: 'Sit the exam',
      description:
        '150 single-best-answer questions, English-only, no translators — delivered by Pearson VUE rather than Prometric. Bring the passport you registered with, or an original Emirates ID at UAE centres.',
    },
    {
      icon: 'trophy',
      title: 'Get your result',
      description:
        'Pass or fail is posted to the online system. A pass moves you into Abu Dhabi licensing/employment; a fail returns you to the same shared attempt pool you\'d be drawing from at DHA or MOH for that specialty.',
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: "Rules every HAAD/DOH candidate should know",
  rulesDescription: "What's shared nationally, and what's specific to Abu Dhabi's own system.",
  ruleCards: [
    {
      icon: 'building',
      title: "HAAD is gone, DOH is what's real",
      description:
        'Your license, correspondence and portal login all say DOH now. "HAAD exam" survives purely as shorthand — like people still saying "landline" — but don\'t go looking for a HAAD website when you actually need to book something.',
    },
    {
      icon: 'users',
      title: 'Attempts are pooled nationally',
      description:
        'The same three-attempts-per-specialty rule applies across DHA, DOH and MOH. An attempt used at DHA for General Dentist counts against your DOH total for the same title.',
    },
    {
      icon: 'recognition',
      title: 'A DHA or MOH pass can exempt you here',
      description:
        "If you hold a valid (or recently lapsed) DHA or MOH license, meet DOH's PQR, and can produce a good-standing letter, you may be exempted from re-sitting the DOH assessment for the same or a lower title — check DOH's recognition criteria before you pay for a booking you don't need.",
    },
    {
      icon: 'globe',
      title: 'Abu Dhabi only, not federal',
      description:
        "Unlike an MOH license, a DOH license authorizes you specifically within Abu Dhabi's licensed facilities — it doesn't automatically extend to Dubai or the Northern Emirates.",
    },
    {
      icon: 'eyeoff',
      title: '60% overall isn\'t automatically a pass',
      description:
        "Independent sources agree DOH applies a weighted rule: you need 60%+ overall AND 60%+ in at least one of three subjects — Restorative Dentistry, Oral Medicine & Surgery, or Periodontics. A strong overall score with all three of those under 60% can still fail.",
    },
    {
      icon: 'rotate',
      title: "It's Pearson VUE, not Prometric",
      description:
        "Since 2023, DOH exams run through Pearson VUE, a completely different testing vendor from DHA and MOH's Prometric network. Your DHA Prometric login won't work here, and Pearson VUE sets its own reschedule and cutoff rules — confirm them directly rather than assuming DHA's apply.",
    },
  ],

  subjectsEyebrow: "What DOH's exam actually weighs",
  subjectsTitle: 'The 5-subject blueprint, and a pass rule worth knowing',
  subjectsDescription:
    "DOH doesn't publish a line-item guideline the way DHA does, but independent sources agree on 5 core subjects — and on a pass rule that trips people up: you need 60%+ overall AND 60%+ in at least one of Restorative Dentistry, Oral Medicine & Surgery, or Periodontics.",
  examSubjects: [
    { name: 'Restorative Dentistry (Prosthodontics & Operative)' },
    { name: 'Oral Medicine & Surgery' },
    { name: 'Periodontics' },
    { name: 'Orthodontics & Paediatric Dentistry' },
    { name: 'Endodontics' },
  ],

  sampleQuestion: {
    subject: 'Prosthodontics',
    stem:
      'A patient presents for a complete denture with severely resorbed mandibular ridges. The impressions are accurate and the occlusal vertical dimension is correct, but the patient still complains of poor denture retention. What is the most likely primary cause?',
    options: [
      { key: 'A', text: 'Inadequate peripheral seal due to the flat, resorbed ridge' },
      { key: 'B', text: 'Excessive interocclusal freeway space' },
      { key: 'C', text: 'Incorrect shade selection for the denture teeth' },
      { key: 'D', text: 'Overextension of the denture borders' },
    ],
    correctKey: 'A',
    explanation:
      'Denture retention depends heavily on a good peripheral (border) seal, which creates the interfacial surface tension and slight negative pressure that holds a denture in place. Severely resorbed ridges shrink the denture-bearing area and make that seal much harder to achieve, even with an otherwise accurate impression and correct OVD. Excessive freeway space mainly affects speech and muscle fatigue, shade selection is purely esthetic, and border overextension causes soreness or displacement rather than a retention problem on its own.',
  },

  faqEyebrow: 'HAAD/DOH FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: 'Answered against the current structure, not the old HAAD-era assumptions.',
  faqs: [
    {
      id: 1,
      question: "Is it 'HAAD' or 'DOH'? Which one do I actually apply to?",
      answer:
        "You apply to DOH — the Department of Health – Abu Dhabi, which absorbed HAAD's licensing function in 2018. \"HAAD exam\" is just the name that stuck. Your license, portal and any official correspondence will reference DOH.",
    },
    {
      id: 2,
      question: 'Do my DHA attempts count against my HAAD/DOH attempts?',
      answer:
        "Yes. The three-attempts-per-specialty limit is a shared pool across DHA, DOH and MOH — sitting and failing the same specialty at one authority uses up an attempt at all three, not just the one you sat.",
    },
    {
      id: 3,
      question: 'Can I use my DHA or MOH pass to skip the DOH exam?',
      answer:
        "Possibly, through Licensure Recognition — if you hold a valid or recently lapsed DHA/MOH license, meet DOH's PQR, and have a good-standing letter, you may be exempted from sitting DOH's assessment for the same or a lower title. Confirm the current criteria on DOH's portal before assuming it applies to your case.",
    },
    {
      id: 4,
      question: 'Does DOH use Prometric like DHA does?',
      answer:
        "No — since 2023, DOH has delivered this exam through Pearson VUE, not Prometric. Applications still go through Abu Dhabi's TAMM portal, but expect a genuinely different testing vendor, interface and set of reschedule rules once you're booking, not just a different portal skin.",
    },
    {
      id: 5,
      question: 'Is the DOH (HAAD) exam harder than DHA?',
      answer:
        "There's no official difficulty ranking, and both draw on the same core dental curriculum. Candidates commonly report the recall pattern — which exact concepts repeat — differs a bit between authorities, which is more about question-bank overlap than one exam being objectively harder.",
    },
    {
      id: 6,
      question: 'What does a DOH license actually let me do?',
      answer:
        "It authorizes you to practice within Abu Dhabi's licensed healthcare facilities specifically. It doesn't automatically extend to Dubai (DHA) or the Northern Emirates (MOH) — each is its own license, even under the shared national framework.",
    },
    {
      id: 7,
      question: 'Is a 60% overall score enough to pass?',
      answer:
        "Not necessarily. Independent sources describe a weighted pass rule: 60%+ overall AND 60%+ in at least one of three subjects — Restorative Dentistry, Oral Medicine & Surgery, or Periodontics. A weak showing across all three of those can fail you even with a solid overall score.",
    },
  ],

  closingTitle: 'Ready to start on the HAAD (DOH) blueprint?',
  closingDescription:
    'Subject-wise practice across the full General Dentist curriculum, with a recall bank and timed CBT-style mocks built for how DOH actually tests it — every answer verified by a dentist.',
};
