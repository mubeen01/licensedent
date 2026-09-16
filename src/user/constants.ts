import { BarChart3, CreditCard, LayoutDashboard, ListChecks, Settings, Shield } from 'lucide-react';
import { routes } from 'wasp/client/router';

export const userMenuItems = [
  {
    name: 'Dashboard',
    to: routes.DashboardHomeRoute.to,
    icon: LayoutDashboard,
    isAdminOnly: false,
    isAuthRequired: true,
  },
  {
    name: 'Practice',
    to: routes.PracticeRoute.to,
    icon: ListChecks,
    isAdminOnly: false,
    isAuthRequired: true,
  },
  {
    name: 'Progress',
    to: routes.ProgressRoute.to,
    icon: BarChart3,
    isAdminOnly: false,
    isAuthRequired: true,
  },
  {
    name: 'Account Settings',
    to: routes.AccountRoute.to,
    icon: Settings,
    isAuthRequired: false,
    isAdminOnly: false,
  },
  {
    name: 'Billing',
    to: routes.BillingRoute.to,
    icon: CreditCard,
    isAuthRequired: false,
    isAdminOnly: false,
  },
  {
    name: 'Admin Dashboard',
    to: routes.AdminRoute.to,
    icon: Shield,
    isAuthRequired: false,
    isAdminOnly: true,
  },
] as const;
