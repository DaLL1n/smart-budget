import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from '../entities/user';
import { QueryErrorBoundary } from '../features/error-fallback';
import { router } from './router/router';

export function App() {
  return (
    <QueryProvider>
      <QueryErrorBoundary 
        variant="page"
        title="Критический сбой приложения"
        subtitle="Произошла непредвиденная ошибка на уровне ядра приложения. Попробуйте нажать кнопку повтора или обновить страницу."
      >
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryErrorBoundary>
    </QueryProvider>
  );
}

export default App;
