import React from 'react';
import { FamilySpaceWidget } from '../../../widgets/family-space';
import { QueryErrorBoundary } from '../../../features/error-fallback';

export const FamilyPage: React.FC = () => {
  return (
    <div className="w-full">
      <QueryErrorBoundary
        variant="widget"
        title="Сбой в семейном пространстве"
        subtitle="Не удалось отобразить данные семьи. Попробуйте нажать кнопку повтора — остальные разделы приложения работают в штатном режиме."
      >
        <FamilySpaceWidget />
      </QueryErrorBoundary>
    </div>
  );
};
