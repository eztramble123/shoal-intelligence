import { ReactNode } from 'react';

interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  height?: string;
}

export function ChartWrapper({ 
  title, 
  subtitle, 
  actions, 
  children, 
  className = '', 
  height = 'h-80' 
}: ChartWrapperProps) {
  return (
    <div className={`dashboard-card ${className}`}>
      {(title || subtitle || actions) && (
        <div className="dashboard-card-header">
          <div>
            {title && <h3 className="dashboard-card-title">{title}</h3>}
            {subtitle && <p className="dashboard-card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={`${height} w-full`}>
        {children}
      </div>
    </div>
  );
}