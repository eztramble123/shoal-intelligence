import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
    label?: string;
  };
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, change, icon, className = '' }: MetricCardProps) {
  return (
    <div className={`dashboard-metric-card ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="dashboard-metric-label">{label}</div>
        {icon && <div className="text-[var(--dashboard-text-muted)]">{icon}</div>}
      </div>
      <div className="dashboard-metric-value">{value}</div>
      {change && (
        <div className={`dashboard-metric-change ${change.type}`}>
          {change.type === 'positive' && <TrendingUp className="dashboard-icon-sm inline mr-1" />}
          {change.type === 'negative' && <TrendingDown className="dashboard-icon-sm inline mr-1" />}
          {change.value}
          {change.label && <span className="ml-1">{change.label}</span>}
        </div>
      )}
    </div>
  );
}