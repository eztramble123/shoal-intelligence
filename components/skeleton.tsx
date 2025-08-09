import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className,
  style
}) => {
  const skeletonStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, #1a1b23 25%, #2a2b35 50%, #1a1b23 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    ...style
  };

  return (
    <>
      <style jsx>{`
        @keyframes skeleton-pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      <div style={skeletonStyle} className={className} />
    </>
  );
};

// Card skeleton component
export const CardSkeleton: React.FC<{ 
  children?: React.ReactNode; 
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div style={{
    background: '#1A1B1E',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #212228',
    ...style
  }}>
    {children}
  </div>
);

// Stats grid skeleton
export const StatsGridSkeleton: React.FC = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{
        background: '#13141a',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #2a2b35'
      }}>
        <Skeleton height="12px" width="60%" style={{ marginBottom: '8px' }} />
        <Skeleton height="24px" width="40%" style={{ marginBottom: '4px' }} />
        <Skeleton height="12px" width="30%" />
      </div>
    ))}
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 6 }) => (
  <div style={{
    background: '#13141a',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #2a2b35'
  }}>
    {/* Header */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px',
      padding: '12px 16px',
      background: '#1a1b23',
      borderBottom: '1px solid #2a2b35'
    }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height="12px" width="80%" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px',
        padding: '12px 16px',
        borderBottom: rowIndex < rows - 1 ? '1px solid #2a2b35' : 'none'
      }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex}>
            <Skeleton height="14px" width={colIndex === 0 ? '90%' : '60%'} style={{ marginBottom: '4px' }} />
            {colIndex === 0 && <Skeleton height="10px" width="40%" />}
          </div>
        ))}
      </div>
    ))}
  </div>
);

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '200px' }) => (
  <div style={{
    background: '#13141a',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #2a2b35',
    height
  }}>
    <Skeleton height="16px" width="40%" style={{ marginBottom: '16px' }} />
    <div style={{
      display: 'flex',
      alignItems: 'end',
      gap: '4px',
      height: '80%'
    }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton 
          key={i} 
          width="100%" 
          height={`${Math.random() * 60 + 20}%`} 
          borderRadius="2px"
        />
      ))}
    </div>
  </div>
);