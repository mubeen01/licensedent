import { ReactNode } from 'react';
import CTABanner from './components/CTABanner';
import ExamsGrid from './components/ExamsGrid';
import FAQ from './components/FAQ';
import FeaturesGrid from './components/FeaturesGrid';
import Footer from './components/Footer';
import Hero from './components/Hero';
import JourneyMap from './components/JourneyMap';
import PracticeModes from './components/PracticeModes';
import PricingTeaser from './components/PricingTeaser';
import ProcessSteps from './components/ProcessSteps';
import ProductWalkthrough from './components/ProductWalkthrough';
import ScrollToTop from './components/ScrollToTop';
import StatsBar from './components/StatsBar';
import StudyTools from './components/StudyTools';
import SubjectsStrip from './components/SubjectsStrip';
import TrustSection from './components/TrustSection';
import TryItDemo from './components/TryItDemo';
import Clients from './components/Clients';

import {
  buildStats,
  demoQuestions,
  faqs,
  features,
  footerNavigation,
  practiceModes,
  pricingTeaserPlans,
  studyTools,
  subjects,
} from './contentSections';
import { useBankStats } from '../client/hooks/useBankStats';

/**
 * A full-width tinted band that sits behind a section.
 * We use it on every other section so the page reads as a deliberate
 * light → lifted → light rhythm instead of one flat background.
 * It's theme-safe: `muted` and `border` are your design tokens, so it
 * looks right in both light and dark mode.
 */
function SectionBand({ children }: { children: ReactNode }) {
  return (
    <div className="border-y border-border/60 bg-muted/30 dark:bg-boxdark-2/40">
      {children}
    </div>
  );
}

export default function LandingPage() {
  // Live bank counters: every "N questions" claim on the page renders from
  // the real database (see useBankStats) so marketing can never out-run
  // content again. While loading, copy falls back to non-numeric claims.
  const { stats: bankStats } = useBankStats();
  return (
    <div className="bg-background text-foreground">
      <main className="isolate">
        {/* 1 · Hook — the signature moment (dark, cinematic) */}
        <Hero questionCount={bankStats?.publishedQuestionCount} examCount={bankStats?.examCount} />

        {/* Trust strip — where these licences let you practice */}
        <Clients />

        {/* NEW · Your path — a quick visual snapshot of sign-up to exam day,
            distinct from the detailed ProcessSteps section further down */}
        <JourneyMap />

        {/* 2 · Proof — product-strength numbers right under the hero */}
        <SectionBand>
          <StatsBar stats={buildStats(bankStats)} />
        </SectionBand>

        {/* 3 · Exams — the core offering: which licences we cover */}
        <ExamsGrid />

        {/* NEW · Subjects covered — shows depth of coverage */}
        <SectionBand>
          <SubjectsStrip subjects={subjects} />
        </SectionBand>

        {/* NEW · Try it yourself — a real, interactive question before signup */}
        <TryItDemo questions={demoQuestions} />

        {/* NEW · See it in action — a tour of the real app screens */}
        <SectionBand>
          <ProductWalkthrough />
        </SectionBand>

        {/* 4 · What you get — the bento feature overview */}
        <FeaturesGrid features={features} />

        {/* NEW · Everything you get, in detail — the tabbed study-tools section
            that goes head-to-head with the competitor */}
        <SectionBand>
          <StudyTools tools={studyTools} />
        </SectionBand>

        {/* NEW · Every way to slice the question bank — Practice's subject
            picker + Quiz Builder's filters + Mock Exams' timed mode, in one
            scannable strip */}
        <PracticeModes modes={practiceModes} />

        {/* 5 · How it works — a real 4-step sequence (numbering earns its place) */}
        <SectionBand>
          <ProcessSteps />
        </SectionBand>

        {/* 6 · Why trust us — the verification / integrity differentiator,
               placed right before pricing to justify the spend */}
        <TrustSection />

        {/* 7 · Pricing */}
        <SectionBand>
          <PricingTeaser plans={pricingTeaserPlans} />
        </SectionBand>

        {/* 8 · Objection handling */}
        <SectionBand>
          <FAQ faqs={faqs} />
        </SectionBand>

        {/* 9 · Final call — dark, bookends the hero. (Social-proof
            testimonial section removed: it contained placeholder names that
            implied real student outcomes. It returns once we have genuine,
            written, name-cleared reviews from the pilot cohort.) */}
        <CTABanner questionCount={bankStats?.publishedQuestionCount} examCount={bankStats?.examCount} />
      </main>

      <Footer footerNavigation={footerNavigation} />
      <ScrollToTop />
    </div>
  );
}