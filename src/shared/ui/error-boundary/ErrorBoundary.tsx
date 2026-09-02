import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logErrorIncident } from '../../lib/errorLogger';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Universal ErrorBoundary component for React 19.
 * Catches rendering errors, prevents complete app crashes, and logs incidents.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logErrorIncident(error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }
      if (fallback) {
        return fallback;
      }

      // Default minimal fallback if none provided
      return (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-rose-200 space-y-3 m-4">
          <h3 className="text-base font-bold text-white">Произошла непредвиденная ошибка</h3>
          <p className="text-xs text-rose-300 font-mono">{error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return children;
  }
}
