'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  Database,
  ExternalLink,
  Info
} from 'lucide-react';
import { ErrorType, type ErrorResponse } from '@/lib/error-utils';

interface ErrorStateProps {
  error?: ErrorResponse | Error | string | null;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

interface DataOutageProps {
  service?: string;
  onRetry?: () => void;
  lastUpdate?: Date;
  className?: string;
}

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

// Main error state component
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
  variant = 'default'
}) => {
  if (!error) return null;

  // Parse error
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : 'message' in error 
    ? error.message 
    : 'An unexpected error occurred';

  const errorType = typeof error === 'object' && error && 'type' in error 
    ? error.type 
    : ErrorType.INTERNAL_SERVER_ERROR;

  const isRetryable = typeof error === 'object' && error && 'retryable' in error 
    ? error.retryable 
    : true;

  // Get appropriate icon and styling based on error type
  const getErrorConfig = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return {
          icon: WifiOff,
          title: 'Connection Problem',
          color: '#f59e0b'
        };
      case ErrorType.EXTERNAL_API_ERROR:
        return {
          icon: ExternalLink,
          title: 'Service Unavailable',
          color: '#ef4444'
        };
      case ErrorType.RATE_LIMIT_ERROR:
        return {
          icon: Clock,
          title: 'Rate Limited',
          color: '#f59e0b'
        };
      case ErrorType.DATABASE_ERROR:
        return {
          icon: Database,
          title: 'Data Access Error',
          color: '#ef4444'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Error',
          color: '#ef4444'
        };
    }
  };

  const config = getErrorConfig(errorType as ErrorType);
  const IconComponent = config.icon;

  // Compact variant for dashboard cards
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <IconComponent 
          style={{ 
            width: '24px', 
            height: '24px', 
            color: config.color, 
            marginBottom: '12px' 
          }} 
        />
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#ffffff', 
          margin: '0 0 4px 0' 
        }}>
          {config.title}
        </h4>
        <p style={{ 
          fontSize: '12px', 
          color: '#9ca3af', 
          margin: '0 0 12px 0',
          lineHeight: '1.4'
        }}>
          {errorMessage}
        </p>
        {isRetryable && onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: config.color,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <RefreshCw style={{ width: '12px', height: '12px' }} />
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  // Inline variant for small spaces
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 p-2 ${className}`}>
        <IconComponent style={{ width: '16px', height: '16px', color: config.color }} />
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {errorMessage}
        </span>
        {isRetryable && onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'none',
              border: 'none',
              color: config.color,
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'underline',
              padding: '2px 4px'
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <Alert variant="destructive" className={className}>
      <IconComponent style={{ width: '16px', height: '16px' }} />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription>
        <p style={{ marginBottom: isRetryable && onRetry ? '12px' : '0' }}>
          {errorMessage}
        </p>
        {isRetryable && onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: config.color,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            {retryLabel}
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Specialized data outage component
export const DataOutageState: React.FC<DataOutageProps> = ({
  service = 'data service',
  onRetry,
  lastUpdate,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '50%',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <Database style={{ width: '32px', height: '32px', color: '#ef4444' }} />
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#ffffff',
        margin: '0 0 8px 0'
      }}>
        Data Temporarily Unavailable
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#9ca3af',
        margin: '0 0 8px 0',
        lineHeight: '1.5'
      }}>
        We&apos;re experiencing issues connecting to our {service}. This is likely temporary.
      </p>
      
      {lastUpdate && (
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: '0 0 16px 0'
        }}>
          Last successful update: {lastUpdate.toLocaleString()}
        </p>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} />
          Retry Connection
        </button>
      )}
      
      <div style={{
        marginTop: '24px',
        padding: '12px 16px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Info style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#3b82f6' }}>
            What you can do:
          </span>
        </div>
        <ul style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: '0',
          paddingLeft: '18px',
          lineHeight: '1.4'
        }}>
          <li>Check your internet connection</li>
          <li>Try refreshing the page</li>
          <li>Contact support if the issue persists</li>
        </ul>
      </div>
    </div>
  );
};

// Network error component
export const NetworkErrorState: React.FC<NetworkErrorProps> = ({
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <WifiOff style={{ 
        width: '32px', 
        height: '32px', 
        color: '#f59e0b', 
        marginBottom: '16px' 
      }} />
      
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#ffffff',
        margin: '0 0 8px 0'
      }}>
        Connection Problem
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#9ca3af',
        margin: '0 0 16px 0',
        lineHeight: '1.4'
      }}>
        Unable to connect to our servers. Please check your internet connection.
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d97706';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f59e0b';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Wifi style={{ width: '14px', height: '14px' }} />
          Reconnect
        </button>
      )}
    </div>
  );
};

// Empty state component (when no data, not an error)
export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({
  title = 'No Data Available',
  description = 'There is no data to display at this time.',
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div style={{
        background: 'rgba(156, 163, 175, 0.1)',
        borderRadius: '50%',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <Info style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
      </div>
      
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#ffffff',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#9ca3af',
        margin: '0 0 16px 0',
        lineHeight: '1.4'
      }}>
        {description}
      </p>
      
      {action && action}
    </div>
  );
};