import { accentPalettes } from './accentPalette';
import { dhaExamGuide } from './dhaContent';
import type { ExamGuideConfig } from './examGuideTypes';
import { haadExamGuide } from './haadContent';
import { idcExamGuide } from './idcContent';
import { kmleExamGuide } from './kmleContent';
import { mohExamGuide } from './mohContent';
import { nhraExamGuide } from './nhraContent';
import { omsbExamGuide } from './omsbContent';
import { qchpExamGuide } from './qchpContent';
import { shaExamGuide } from './shaContent';
import { smleExamGuide } from './smleContent';

/**
 * PRD-006 C3/M17: the single static source for "which exam guides exist and
 * what do they link to," shared by AllExamsPage's index grid and the
 * homepage's ExamsGrid widget. Both used to build their cards ENTIRELY from
 * `useQuery(getPublicExams)` -- a client-side DB call -- so neither page had
 * any real `<a href="/exams/<code>">` links in server HTML (confirmed: 0
 * occurrences on both, vs the individual guide pages, which prerender
 * fully). That made the site's 10 best content pages invisible to any
 * crawler that doesn't execute JavaScript (GPTBot, ClaudeBot,
 * PerplexityBot, CCBot, Bing's non-rendering pass).
 *
 * Building from each guide's own already-written content module (the same
 * source `/exams/<code>` itself renders from) instead means the links exist
 * unconditionally in server HTML on both pages. `getPublicExams` is still
 * queried by both callers, but only to attach a live "N questions" badge --
 * never to decide whether a card renders or links anywhere, since every
 * guide page is substantial, real content regardless of how many questions
 * that exam's practice bank currently has.
 *
 * `code` (not a pre-resolved route) is deliberately what each card carries
 * -- Wasp's typed `Link`'s `to` prop expects one of its own generated
 * literal route-string types, not a plain `string`, so any attempt to
 * carry a resolved `routes.XxxRoute.to` value through a `string`-typed
 * struct field gets silently widened to `string` and fails `tsc` (this
 * broke the production SDK build the first time this file was written --
 * caught by `wasp start`'s own compile step, not by Vite's dev transform,
 * which doesn't type-check). Callers resolve `code` to a route with the
 * existing `examGuideRoute()` helper right at the `<Link to=.../>` call
 * site instead, the same proven-working pattern the code this replaces
 * already used.
 */
export interface ExamGuideCard {
  code: string;
  flagEmoji: string;
  authorityLabel: string;
  description: string;
  gradient: string;
  quickChips: [string, string];
}

function guideCard(config: ExamGuideConfig): ExamGuideCard {
  const accent = accentPalettes[config.accent];
  const [code, authorityLabel] = config.badgeLabel.split(' · ');
  return {
    code,
    flagEmoji: config.badgeFlagEmoji,
    authorityLabel: authorityLabel ?? config.badgeLabel,
    description: config.seo.description,
    gradient: `${accent.gradientFrom} ${accent.gradientTo}`,
    quickChips: [config.quickFacts[0].value, config.quickFacts[1].value],
  };
}

export const EXAM_GUIDES: ExamGuideCard[] = [
  guideCard(dhaExamGuide),
  guideCard(haadExamGuide),
  guideCard(mohExamGuide),
  guideCard(smleExamGuide),
  guideCard(omsbExamGuide),
  guideCard(qchpExamGuide),
  guideCard(kmleExamGuide),
  guideCard(nhraExamGuide),
  guideCard(shaExamGuide),
  guideCard(idcExamGuide),
];
