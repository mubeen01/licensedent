import { app, page, route, query, action, api } from '@wasp.sh/spec'

// Auth-related src imports
import { getVerificationEmailContent, getPasswordResetEmailContent } from './src/auth/email-and-pass/emails' with { type: 'ref' }
import { getEmailUserFields } from './src/auth/userSignupFields' with { type: 'ref' }
import { onBeforeLoginHook } from './src/auth/hooks' with { type: 'ref' }
import { seedMockUsers, migrateBlogPostsFromMarkdown } from './src/server/scripts/dbSeeds' with { type: 'ref' }
import { importLessonFolder } from './src/server/scripts/importLessonFolder' with { type: 'ref' }
import { importMcqBatches } from './src/server/scripts/importMcqBatches' with { type: 'ref' }
import { importGulf180Videos } from './src/server/scripts/importGulf180Videos' with { type: 'ref' }
import { verifyPRD005AllPhases } from './src/server/scripts/verifyPRD005AllPhases' with { type: 'ref' }
import App from './src/client/App' with { type: 'ref' }
import { serverMiddlewareFn } from './src/server/serverSetup' with { type: 'ref' }

// Landing
import LandingPage from './src/landing-page/LandingPage' with { type: 'ref' }
import { getPublicExams, getPublicBankStats } from './src/landing-page/operations' with { type: 'ref' }

// Legal
import LegalPage from './src/legal/LegalPage' with { type: 'ref' }

// About
import AboutPage from './src/about/AboutPage' with { type: 'ref' }

// Contact
import ContactPage from './src/contact/ContactPage' with { type: 'ref' }

// Blog (PRD-007)
import BlogIndexPage from './src/blog/BlogIndexPage' with { type: 'ref' }
import BlogPostPage from './src/blog/BlogPostPage' with { type: 'ref' }
import AdminBlog from './src/admin/dashboards/blog/BlogManagementPage' with { type: 'ref' }
import { getPublishedBlogPosts, getPublishedBlogPostBySlug } from './src/blog/operations' with { type: 'ref' }
import { prepareBlogBuildTimeData } from './src/blog/blogBuildTimeData'
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogPostsForAdmin,
  getBlogPostForAdmin,
  getBlogImageUploadUrl,
} from './src/admin/dashboards/blog/operations' with { type: 'ref' }

// Testimonials (PRD-007) -- real quotes only, admin-managed, never seeded
import AdminTestimonials from './src/admin/dashboards/testimonials/TestimonialsManagementPage' with { type: 'ref' }
import { getPublishedTestimonials } from './src/landing-page/testimonialsOperations' with { type: 'ref' }
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialsForAdmin,
  getTestimonialImageUploadUrl,
} from './src/admin/dashboards/testimonials/operations' with { type: 'ref' }

// Demo Exam
import DemoExamPage from './src/demo-exam/DemoExamPage' with { type: 'ref' }

// Exam guide pages
import AllExamsPage from './src/exam-pages/AllExamsPage' with { type: 'ref' }
import DhaExamPage from './src/exam-pages/DhaExamPage' with { type: 'ref' }
import HaadExamPage from './src/exam-pages/HaadExamPage' with { type: 'ref' }
import MohExamPage from './src/exam-pages/MohExamPage' with { type: 'ref' }
import SmleExamPage from './src/exam-pages/SmleExamPage' with { type: 'ref' }
import OmsbExamPage from './src/exam-pages/OmsbExamPage' with { type: 'ref' }
import QchpExamPage from './src/exam-pages/QchpExamPage' with { type: 'ref' }
import KmleExamPage from './src/exam-pages/KmleExamPage' with { type: 'ref' }
import NhraExamPage from './src/exam-pages/NhraExamPage' with { type: 'ref' }
import ShaExamPage from './src/exam-pages/ShaExamPage' with { type: 'ref' }
import IdcExamPage from './src/exam-pages/IdcExamPage' with { type: 'ref' }

// Auth Pages
import Login from './src/auth/LoginPage' with { type: 'ref' }
import { Signup } from './src/auth/SignupPage' with { type: 'ref' }
import { RequestPasswordResetPage } from './src/auth/email-and-pass/RequestPasswordResetPage' with { type: 'ref' }
import { PasswordResetPage } from './src/auth/email-and-pass/PasswordResetPage' with { type: 'ref' }
import { EmailVerificationPage } from './src/auth/email-and-pass/EmailVerificationPage' with { type: 'ref' }

// User
import Account from './src/user/AccountPage' with { type: 'ref' }
import { getPaginatedUsers, updateIsUserAdminById } from './src/user/operations' with { type: 'ref' }

// Payment
import PricingPage from './src/payment/PricingPage' with { type: 'ref' }
import Checkout from './src/payment/CheckoutPage' with { type: 'ref' }
import {
  getCustomerPortalUrl,
  getMySubscription,
  getMySubscriptionHistory,
  getMyEffectiveAccess,
  getMyDashboardScope,
  generateCheckoutSession,
  getPlanAvailability,
} from './src/payment/operations' with { type: 'ref' }
import BillingPage from './src/dashboard/BillingPage' with { type: 'ref' }
import { paymentsWebhook, paymentsMiddlewareConfigFn } from './src/payment/webhook' with { type: 'ref' }

// Admin Dashboard
import AnalyticsDashboardPage from './src/admin/dashboards/analytics/AnalyticsDashboardPage' with { type: 'ref' }
import AdminUsers from './src/admin/dashboards/users/UsersDashboardPage' with { type: 'ref' }
import AdminUserDetail from './src/admin/dashboards/users/UserDetailPage' with { type: 'ref' }
import {
  getUsersOverviewStats,
  getUserDetail,
  getUserNotes,
  addUserNote,
  deleteUserNote,
  updateUserTags,
  updateUserProfileByAdmin,
  getUserSubscriptions,
  grantUserSubscription,
  revokeUserSubscription,
  toggleUserDisabled,
  inviteUser,
  sendUserPasswordReset,
  getUserActivitySummary,
} from './src/admin/dashboards/users/operations' with { type: 'ref' }
import AdminExams from './src/admin/dashboards/exams/ExamsManagementPage' with { type: 'ref' }
import { updateExam, createExam } from './src/admin/dashboards/exams/operations' with { type: 'ref' }
import AdminLessons from './src/admin/dashboards/lessons/LessonsManagementPage' with { type: 'ref' }
import {
  getLessonsForAdmin,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLesson,
  createLessonPart,
  updateLessonPart,
  deleteLessonPart,
  reorderLessonPart,
  searchPublishedQuestionsForExam,
  getLessonPartQuestions,
  assignQuestionToLessonPart,
  unassignQuestionFromLessonPart,
  createSubjectForExam,
} from './src/admin/dashboards/lessons/operations' with { type: 'ref' }
import AdminQuestions from './src/admin/dashboards/questions/QuestionsReviewPage' with { type: 'ref' }
import AdminImportQuestions from './src/admin/dashboards/questions/ImportQuestionsPage' with { type: 'ref' }
import AdminAuditLog from './src/admin/dashboards/auditLog/AuditLogPage' with { type: 'ref' }
import { getAdminAuditLog, getAuditLogEntityTypes } from './src/admin/dashboards/auditLog/operations' with { type: 'ref' }
import { NotFoundPage } from './src/client/components/NotFoundPage' with { type: 'ref' }

// Question Review
import {
  getImportBatches,
  getSubjectsForReview,
  getQuestionBankStats,
  getReviewerActivityStats,
  getQuestionVersions,
  getQuestionById,
  searchQuestions,
  createSubject,
  updateSubject,
  deleteSubject,
  getQuestionsForReview,
  getQuestionIdsForReview,
  updateReviewQuestion,
  approveQuestion,
  unpublishQuestion,
  rejectQuestion,
  deleteQuestion,
  bulkQuestionAction,
  getExamsForAdmin,
  getSubjectsForExam,
  importQuestionsFromText,
  draftAiSuggestion,
  draftAiSuggestionsForSubject,
  getQuestionImageUploadUrl,
  setQuestionImage,
} from './src/admin/dashboards/questions/operations' with { type: 'ref' }
import {
  getAdminOverviewStats,
  getAdminGrowthSeries,
  getAdminReviewVelocity,
  getAdminRecentActivity,
} from './src/admin/dashboards/overview/operations' with { type: 'ref' }

// Practice mode
import PracticePage from './src/questions/PracticePage' with { type: 'ref' }
import ReviewPage from './src/questions/ReviewPage' with { type: 'ref' }
import SmartReviewPage from './src/questions/SmartReviewPage' with { type: 'ref' }
import {
  getPracticeSubjects,
  getPracticeQuestions,
  submitAnswer,
  saveQuestionNote,
  getMyMarkedQuestions,
  getDueReviewQuestions,
  getDueReviewCount,
  getCustomQuizMatchCount,
  getCustomQuizQuestions,
} from './src/questions/operations' with { type: 'ref' }

// Quiz Builder
import QuizBuilderPage from './src/quiz-builder/QuizBuilderPage' with { type: 'ref' }
import CustomQuizAttemptPage from './src/quiz-builder/CustomQuizAttemptPage' with { type: 'ref' }
import CustomQuizResultsPage from './src/quiz-builder/CustomQuizResultsPage' with { type: 'ref' }
import {
  startCustomQuizAttempt,
  getCustomQuizAttempt,
  saveCustomQuizAnswer,
  submitCustomQuizAttempt,
  getCustomQuizResults,
} from './src/quiz-builder/operations' with { type: 'ref' }

// Mock Exams
import MockExamsPage from './src/mock-exams/MockExamsPage' with { type: 'ref' }
import MockExamInstructionsPage from './src/mock-exams/MockExamInstructionsPage' with { type: 'ref' }
import MockExamAttemptPage from './src/mock-exams/MockExamAttemptPage' with { type: 'ref' }
import MockExamResultsPage from './src/mock-exams/MockExamResultsPage' with { type: 'ref' }
import {
  getMockExams,
  getMockExamAttempt,
  getMockExamResults,
  getExamReadiness,
  getReadinessScore,
  getMockTestMeta,
  startMockExamAttempt,
  saveMockExamAnswer,
  submitMockExamAttempt,
} from './src/mock-exams/operations' with { type: 'ref' }

// Progress
import ProgressPage from './src/dashboard/ProgressPage' with { type: 'ref' }
import DashboardHomePage from './src/dashboard/DashboardHomePage' with { type: 'ref' }
import {
  getMyProgress,
  getMyDashboardOverview,
  getMyStudyStats,
  getMyStudyPlan,
} from './src/dashboard/operations' with { type: 'ref' }

// Onboarding
import OnboardingPage from './src/onboarding/OnboardingPage' with { type: 'ref' }
import {
  getMyOnboardingProfile,
  completeOnboarding,
  updateTargetExamDate,
} from './src/onboarding/operations' with { type: 'ref' }

// Video Lectures
import VideoLecturesPage from './src/video-lectures/VideoLecturesPage' with { type: 'ref' }

// Lessons (PRD-002 Phase I5 -- structured Lesson/Part/quiz-gate content, Ireland Pathway)
import LessonsPage from './src/lessons/LessonsPage' with { type: 'ref' }
import LessonPartQuizPage from './src/lessons/LessonPartQuizPage' with { type: 'ref' }
import LessonPartQuizResultsPage from './src/lessons/LessonPartQuizResultsPage' with { type: 'ref' }
import {
  getLessons,
  startLessonPartQuizAttempt,
  getLessonPartQuizAttempt,
  saveLessonPartQuizAnswer,
  submitLessonPartQuizAttempt,
  getLessonPartQuizResults,
} from './src/lessons/operations' with { type: 'ref' }

// Contact Form Messages
import AdminMessages from './src/admin/dashboards/messages/MessagesPage' with { type: 'ref' }
import {
  createContactFormMessage,
  getContactFormMessages,
  markMessageRead,
  markMessageReplied,
  getUnreadMessageCount,
} from './src/admin/dashboards/messages/operations' with { type: 'ref' }

// Fast Track pilot applications (free, admin-vetted -- no Stripe purchase)
import FastTrackApplyPage from './src/fast-track/ApplyPage' with { type: 'ref' }
import AdminFastTrackApplications from './src/admin/dashboards/fastTrack/FastTrackApplicationsPage' with { type: 'ref' }
import {
  createFastTrackApplication,
  getMyFastTrackApplication,
  getFastTrackApplications,
  approveFastTrackApplication,
  rejectFastTrackApplication,
} from './src/fast-track/operations' with { type: 'ref' }

// PRD-007 S12: concrete `/blog/<slug>` paths to prerender, resolved once
// per `wasp start`/`wasp build` -- see getPublishedSlugsForBuild.ts's own
// header comment for why this lives outside the generated server and the
// staleness tradeoff it accepts.
const publishedBlogPostPaths = await prepareBlogBuildTimeData();

export default app({
  name: 'LicenseDent',
  wasp: { version: '^0.25.0' },

  title: 'LicenseDent - Gulf + Ireland Dental Licensing Exam Prep',

  head: [
    // SVG favicon for modern browsers + Google Search (which supports SVG
    // favicons). PNG fallbacks alongside it for the crawlers/browsers that
    // don't render SVG favicons (notably Safari) and for anything that
    // falls back to the conventional /favicon.ico path -- that file used to
    // be OpenSaaS's leftover generic default, not LicenseDent's icon, so
    // anything relying on it (rather than these link tags) would have shown
    // the wrong brand mark.
    "<link rel='icon' href='/logo/licensedent-favicon.svg' type='image/svg+xml' />",
    "<link rel='icon' href='/logo/favicon-32x32.png' type='image/png' sizes='32x32' />",
    "<link rel='icon' href='/logo/favicon-16x16.png' type='image/png' sizes='16x16' />",
    "<link rel='apple-touch-icon' href='/logo/apple-touch-icon.png' sizes='180x180' />",

    // PRD-006 C4: `description`/`author`/`keywords` used to be static here
    // (homepage copy only) -- same bug as the OG/Twitter tags described in
    // the comment below, and fixed the same way: a live curl of every
    // public route confirmed this global `description` landed FIRST in
    // document order on all 15 pages, and since `document.querySelector`
    // and most consumers take the first matching tag, every page's own
    // per-page description (rendered by SeoHead.tsx) was silently ignored
    // in favor of this one. Removed entirely; SeoHead.tsx is now the only
    // source of `description`, same as it already was for OG/Twitter.
    // `keywords` isn't used by Google and was mildly spam-adjacent besides.
    // Wasp's own base index.html already emits a charset meta tag, so the
    // one that used to be here was a harmless but pointless duplicate --
    // also removed.

    // Open Graph/Twitter tags used to be static here (homepage copy only),
    // duplicating what SeoHead.tsx now renders per-page -- confirmed via a
    // live curl that both sets landed in the same document, static one
    // first. Since most OG/Twitter card parsers take the first matching
    // tag, that meant every page's own og:title/description/url was
    // silently ignored in favor of the homepage's. Removed here entirely;
    // SeoHead.tsx (rendered on every public/auth/checkout page) is now the
    // only source of these tags, with real per-page values.

    // PRD-006 C5: a Plausible analytics pair used to be here, both with
    // `data-domain='<your-site-id>'` -- the literal, never-configured
    // placeholder from the OpenSaaS template. Confirmed live: Plausible's
    // own script was firing "Ignoring Event: localhost" console warnings
    // on every single page during local dev, since BOTH the production and
    // the local-dev variant loaded unconditionally, before and regardless
    // of the cookie-consent banner's decision (which exists specifically
    // to gate this). Removed entirely rather than left half-configured.
    // Re-add a single, correctly-configured tag once a real Plausible site
    // id exists, wired through the cookie-consent gate in
    // src/client/components/cookie-consent/Config.ts rather than here.
  ],

  // 🔐 Auth out of the box! https://wasp.sh/docs/auth/overview
  auth: {
    userEntity: 'User',
    methods: {
      // NOTE: If you decide to not use email auth, make sure to also delete the related routes and pages below.
      //   (RequestPasswordReset(Route|Page), PasswordReset(Route|Page), EmailVerification(Route|Page))
      email: {
        fromField: {
          name: 'LicenseDent',
          email: 'support@licensedent.com',
        },
        emailVerification: {
          clientRoute: 'EmailVerificationRoute',
          getEmailContentFn: getVerificationEmailContent,
        },
        passwordReset: {
          clientRoute: 'PasswordResetRoute',
          getEmailContentFn: getPasswordResetEmailContent,
        },
        userSignupFields: getEmailUserFields,
      },
      // Uncomment to enable Google Auth (check https://wasp.sh/docs/auth/social-auth/google for setup instructions)
      // Uncomment to enable GitHub Auth (check https://wasp.sh/docs/auth/social-auth/github for setup instructions)
      // Uncomment to enable Discord Auth (check https://wasp.sh/docs/auth/social-auth/discord for setup instructions)
    },
    onAuthFailedRedirectTo: '/login',
    onAuthSucceededRedirectTo: '/dashboard',
    onBeforeLogin: onBeforeLoginHook,
  },

  db: {
    // Run `wasp db seed` to seed the database with the seed functions below:
    seeds: [
      // Populates the database with a bunch of fake users to work with during development.
      seedMockUsers,
      // PRD-003: book-sourced lesson folder -> live Lesson/Parts/Questions.
      // Run with `wasp db seed importLessonFolder`, env-var configured -- see
      // src/server/scripts/importLessonFolder.ts's header for usage.
      importLessonFolder,
      // Gulf general-dentist bank: flat MCQ batch files (no Lesson/Part
      // structure) straight into a Subject's question pool. Run with
      // `wasp db seed importMcqBatches`, env-var configured -- see
      // src/server/scripts/importMcqBatches.ts's header for usage.
      importMcqBatches,
      // Gulf-180 video lessons: one video (10-slide script + Notes-short.md +
      // MCQs-5.md) -> one LessonPart, all videos for a subject sharing one
      // Lesson. Run with `wasp db seed importGulf180Videos`, env-var
      // configured -- see src/server/scripts/importGulf180Videos.ts's header.
      importGulf180Videos,
      // PRD-005 full-plan regression suite -- kept, safe to rerun anytime;
      // see the file header for what it checks and why it's not deleted
      // like the other verifyPhaseN... scripts.
      verifyPRD005AllPhases,
      // PRD-007: one-time migration of the 2 posts that existed as markdown
      // files in the now-retired blog/ Astro site into the BlogPost table.
      // Run with `wasp db seed migrateBlogPostsFromMarkdown`. Safe to rerun
      // -- skips any slug that already exists.
      migrateBlogPostsFromMarkdown,
    ],
  },

  client: {
    rootComponent: App,
  },

  emailSender: {
    // Resend (Wasp 0.25 first-class provider). Needs RESEND_API_KEY in
    // .env.server (dev) / as a Railway server secret (prod) -- see
    // docs/09-work-changelog.md's deploy-infra entry for the full setup
    // checklist. Falls back to no-op-ish behavior with an empty/missing
    // key: the server still boots, but actual sends (signup verification,
    // password reset) will fail until a real key is set.
    provider: 'Resend',
    defaultFrom: {
      name: 'LicenseDent',
      // Must match a sender address verified with Resend for the
      // licensedent.com domain (DNS records added in Resend's dashboard).
      email: 'support@licensedent.com',
    },
  },

  server: {
    // Raises the default 100kb request-body cap -- see serverSetup.ts for why
    // (question-import posts a whole PDF's extracted text as one JSON body).
    middlewareConfigFn: serverMiddlewareFn,
  },

  spec: [
    // prerender: true (PRD-01 S1.1) -- audited clean in S0.5, see
    // docs/07-seo-geo-blog-strategy-PRD-01.md §7 for the evidence table.
    route('LandingPageRoute', '/', page(LandingPage), { prerender: true }),
    query(getPublicExams, { entities: ['Exam'] }),
    query(getPublicBankStats, { entities: ['Question', 'Subject', 'Exam'] }),

    // Legal (public — terms of service, refund policy, disclaimers)
    route('LegalRoute', '/legal', page(LegalPage), { prerender: true }),

    // About (public — PRD-006 M20: who verifies content + contact)
    route('AboutRoute', '/about', page(AboutPage), { prerender: true }),

    // Contact (public — real contact form; signed-in visitors post straight
    // into ContactFormMessage, signed-out visitors get a prefilled mailto:)
    route('ContactRoute', '/contact', page(ContactPage), { prerender: true }),

    // Blog (public — PRD-007: DB-backed, admin-managed; replaces the earlier
    // separate Astro/Starlight blog/ site). Both routes are prerender: true
    // now (PRD-007 S12, 2026-09-23) -- BlogIndexRoute for its own path,
    // BlogPostRoute for every currently *published* post's concrete path
    // (`publishedBlogPostPaths`, resolved above). Marking the route alone
    // is NOT sufficient by itself, though -- confirmed empirically that
    // Wasp's prerender pass can't resolve a live `useQuery` (PRD-01 S2.2's
    // finding), so both pages ALSO feed `useQuery(..., { initialData })`
    // from `publishedPostsSnapshot.generated.json` (written by
    // blogBuildTimeData.ts in the same DB round-trip as the paths above) --
    // see that file's header comment for the full mechanism. This is what
    // actually gets a non-JS crawler/schema validator real HTML + JSON-LD
    // instead of a frozen loading spinner. Deliberately accepted tradeoff:
    // editing an already-published post's title/body won't reach its
    // frozen HTML until the next rebuild/restart -- same staleness class
    // this project's own sitemap.xml already lives with. A post published
    // *after* the last rebuild has no entry yet either -- it still renders
    // correctly client-side (`initialData`/`prerender` only ever add a
    // frozen head-start on top of the existing live-query page, never
    // replace it), it just isn't frozen until the next rebuild picks it up.
    // See blogBuildTimeData.ts and PRD-007 S12 for the full reasoning.
    route('BlogIndexRoute', '/blog', page(BlogIndexPage), { prerender: true }),
    route('BlogPostRoute', '/blog/:slug', page(BlogPostPage), { prerender: publishedBlogPostPaths }),
    route('AdminBlogRoute', '/admin/blog', page(AdminBlog, { authRequired: true })),
    query(getPublishedBlogPosts, { entities: ['BlogPost'] }),
    query(getPublishedBlogPostBySlug, { entities: ['BlogPost'] }),
    query(getBlogPostsForAdmin, { entities: ['BlogPost'] }),
    query(getBlogPostForAdmin, { entities: ['BlogPost'] }),
    action(createBlogPost, { entities: ['BlogPost'] }),
    action(updateBlogPost, { entities: ['BlogPost'] }),
    action(deleteBlogPost, { entities: ['BlogPost'] }),
    action(getBlogImageUploadUrl),

    // Testimonials (PRD-007)
    route('AdminTestimonialsRoute', '/admin/testimonials', page(AdminTestimonials, { authRequired: true })),
    query(getPublishedTestimonials, { entities: ['Testimonial'] }),
    query(getTestimonialsForAdmin, { entities: ['Testimonial'] }),
    action(createTestimonial, { entities: ['Testimonial'] }),
    action(updateTestimonial, { entities: ['Testimonial'] }),
    action(deleteTestimonial, { entities: ['Testimonial'] }),
    action(getTestimonialImageUploadUrl),

    // Demo Exam (public, front-end only — no auth, no DB, sample questions)
    route('DemoExamRoute', '/demo-exam', page(DemoExamPage), { prerender: true }),

    // Exam guide pages (public, front-end only — one per exam)
    route('AllExamsRoute', '/exams', page(AllExamsPage), { prerender: true }),
    route('DhaExamRoute', '/exams/dha', page(DhaExamPage), { prerender: true }),
    route('HaadExamRoute', '/exams/haad', page(HaadExamPage), { prerender: true }),
    route('MohExamRoute', '/exams/moh', page(MohExamPage), { prerender: true }),
    route('SmleExamRoute', '/exams/smle', page(SmleExamPage), { prerender: true }),
    route('OmsbExamRoute', '/exams/omsb', page(OmsbExamPage), { prerender: true }),
    route('QchpExamRoute', '/exams/qchp', page(QchpExamPage), { prerender: true }),
    route('KmleExamRoute', '/exams/kmle', page(KmleExamPage), { prerender: true }),
    route('NhraExamRoute', '/exams/nhra', page(NhraExamPage), { prerender: true }),
    route('ShaExamRoute', '/exams/sha', page(ShaExamPage), { prerender: true }),
    route('IdcExamRoute', '/exams/idc-ireland', page(IdcExamPage), { prerender: true }),

    // Auth Pages
    route('LoginRoute', '/login', page(Login)),
    route('SignupRoute', '/signup', page(Signup)),
    route('RequestPasswordResetRoute', '/request-password-reset', page(RequestPasswordResetPage)),
    route('PasswordResetRoute', '/password-reset', page(PasswordResetPage)),
    route('EmailVerificationRoute', '/email-verification', page(EmailVerificationPage)),

    // User
    route('AccountRoute', '/account', page(Account, { authRequired: true })),
    query(getPaginatedUsers, { entities: ['User', 'Subscription'] }),
    action(updateIsUserAdminById, { entities: ['User'] }),

    // Payment
    route('PricingPageRoute', '/pricing', page(PricingPage), { prerender: true }),
    route('CheckoutRoute', '/checkout', page(Checkout, { authRequired: true })),
    query(getPlanAvailability),
    query(getCustomerPortalUrl, { entities: ['User'] }),
    query(getMySubscription, { entities: ['Subscription'] }),
    query(getMySubscriptionHistory, { entities: ['Subscription'] }),
    query(getMyEffectiveAccess, { entities: ['Subscription', 'UserAttempt'] }),
    query(getMyDashboardScope, { entities: ['Subscription', 'Exam', 'UserAttempt'] }),
    route('BillingRoute', '/billing', page(BillingPage, { authRequired: true })),
    action(generateCheckoutSession, { entities: ['User', 'Exam'] }),
    api('POST', '/payments-webhook', paymentsWebhook, {
      entities: ['User', 'Subscription'],
      middlewareConfigFn: paymentsMiddlewareConfigFn,
    }),

    // Admin Dashboard
    route('AdminRoute', '/admin', page(AnalyticsDashboardPage, { authRequired: true })),
    route('AdminUsersRoute', '/admin/users', page(AdminUsers, { authRequired: true })),
    route('AdminUserDetailRoute', '/admin/users/:userId', page(AdminUserDetail, { authRequired: true })),
    query(getUsersOverviewStats, { entities: ['User'] }),
    query(getUserDetail, { entities: ['User', 'UserProfile', 'Exam'] }),
    query(getUserNotes, { entities: ['AdminUserNote'] }),
    action(addUserNote, { entities: ['AdminUserNote'] }),
    action(deleteUserNote, { entities: ['AdminUserNote'] }),
    action(updateUserTags, { entities: ['User'] }),
    action(updateUserProfileByAdmin, { entities: ['UserProfile'] }),
    query(getUserSubscriptions, { entities: ['Subscription'] }),
    action(grantUserSubscription, { entities: ['Subscription', 'Exam'] }),
    action(revokeUserSubscription, { entities: ['Subscription'] }),
    action(toggleUserDisabled, { entities: ['User'] }),
    action(inviteUser, { entities: ['User'] }),
    action(sendUserPasswordReset, { entities: ['User'] }),
    query(getUserActivitySummary, { entities: ['User', 'UserAttempt', 'MockExamAttempt'] }),

    route('AdminExamsRoute', '/admin/exams', page(AdminExams, { authRequired: true })),
    action(updateExam, { entities: ['Exam'] }),
    action(createExam, { entities: ['Exam'] }),

    route('AdminLessonsRoute', '/admin/lessons', page(AdminLessons, { authRequired: true })),
    query(getLessonsForAdmin, { entities: ['Lesson', 'LessonPart', 'Question', 'Subject'] }),
    action(createLesson, { entities: ['Lesson', 'Subject'] }),
    action(updateLesson, { entities: ['Lesson', 'Subject'] }),
    action(deleteLesson, { entities: ['Lesson'] }),
    action(reorderLesson, { entities: ['Lesson'] }),
    action(createLessonPart, { entities: ['LessonPart'] }),
    action(updateLessonPart, { entities: ['LessonPart'] }),
    action(deleteLessonPart, { entities: ['LessonPart'] }),
    action(reorderLessonPart, { entities: ['LessonPart'] }),
    query(searchPublishedQuestionsForExam, { entities: ['Question'] }),
    query(getLessonPartQuestions, { entities: ['LessonPart'] }),
    action(assignQuestionToLessonPart, { entities: ['LessonPart', 'Question'] }),
    action(unassignQuestionFromLessonPart, { entities: ['LessonPart'] }),
    action(createSubjectForExam, { entities: ['Subject'] }),

    route('AdminQuestionsRoute', '/admin/questions', page(AdminQuestions, { authRequired: true })),
    route('AdminImportQuestionsRoute', '/admin/questions/import', page(AdminImportQuestions, { authRequired: true })),

    route('AdminAuditLogRoute', '/admin/audit-log', page(AdminAuditLog, { authRequired: true })),
    query(getAdminAuditLog, { entities: ['AdminAuditLog', 'User'] }),
    query(getAuditLogEntityTypes, { entities: ['AdminAuditLog'] }),

    route('NotFoundRoute', '*', page(NotFoundPage)),

    // Question Review (dental exam-prep admin queue)
    query(getImportBatches, { entities: ['ImportBatch'] }),
    query(getSubjectsForReview, { entities: ['Subject', 'Question'] }),
    query(getQuestionBankStats, { entities: ['Question', 'Subject'] }),
    query(getReviewerActivityStats, { entities: ['Question'] }),
    query(getAdminOverviewStats, { entities: ['User', 'Subscription', 'ContactFormMessage'] }),
    query(getAdminGrowthSeries, { entities: ['User'] }),
    query(getAdminReviewVelocity, { entities: ['Question'] }),
    query(getAdminRecentActivity, { entities: ['User', 'Subscription', 'ContactFormMessage', 'AdminAuditLog'] }),
    query(getQuestionVersions, { entities: ['QuestionVersion'] }),
    query(getQuestionById, { entities: ['Question'] }),
    query(searchQuestions, { entities: ['Question', 'Subject'] }),
    action(createSubject, { entities: ['Exam', 'Subject'] }),
    action(updateSubject, { entities: ['Subject'] }),
    action(deleteSubject, { entities: ['Subject', 'Question'] }),
    query(getQuestionsForReview, { entities: ['Question'] }),
    query(getQuestionIdsForReview, { entities: ['Question'] }),
    action(updateReviewQuestion, { entities: ['Question', 'QuestionVersion'] }),
    action(approveQuestion, { entities: ['Question', 'ImportBatch'] }),
    action(unpublishQuestion, { entities: ['Question'] }),
    action(rejectQuestion, { entities: ['Question', 'ImportBatch'] }),
    action(deleteQuestion, {
      entities: [
        'Question',
        'QuestionVersion',
        'QuestionNote',
        'UserAttempt',
        'MockExamAttemptItem',
        'ReviewSchedule',
        'CustomQuizAttemptItem',
        'ImportBatch',
      ],
    }),
    action(bulkQuestionAction, {
      entities: [
        'Question',
        'ImportBatch',
        'QuestionVersion',
        'QuestionNote',
        'UserAttempt',
        'MockExamAttemptItem',
        'ReviewSchedule',
        'CustomQuizAttemptItem',
        'Subject',
      ],
    }),
    query(getExamsForAdmin, { entities: ['Exam'] }),
    query(getSubjectsForExam, { entities: ['Subject'] }),
    action(importQuestionsFromText, { entities: ['Exam', 'Subject', 'Question', 'ImportBatch'] }),
    action(draftAiSuggestion, { entities: ['Question'] }),
    action(draftAiSuggestionsForSubject, { entities: ['Question'] }),
    action(getQuestionImageUploadUrl, { entities: ['Question'] }),
    action(setQuestionImage, { entities: ['Question'] }),

    // Practice mode (student-facing MCQ engine)
    route('PracticeRoute', '/practice', page(PracticePage, { authRequired: true })),
    query(getPracticeSubjects, { entities: ['Subject', 'Exam', 'Subscription', 'UserAttempt'] }),
    query(getPracticeQuestions, { entities: ['Question', 'QuestionNote', 'Subscription', 'UserAttempt', 'Exam'] }),
    action(submitAnswer, { entities: ['Question', 'UserAttempt', 'ReviewSchedule', 'Subscription', 'Exam'] }),
    route('ReviewRoute', '/practice/review', page(ReviewPage, { authRequired: true })),
    action(saveQuestionNote, { entities: ['QuestionNote'] }),
    query(getMyMarkedQuestions, { entities: ['QuestionNote', 'Subscription', 'UserAttempt', 'Exam'] }),
    route('SmartReviewRoute', '/practice/smart-review', page(SmartReviewPage, { authRequired: true })),
    query(getDueReviewQuestions, {
      entities: ['ReviewSchedule', 'Question', 'QuestionNote', 'Subscription', 'UserAttempt', 'Exam'],
    }),
    query(getDueReviewCount, { entities: ['ReviewSchedule', 'Subscription', 'UserAttempt', 'Exam'] }),

    // Quiz Builder (Extended-plan perk -- Phase 1: practice-mode filters, Phase 2: timed/exam mode)
    route('QuizBuilderRoute', '/quiz-builder', page(QuizBuilderPage, { authRequired: true })),
    query(getCustomQuizMatchCount, { entities: ['Question', 'UserAttempt', 'QuestionNote', 'Subscription', 'Exam'] }),
    query(getCustomQuizQuestions, { entities: ['Question', 'UserAttempt', 'QuestionNote', 'Subscription', 'Exam'] }),
    route('CustomQuizAttemptRoute', '/quiz-builder/:attemptId', page(CustomQuizAttemptPage, { authRequired: true })),
    route('CustomQuizResultsRoute', '/quiz-builder/:attemptId/results', page(CustomQuizResultsPage, { authRequired: true })),
    action(startCustomQuizAttempt, {
      entities: [
        'CustomQuizAttempt',
        'CustomQuizAttemptItem',
        'Question',
        'UserAttempt',
        'QuestionNote',
        'Subscription',
        'Exam',
      ],
    }),
    query(getCustomQuizAttempt, { entities: ['CustomQuizAttempt'] }),
    action(saveCustomQuizAnswer, { entities: ['CustomQuizAttempt', 'CustomQuizAttemptItem'] }),
    action(submitCustomQuizAttempt, { entities: ['CustomQuizAttempt', 'CustomQuizAttemptItem', 'Question'] }),
    query(getCustomQuizResults, { entities: ['CustomQuizAttempt'] }),

    // Mock Exams (timed, random-draw-per-attempt from the growing bank)
    route('MockExamsRoute', '/mock-exams', page(MockExamsPage, { authRequired: true })),
    route('MockExamInstructionsRoute', '/mock-exams/start/:mockTestId', page(MockExamInstructionsPage, { authRequired: true })),
    route('MockExamAttemptRoute', '/mock-exams/:attemptId', page(MockExamAttemptPage, { authRequired: true })),
    route('MockExamResultsRoute', '/mock-exams/:attemptId/results', page(MockExamResultsPage, { authRequired: true })),
    query(getMockExams, { entities: ['MockTest', 'MockExamAttempt', 'Exam', 'Subscription', 'UserAttempt'] }),
    query(getMockExamAttempt, { entities: ['MockExamAttempt'] }),
    query(getMockExamResults, { entities: ['MockExamAttempt'] }),
    query(getExamReadiness, { entities: ['MockTest', 'MockExamAttempt', 'Exam', 'Subscription', 'UserAttempt'] }),
    query(getReadinessScore, { entities: ['MockExamAttempt', 'UserAttempt', 'Subject'] }),
    query(getMockTestMeta, { entities: ['MockTest'] }),
    action(startMockExamAttempt, {
      entities: ['MockTest', 'MockExamAttempt', 'Question', 'Subscription', 'Exam', 'UserAttempt'],
    }),
    action(saveMockExamAnswer, { entities: ['MockExamAttempt', 'MockExamAttemptItem'] }),
    action(submitMockExamAttempt, { entities: ['MockExamAttempt', 'MockExamAttemptItem', 'Question'] }),

    // Progress (per-subject accuracy for the logged-in user)
    route('ProgressRoute', '/progress', page(ProgressPage, { authRequired: true })),
    query(getMyProgress, { entities: ['UserAttempt'] }),

    // Dashboard home (real-data overview, no fabricated stats)
    route('DashboardHomeRoute', '/dashboard', page(DashboardHomePage, { authRequired: true })),
    query(getMyDashboardOverview, { entities: ['UserAttempt'] }),
    query(getMyStudyStats, { entities: ['UserAttempt', 'MockExamAttempt'] }),
    query(getMyStudyPlan, { entities: ['UserAttempt', 'Subject', 'UserProfile'] }),

    // Onboarding (mandatory one-time profile capture before dashboard access)
    route('OnboardingRoute', '/onboarding', page(OnboardingPage, { authRequired: true })),
    query(getMyOnboardingProfile, { entities: ['UserProfile'] }),
    action(completeOnboarding, { entities: ['UserProfile', 'Exam'] }),
    action(updateTargetExamDate, { entities: ['UserProfile'] }),

    // Video Lectures (Extended-plan perk — gated in the page component)
    route('VideoLecturesRoute', '/video-lectures', page(VideoLecturesPage, { authRequired: true })),

    // Lessons (PRD-002 Phase I5 -- structured Lesson/Part/quiz-gate content)
    route('LessonsRoute', '/lessons', page(LessonsPage, { authRequired: true })),
    query(getLessons, { entities: ['Lesson', 'LessonPart', 'Question', 'Subscription', 'Exam', 'UserAttempt'] }),
    route('LessonQuizRoute', '/lessons/quiz/:attemptId', page(LessonPartQuizPage, { authRequired: true })),
    route('LessonQuizResultsRoute', '/lessons/quiz/:attemptId/results', page(LessonPartQuizResultsPage, { authRequired: true })),
    action(startLessonPartQuizAttempt, {
      entities: ['LessonPart', 'LessonPartQuizAttempt', 'Question', 'Subscription', 'Exam', 'UserAttempt'],
    }),
    query(getLessonPartQuizAttempt, { entities: ['LessonPartQuizAttempt'] }),
    action(saveLessonPartQuizAnswer, { entities: ['LessonPartQuizAttempt', 'LessonPartQuizAttemptItem'] }),
    action(submitLessonPartQuizAttempt, { entities: ['LessonPartQuizAttempt', 'LessonPartQuizAttemptItem', 'Question'] }),
    query(getLessonPartQuizResults, { entities: ['LessonPartQuizAttempt'] }),

    // Contact Form Messages
    route('AdminMessagesRoute', '/admin/messages', page(AdminMessages, { authRequired: true })),
    action(createContactFormMessage, { entities: ['ContactFormMessage'] }),
    query(getContactFormMessages, { entities: ['ContactFormMessage', 'User'] }),
    action(markMessageRead, { entities: ['ContactFormMessage'] }),
    action(markMessageReplied, { entities: ['ContactFormMessage'] }),
    query(getUnreadMessageCount, { entities: ['ContactFormMessage'] }),

    // Fast Track pilot applications
    route('FastTrackApplyRoute', '/fast-track/apply', page(FastTrackApplyPage, { authRequired: true })),
    route(
      'AdminFastTrackApplicationsRoute',
      '/admin/fast-track-applications',
      page(AdminFastTrackApplications, { authRequired: true })
    ),
    action(createFastTrackApplication, { entities: ['FastTrackApplication', 'Exam'] }),
    query(getMyFastTrackApplication, { entities: ['FastTrackApplication'] }),
    query(getFastTrackApplications, { entities: ['FastTrackApplication'] }),
    action(approveFastTrackApplication, { entities: ['FastTrackApplication', 'Subscription', 'Exam'] }),
    action(rejectFastTrackApplication, { entities: ['FastTrackApplication'] }),
  ],
})
