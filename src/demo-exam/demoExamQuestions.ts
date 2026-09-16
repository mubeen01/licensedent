// ⚠️ SAMPLE exam content for the public, front-end-only /demo-exam page.
// Same brand promise as everywhere else — "dentist-verified answers" — so
// have a dentist reviewer confirm every correctKey/explanation pair here
// before this is treated as launch-ready. These are standard, well-established
// board-exam-style facts, not pulled from your real (currently unpublished)
// DHA question bank — swap in real verified DHA questions once you have a
// reviewed batch ready to use for marketing.

export interface DemoExamQuestion {
  subject: string;
  stem: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
}

export const demoExamQuestions: DemoExamQuestion[] = [
  {
    subject: 'Endodontics',
    stem: 'Which instrument is primarily used to electronically determine the working length of a root canal?',
    options: [
      { key: 'A', text: 'Gates Glidden drill' },
      { key: 'B', text: 'Apex locator' },
      { key: 'C', text: 'Paper point' },
      { key: 'D', text: 'K-file' },
    ],
    correctKey: 'B',
    explanation:
      'Electronic apex locators measure impedance to locate the apical constriction, giving a more reliable working length than a radiograph alone.',
  },
  {
    subject: 'Endodontics',
    stem: 'What is the most common cause of failure of a previously completed root canal treatment?',
    options: [
      { key: 'A', text: 'Overfilling' },
      { key: 'B', text: 'A missed or untreated canal' },
      { key: 'C', text: 'Instrument fracture' },
      { key: 'D', text: 'Underfilling' },
    ],
    correctKey: 'B',
    explanation:
      'A missed or untreated canal leaves a reservoir for persistent infection and is the most common cause of endodontic failure.',
  },
  {
    subject: 'Periodontics',
    stem: 'What is the earliest clinical sign of gingivitis?',
    options: [
      { key: 'A', text: 'Pocket formation' },
      { key: 'B', text: 'Bleeding on probing' },
      { key: 'C', text: 'Attachment loss' },
      { key: 'D', text: 'Tooth mobility' },
    ],
    correctKey: 'B',
    explanation:
      'Bleeding on probing is the earliest clinical sign of gingival inflammation, appearing before attachment loss or pocket formation.',
  },
  {
    subject: 'Periodontics',
    stem: 'Which bacterium is most strongly associated with localized aggressive periodontitis in adolescents?',
    options: [
      { key: 'A', text: 'Porphyromonas gingivalis' },
      { key: 'B', text: 'Aggregatibacter actinomycetemcomitans' },
      { key: 'C', text: 'Streptococcus mutans' },
      { key: 'D', text: 'Fusobacterium nucleatum' },
    ],
    correctKey: 'B',
    explanation:
      'Aggregatibacter actinomycetemcomitans is classically and most strongly associated with localized aggressive periodontitis in adolescents.',
  },
  {
    subject: 'Prosthodontics',
    stem: 'Which classification system describes the location of edentulous spaces in a partially edentulous arch for removable partial denture design?',
    options: [
      { key: 'A', text: "Angle's classification" },
      { key: 'B', text: "Kennedy's classification" },
      { key: 'C', text: "Black's classification" },
      { key: 'D', text: "Ante's law" },
    ],
    correctKey: 'B',
    explanation:
      "Kennedy's classification (Class I-IV) categorizes partially edentulous arches by the location of edentulous areas relative to remaining teeth, guiding RPD design.",
  },
  {
    subject: 'Prosthodontics',
    stem: "Ante's Law relates to which aspect of fixed prosthodontic treatment planning?",
    options: [
      { key: 'A', text: 'Occlusal vertical dimension' },
      { key: 'B', text: 'Root surface area of abutment teeth vs. the teeth being replaced' },
      { key: 'C', text: 'Pontic design' },
      { key: 'D', text: 'Retainer material selection' },
    ],
    correctKey: 'B',
    explanation:
      "Ante's Law states the combined periodontal root surface area of abutment teeth should equal or exceed that of the teeth being replaced by the fixed partial denture.",
  },
  {
    subject: 'Conservative & Operative',
    stem: 'Which material is traditionally considered the material of choice for pulp capping due to its ability to induce reparative dentin formation?',
    options: [
      { key: 'A', text: 'Zinc oxide eugenol' },
      { key: 'B', text: 'Calcium hydroxide' },
      { key: 'C', text: 'Glass ionomer cement' },
      { key: 'D', text: 'Composite resin' },
    ],
    correctKey: 'B',
    explanation:
      "Calcium hydroxide's high pH stimulates odontoblastic activity and reparative dentin formation, making it the traditional pulp-capping material of choice.",
  },
  {
    subject: 'Oral & Maxillofacial Surgery',
    stem: 'The condylar region is generally cited as which of the following for mandibular fractures?',
    options: [
      { key: 'A', text: 'The most common fracture site' },
      { key: 'B', text: 'The least common fracture site' },
      { key: 'C', text: 'A site that never fractures' },
      { key: 'D', text: 'Only fractured in edentulous patients' },
    ],
    correctKey: 'A',
    explanation:
      'The condyle is the most common site of mandibular fracture, as it tends to absorb indirect trauma transmitted from the chin or body region.',
  },
  {
    subject: 'Orthodontics',
    stem: 'Bodily (translation) tooth movement occurs when force is applied through which point?',
    options: [
      { key: 'A', text: 'The center of rotation' },
      { key: 'B', text: 'The center of resistance' },
      { key: 'C', text: 'The apex only' },
      { key: 'D', text: 'The incisal edge only' },
    ],
    correctKey: 'B',
    explanation:
      'When force passes through the center of resistance, the crown and root move equally in the same direction — bodily movement — rather than tipping around a center of rotation.',
  },
  {
    subject: 'Orthodontics',
    stem: "In Angle's Class II malocclusion, the mesiobuccal cusp of the maxillary first molar occludes:",
    options: [
      { key: 'A', text: 'In the mesiobuccal groove of the mandibular first molar' },
      { key: 'B', text: 'Mesial to the mesiobuccal groove of the mandibular first molar' },
      { key: 'C', text: 'Distal to the mesiobuccal groove of the mandibular first molar' },
      { key: 'D', text: 'In the distal fossa of the mandibular second molar' },
    ],
    correctKey: 'B',
    explanation:
      "In Class II (distocclusion), the mandibular molar sits distally relative to the maxilla, so the maxillary mesiobuccal cusp occludes mesial to the mandibular molar's mesiobuccal groove — unlike the normal Class I relationship.",
  },
  {
    subject: 'Pedodontics',
    stem: 'Primary (deciduous) second molars are typically exfoliated and replaced by permanent premolars at approximately what age?',
    options: [
      { key: 'A', text: '6-7 years' },
      { key: 'B', text: '8-9 years' },
      { key: 'C', text: '10-12 years' },
      { key: 'D', text: '13-14 years' },
    ],
    correctKey: 'C',
    explanation:
      'Primary second molars are usually the last primary teeth to exfoliate, typically between 10-12 years, replaced by the second premolars.',
  },
  {
    subject: 'Dental Materials',
    stem: "Which property describes a material's ability to return to its original shape after a deforming force is removed, within its elastic limit?",
    options: [
      { key: 'A', text: 'Plasticity' },
      { key: 'B', text: 'Elasticity' },
      { key: 'C', text: 'Ductility' },
      { key: 'D', text: 'Malleability' },
    ],
    correctKey: 'B',
    explanation:
      'Elasticity allows a material to return to its original dimensions after a load is removed, provided the elastic limit (yield point) is not exceeded.',
  },
  {
    subject: 'Dental Materials',
    stem: 'Which ion release from glass ionomer cement is credited with giving it a cariostatic effect at the tooth-restoration interface?',
    options: [
      { key: 'A', text: 'Calcium release' },
      { key: 'B', text: 'Fluoride release' },
      { key: 'C', text: 'Aluminum release' },
      { key: 'D', text: 'Silica release' },
    ],
    correctKey: 'B',
    explanation:
      'Glass ionomer cements release fluoride over time, taken up by adjacent tooth structure, giving them a cariostatic effect useful in caries-risk patients.',
  },
  {
    subject: 'Oral Anatomy & Histology',
    stem: 'Which cranial nerve provides the primary sensory innervation to the teeth and most of the oral cavity?',
    options: [
      { key: 'A', text: 'Facial nerve (CN VII)' },
      { key: 'B', text: 'Trigeminal nerve (CN V)' },
      { key: 'C', text: 'Glossopharyngeal nerve (CN IX)' },
      { key: 'D', text: 'Hypoglossal nerve (CN XII)' },
    ],
    correctKey: 'B',
    explanation:
      'The trigeminal nerve (CN V), via its maxillary (V2) and mandibular (V3) divisions, provides the primary sensory innervation to the teeth, periodontium, and most oral mucosa.',
  },
  {
    subject: 'Community Dentistry',
    stem: 'Which index is the standard epidemiological measure for caries experience in a population?',
    options: [
      { key: 'A', text: 'Gingival Index (GI)' },
      { key: 'B', text: 'DMFT Index' },
      { key: 'C', text: 'Plaque Index (PI)' },
      { key: 'D', text: 'Community Periodontal Index (CPI)' },
    ],
    correctKey: 'B',
    explanation:
      'The DMFT (Decayed, Missing, Filled Teeth) index is the standard measure of caries experience in permanent dentition across populations.',
  },
  {
    subject: 'Community Dentistry',
    stem: 'The historically recommended optimal fluoride concentration in community drinking water for caries prevention is approximately:',
    options: [
      { key: 'A', text: '0.1-0.3 ppm' },
      { key: 'B', text: '0.7-1.2 ppm' },
      { key: 'C', text: '2.0-3.0 ppm' },
      { key: 'D', text: '5.0 ppm' },
    ],
    correctKey: 'B',
    explanation:
      'Roughly 0.7-1.2 ppm has historically been recommended for community water fluoridation, balancing caries prevention against fluorosis risk.',
  },
  {
    subject: 'Pharmacology',
    stem: "Aspirin's analgesic and antiplatelet effects are primarily due to inhibition of which enzyme?",
    options: [
      { key: 'A', text: 'Cyclooxygenase (COX)' },
      { key: 'B', text: 'Lipoxygenase' },
      { key: 'C', text: 'Phospholipase A2' },
      { key: 'D', text: 'Thromboxane synthase' },
    ],
    correctKey: 'A',
    explanation:
      'Aspirin irreversibly inhibits cyclooxygenase (COX-1 and COX-2), blocking prostaglandin and thromboxane A2 synthesis — producing its analgesic, anti-inflammatory, and antiplatelet effects.',
  },
  {
    subject: 'Local Anaesthesia',
    stem: 'Which nerve block anesthetizes the inferior alveolar and lingual nerves in a single injection, commonly used for mandibular posterior teeth?',
    options: [
      { key: 'A', text: 'Posterior superior alveolar nerve block' },
      { key: 'B', text: 'Inferior alveolar nerve block (IANB)' },
      { key: 'C', text: 'Mental nerve block' },
      { key: 'D', text: 'Long buccal nerve block' },
    ],
    correctKey: 'B',
    explanation:
      'The inferior alveolar nerve block anesthetizes the inferior alveolar nerve and the adjacent lingual nerve, and typically the mylohyoid nerve as well.',
  },
  {
    subject: 'Oral Pathology',
    stem: 'A radiolucent lesion at the mandibular angle, associated with an impacted third molar, lined by odontogenic epithelium, with a notably high recurrence rate, is most likely:',
    options: [
      { key: 'A', text: 'Dentigerous cyst' },
      { key: 'B', text: 'Odontogenic keratocyst (OKC)' },
      { key: 'C', text: 'Radicular cyst' },
      { key: 'D', text: 'Simple bone cyst' },
    ],
    correctKey: 'B',
    explanation:
      'Odontogenic keratocysts characteristically occur at the mandibular angle/ramus near impacted third molars and have a high recurrence rate due to their thin, friable lining and daughter cysts.',
  },
  {
    subject: 'Oral Medicine & Radiology',
    stem: 'Which imaging technique gives the best three-dimensional visualization of the TMJ and surrounding bony structures?',
    options: [
      { key: 'A', text: 'Panoramic radiograph' },
      { key: 'B', text: 'Cone Beam CT (CBCT)' },
      { key: 'C', text: 'Periapical radiograph' },
      { key: 'D', text: 'Bitewing radiograph' },
    ],
    correctKey: 'B',
    explanation:
      'CBCT provides high-resolution, three-dimensional imaging of bony structures including the TMJ, condyle, and glenoid fossa — superior to 2D radiographs for this purpose.',
  },
];
