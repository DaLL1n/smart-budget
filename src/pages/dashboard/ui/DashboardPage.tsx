import React from 'react';
import { DashboardOverview } from '../../../widgets/dashboard-overview';
import { QueryErrorBoundary } from '../../../features/error-fallback';

export const DashboardPage: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center animate-fade-in">
      <QueryErrorBoundary
        variant="widget"
        title="Сбой панели управления"
        subtitle="Не удалось загрузить данные дашборда. Нажмите кнопку повтора — навигация и другие страницы доступны."
      >
        <DashboardOverview />
      </QueryErrorBoundary>
    </div>
  );
};
