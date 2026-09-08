import React, { useState, useEffect } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
  Navigate,
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
import { MobileBottomBar } from '../../widgets/mobile-bottom-bar';
import { EditBudgetModal } from '../../features/manage-budget';
import { AddExpenseModal } from '../../features/add-expense';
import { useCreateExpenseMutation } from '../../entities/expense';
import { POPULAR_STORES } from '../../entities/store';
import { AppShellSkeleton } from '../../shared/ui';
import { MandatoryInstallScreen } from '../../features/install-pwa';

const RootLayout: React.FC = () => {
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  const isMobile = typeof window !== 'undefined' && (
    /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );

  // Mandatory mobile screen: If opened in a mobile browser tab, lock everything and require adding to Home Screen
  if (isMobile && !isStandalone) {
    return <MandatoryInstallScreen />;
  }

  const { isAuthenticated, currentUser, isLoading, updateUserSettings } = useAuth();
  const isRestoring = useIsRestoring();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const routerState = useRouterState();
  const navigate = useNavigate();
  const createMutation = useCreateExpenseMutation(currentUser?.id || '');

  const handleAddExpense = async (amount: number, note?: string, storeId?: string) => {
    if (!currentUser) return;
    await createMutation.mutateAsync({
      amount,
      category: 'other',
      storeId: storeId || 'pyaterochka',
      title: note || 'Покупка продуктов',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const isSkeletonPreview = typeof window !== 'undefined' && window.location.search.includes('skeleton=true');
  const path = routerState.location.pathname;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const mainEl = document.getElementById('app-main-view');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [path]);

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
  let activeTab: ActiveNavTab = 'dashboard';
  if (path.startsWith('/family')) {
    activeTab = 'family';
  } else if (path.startsWith('/analytics')) {
    activeTab = 'analytics';
  }

  const handleTabChange = (tab: ActiveNavTab) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const mainEl = document.getElementById('app-main-view');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' });
    }
    navigate({ to: `/${tab}` as any });
  };

  const curr = CURRENCIES[currentUser.profile?.currency || 'RUB'] || CURRENCIES.RUB;
  const userStores = POPULAR_STORES.filter(s => currentUser.profile?.favoriteStores?.includes(s.id));

  return (
    <div className="min-h-screen min-h-dvh min-w-[375px] flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation Bar */}
      <TopNavbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Content Area with bottom clearance for MobileBottomBar */}
      <main id="app-main-view" className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-36 md:pb-8 flex flex-col items-center">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Dock (md:hidden) */}
      <MobileBottomBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddExpense={() => setShowAddExpenseModal(true)}
      />

      {/* Global Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        currency={curr}
        onAddExpense={handleAddExpense}
        userStores={userStores}
      />

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
