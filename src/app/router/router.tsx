import React, { useState } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
  Navigate,
  ScrollRestoration,
} from '@tanstack/react-router';
import { useIsRestoring } from '@tanstack/react-query';
import { useAuth, UpdateUserSettingsParams } from '../../entities/user';
import { CURRENCIES } from '../../entities/budget';
import { AuthPage } from '../../pages/auth';
import { OnboardingPage } from '../../pages/onboarding';
import { DashboardPage } from '../../pages/dashboard';
import { FamilyPage } from '../../pages/family';
import { AnalyticsPage } from '../../pages/analytics';
import { TopNavbar, ActiveNavTab } from '../../widgets/top-navbar';
import { EditBudgetModal } from '../../features/manage-budget';
import { ErrorFallbackCard } from '../../features/error-fallback';
import { AppShellSkeleton, MobileScrollIndicator } from '../../shared/ui';

const RootLayout: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading, updateUserSettings } = useAuth();
  const isRestoring = useIsRestoring();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const routerState = useRouterState();
  const navigate = useNavigate();

  const isSkeletonPreview = typeof window !== 'undefined' && window.location.search.includes('skeleton=true');

  if (isRestoring || isLoading || isSkeletonPreview) {
    return <AppShellSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
        <AuthPage />
      </div>
    );
  }

  if (!currentUser?.isOnboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
        <OnboardingPage />
      </div>
    );
  }

  // Derive active tab from current route path
  const path = routerState.location.pathname;
  let activeTab: ActiveNavTab = 'dashboard';
  if (path.startsWith('/family')) {
    activeTab = 'family';
  } else if (path.startsWith('/analytics')) {
    activeTab = 'analytics';
  }

  const handleTabChange = (tab: ActiveNavTab) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate({ to: `/${tab}` as any });
  };

  const curr = CURRENCIES[currentUser.profile?.currency || 'RUB'] || CURRENCIES.RUB;

  return (
    <div className="min-h-screen min-w-[375px] flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black animate-fade-in">
      <ScrollRestoration />
      <MobileScrollIndicator />
      {/* Top Navigation Bar */}
      <TopNavbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main View Container with Outlet */}
      <main id="app-main-view" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-safe flex flex-col items-center">
        <Outlet />
      </main>

      {/* Global Settings & Budget Modal */}
      <EditBudgetModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currency={curr}
        currentUser={currentUser}
        onSave={(params: UpdateUserSettingsParams) => updateUserSettings(params)}
      />
    </div>
  );
};

const rootRoute = createRootRoute({
  component: RootLayout,
  pendingComponent: AppShellSkeleton,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" replace />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const familyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/family',
  component: FamilyPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  familyRoute,
  analyticsRoute,
  authRoute,
  onboardingRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingComponent: AppShellSkeleton,
  defaultErrorComponent: ({ error, reset }) => (
    <ErrorFallbackCard
      error={error as Error}
      resetErrorBoundary={reset}
      variant="page"
      title="Ошибка маршрутизации"
      subtitle="Произошел сбой при переходе по маршруту приложения."
    />
  ),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
