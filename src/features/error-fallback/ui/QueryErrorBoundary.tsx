import React, { ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, ErrorBoundaryProps } from '../../../shared/ui/error-boundary';
import { ErrorFallbackCard } from './ErrorFallbackCard';

export interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ErrorBoundaryProps['fallback'];
  onReset?: () => void;
  title?: string;
  subtitle?: string;
  variant?: 'page' | 'widget';
}

/**
 * Feature Error Boundary integrated with TanStack Query.
 * Automatically clears query error state when the user clicks 'Retry'.
 */
export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  fallback,
  onReset,
  title,
  subtitle,
  variant = 'widget',
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={() => {
            reset();
            if (onReset) onReset();
          }}
          fallback={
            fallback ||
            ((error, resetFn) => (
              <ErrorFallbackCard
                error={error}
                resetErrorBoundary={resetFn}
                title={title}
                subtitle={subtitle}
                variant={variant}
              />
            ))
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
