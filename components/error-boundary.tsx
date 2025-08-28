'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  errorInfo?: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service (e.g., Sentry, LogRocket)
      console.error('Production error logged:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      padding: '20px'
    }}>
      <Alert variant="destructive" style={{ maxWidth: '500px' }}>
        <AlertTriangle style={{ width: '16px', height: '16px' }} />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          <p style={{ marginBottom: '12px' }}>
            {error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={resetError}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            Try Again
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Specialized error fallback for dashboard components
export const DashboardErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => {
  return (
    <div style={{
      background: '#1A1B1E',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #212228',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <AlertTriangle style={{ width: '32px', height: '32px', color: '#ef4444', marginBottom: '16px' }} />
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
        Data Unavailable
      </h3>
      <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', marginBottom: '16px' }}>
        Unable to load this section. This might be due to a temporary data outage.
      </p>
      <button
        onClick={resetError}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2563eb';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#3b82f6';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <RefreshCw style={{ width: '14px', height: '14px' }} />
        Retry
      </button>
    </div>
  );
};

export default ErrorBoundary;