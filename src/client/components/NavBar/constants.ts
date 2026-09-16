import { routes } from 'wasp/client/router';
import type { NavigationItem } from './NavBar';

export const marketingNavigationItems: NavigationItem[] = [
  { name: 'Exams', to: routes.AllExamsRoute.to },
  { name: 'Features', to: '/#features' },
  { name: 'Free Demo Exam', to: routes.DemoExamRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
  { name: 'FAQ', to: '/#faq' },
] as const;

export const demoNavigationitems: NavigationItem[] = [
  { name: 'Practice', to: routes.PracticeRoute.to },
  { name: 'Free Demo Exam', to: routes.DemoExamRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
] as const;
