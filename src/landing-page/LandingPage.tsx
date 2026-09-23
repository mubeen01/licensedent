import { ReactNode } from 'react';
import CTABanner from './components/CTABanner';
import ExamsGrid from './components/ExamsGrid';
import FAQ from './components/FAQ';
import FeaturesGrid from './components/FeaturesGrid';
import Hero from './components/Hero';
import PricingTeaser from './components/PricingTeaser';
import ProcessSteps from './components/ProcessSteps';
import ProductWalkthrough from './components/ProductWalkthrough';
import ScrollToTop from './components/ScrollToTop';
import StatsBar from './components/StatsBar';
import SubjectsStrip from './components/SubjectsStrip';
import TestimonialsSection from './components/TestimonialsSection';
import TrustSection from './components/TrustSection';
import TryItDemo from './components/TryItDemo';
import Clients from './components/Clients';
import SeoHead from '../client/components/SeoHead';

import { buildStats, demoQuestions, faqs, features, pricingTeaserPlans, subjects } from './contentSections';
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
    <div className="border-y border-border/60 bg-muted/30">
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
      <SeoHead
        title="LicenseDent - Gulf + Ireland Dental Licensing Exam Prep"
        description="Practice questions, timed mock tests and subject-wise revision for Gulf and Ireland dental licensing exams — written and reviewed by practicing dentists."
        path="/"
        faqs={faqs}
      />
      <main className="isolate">
        {/* 1 · Hook — the signature moment (dark, cinematic) */}
        <Hero questionCount={bankStats?.publishedQuestionCount} examCount={bankStats?.examCount} />

        {/* Trust strip — where these licences let you practice */}
        <Clients />

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

        {/* 4 · What you get — the bento feature overview. (Two other sections
            used to repeat this exact list right after it -- a tabbed
            "study tools" detail view, then a pill-strip of practice filters
            that just restated Quiz Builder's own filters again. Cut both:
            one clear feature overview beats the same list three times. */}
        <FeaturesGrid features={features} />

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

        {/* 9 · Testimonials (PRD-007) -- the section removed for having
            placeholder names is back, now backed by a real Testimonial
            table with zero seed rows. Renders nothing until at least one
            real, name-cleared quote is added and published via
            /admin/testimonials -- see that component's own comment. */}
        <TestimonialsSection />

        {/* 10 · Final call — dark, bookends the hero. */}
        <CTABanner questionCount={bankStats?.publishedQuestionCount} examCount={bankStats?.examCount} />
      </main>

      <ScrollToTop />
    </div>
  );
}