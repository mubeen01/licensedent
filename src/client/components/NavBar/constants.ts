import { routes } from 'wasp/client/router';
import { BlogUrl } from '../../../shared/common';
import type { NavigationItem } from './NavBar';

export const marketingNavigationItems: NavigationItem[] = [
  { name: 'Exams', to: routes.AllExamsRoute.to },
  { name: 'Features', to: '/#features' },
  { name: 'Free Demo Exam', to: routes.DemoExamRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
  { name: 'FAQ', to: '/#faq' },
  { name: 'Blog', to: BlogUrl },
] as const;

export const demoNavigationitems: NavigationItem[] = [
  { name: 'Practice', to: routes.PracticeRoute.to },
  { name: 'Free Demo Exam', to: routes.DemoExamRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
  { name: 'Blog', to: BlogUrl },
] as const;
