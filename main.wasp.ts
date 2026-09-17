import { app, page, route, query, action, api, job } from '@wasp.sh/spec'

// Auth-related src imports
import { getVerificationEmailContent, getPasswordResetEmailContent } from './src/auth/email-and-pass/emails' with { type: 'ref' }
import { getEmailUserFields } from './src/auth/userSignupFields' with { type: 'ref' }
import { onBeforeLoginHook } from './src/auth/hooks' with { type: 'ref' }
import { seedMockUsers } from './src/server/scripts/dbSeeds' with { type: 'ref' }
import App from './src/client/App' with { type: 'ref' }
import { serverMiddlewareFn } from './src/server/serverSetup' with { type: 'ref' }

// Landing
import LandingPage from './src/landing-page/LandingPage' with { type: 'ref' }
import { getPublicExams, getPublicBankStats } from './src/landing-page/operations' with { type: 'ref' }

// Legal
import LegalPage from './src/legal/LegalPage' with { type: 'ref' }

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
} from './src/payment/operations' with { type: 'ref' }
import BillingPage from './src/dashboard/BillingPage' with { type: 'ref' }
import { paymentsWebhook, paymentsMiddlewareConfigFn } from './src/payment/webhook' with { type: 'ref' }

// Analytics
import { getDailyStats } from './src/analytics/operations' with { type: 'ref' }
import { calculateDailyStats } from './src/analytics/stats' with { type: 'ref' }

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
import AdminQuestions from './src/admin/dashboards/questions/QuestionsReviewPage' with { type: 'ref' }
import AdminImportQuestions from './src/admin/dashboards/questions/ImportQuestionsPage' with { type: 'ref' }
import AdminAuditLog from './src/admin/dashboards/auditLog/AuditLogPage' with { type: 'ref' }
import { getAdminAuditLog } from './src/admin/dashboards/auditLog/operations' with { type: 'ref' }
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

// Contact Form Messages
import AdminMessages from './src/admin/dashboards/messages/MessagesPage' with { type: 'ref' }
import {
  createContactFormMessage,
  getContactFormMessages,
  markMessageRead,
  markMessageReplied,
  getUnreadMessageCount,
} from './src/admin/dashboards/messages/operations' with { type: 'ref' }

export default app({
  name: 'LicenseDent',
  wasp: { version: '^0.25.0' },

  title: 'LicenseDent - Gulf + Ireland Dental Licensing Exam Prep',

  head: [
    "<link rel='icon' href='/licensedent-favicon.svg' type='image/svg+xml' />",
    "<meta charSet='utf-8' />",
    "<meta name='description' content='Practice-question bank, timed mock tests and subject-wise revision for DHA, HAAD, MOH, SMLE and IDC Ireland dental licensing exams.' />",
    "<meta name='author' content='LicenseDent' />",
    "<meta name='keywords' content='DHA exam prep, HAAD exam, IDC Ireland exam, dental licensing exam, dentist mock test, DHA MCQs, LicenseDent' />",

    "<meta property='og:type' content='website' />",
    "<meta property='og:title' content='LicenseDent - Gulf + Ireland Dental Licensing Exam Prep' />",
    "<meta property='og:site_name' content='LicenseDent' />",
    "<meta property='og:url' content='https://licensedent.com' />",
    "<meta property='og:description' content='Practice-question bank, timed mock tests and subject-wise revision for DHA, HAAD, MOH, SMLE and IDC Ireland dental licensing exams.' />",
    "<meta property='og:image' content='https://licensedent.com/licensedent-logo-primary.svg' />",
    "<meta name='twitter:image' content='https://licensedent.com/licensedent-logo-primary.svg' />",
    "<meta name='twitter:image:width' content='800' />",
    "<meta name='twitter:image:height' content='400' />",
    "<meta name='twitter:card' content='summary_large_image' />",
    // TODO: You can put your Plausible analytics scripts below (https://docs.opensaas.sh/guides/analytics/):
    // NOTE: Plausible does not use Cookies, so you can simply add the scripts here.
    // Google, on the other hand, does, so you must instead add the script dynamically
    // via the Cookie Consent component after the user clicks the "Accept" cookies button.
    // `async` (not `defer`) per Wasp Spec's head-tags note -- defer can cause hydration warnings.
    "<script async data-domain='<your-site-id>' src='https://plausible.io/js/script.js'></script>", // for production
    "<script async data-domain='<your-site-id>' src='https://plausible.io/js/script.local.js'></script>", // for development
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

    // Analytics
    query(getDailyStats, { entities: ['User', 'DailyStats'] }),
    job(calculateDailyStats, {
      executor: 'PgBoss',
      schedule: {
        cron: '0 * * * *', // every hour. useful in production
        // cron: '* * * * *' // every minute. useful for debugging
      },
      entities: ['User', 'DailyStats', 'Logs', 'PageViewSource'],
    }),

    // Admin Dashboard
    route('AdminRoute', '/admin', page(AnalyticsDashboardPage, { authRequired: true })),
    route('AdminUsersRoute', '/admin/users', page(AdminUsers, { authRequired: true })),
    route('AdminUserDetailRoute', '/admin/users/:userId', page(AdminUserDetail, { authRequired: true })),
    query(getUsersOverviewStats, { entities: ['User'] }),
    query(getUserDetail, { entities: ['User'] }),
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

    route('AdminQuestionsRoute', '/admin/questions', page(AdminQuestions, { authRequired: true })),
    route('AdminImportQuestionsRoute', '/admin/questions/import', page(AdminImportQuestions, { authRequired: true })),

    route('AdminAuditLogRoute', '/admin/audit-log', page(AdminAuditLog, { authRequired: true })),
    query(getAdminAuditLog, { entities: ['AdminAuditLog', 'User'] }),

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
    query(searchQuestions, { entities: ['Question'] }),
    action(createSubject, { entities: ['Exam', 'Subject'] }),
    action(updateSubject, { entities: ['Subject'] }),
    action(deleteSubject, { entities: ['Subject', 'Question'] }),
    query(getQuestionsForReview, { entities: ['Question'] }),
    action(updateReviewQuestion, { entities: ['Question'] }),
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
    action(submitAnswer, { entities: ['Question', 'UserAttempt', 'ReviewSchedule', 'Subscription'] }),
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
    query(getCustomQuizMatchCount, { entities: ['Question', 'UserAttempt', 'QuestionNote', 'Subscription'] }),
    query(getCustomQuizQuestions, { entities: ['Question', 'UserAttempt', 'QuestionNote', 'Subscription'] }),
    route('CustomQuizAttemptRoute', '/quiz-builder/:attemptId', page(CustomQuizAttemptPage, { authRequired: true })),
    route('CustomQuizResultsRoute', '/quiz-builder/:attemptId/results', page(CustomQuizResultsPage, { authRequired: true })),
    action(startCustomQuizAttempt, {
      entities: ['CustomQuizAttempt', 'CustomQuizAttemptItem', 'Question', 'UserAttempt', 'QuestionNote', 'Subscription'],
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

    // Contact Form Messages
    route('AdminMessagesRoute', '/admin/messages', page(AdminMessages, { authRequired: true })),
    action(createContactFormMessage, { entities: ['ContactFormMessage'] }),
    query(getContactFormMessages, { entities: ['ContactFormMessage', 'User'] }),
    action(markMessageRead, { entities: ['ContactFormMessage'] }),
    action(markMessageReplied, { entities: ['ContactFormMessage'] }),
    query(getUnreadMessageCount, { entities: ['ContactFormMessage'] }),
  ],
})
