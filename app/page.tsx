'use client';

import { useState, useEffect, useRef } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [watchlistSearchTerm, setWatchlistSearchTerm] = useState('');

  const drawMiniChart = (canvasId: string, color: string, trend: 'up' | 'down' | 'neutral' = 'neutral') => {
    const canvas = canvasRefs.current[canvasId];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';
    ctx.scale(2, 2);

    // Generate random data with trend
    const points = 50;
    const data = [];
    let lastValue = 50;
    
    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * 8;
      const trendFactor = trend === 'up' ? 0.2 : trend === 'down' ? -0.2 : 0;
      lastValue = Math.max(20, Math.min(80, lastValue + change + trendFactor));
      data.push(lastValue);
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw the line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const stepX = canvas.offsetWidth / (points - 1);
    data.forEach((value, i) => {
      const x = i * stepX;
      const y = canvas.offsetHeight - (value / 100) * canvas.offsetHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Add gradient fill for main charts only
    if (canvasId === 'coverageChart' || canvasId === 'ventureChart') {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight);
      gradient.addColorStop(0, color + '30');
      gradient.addColorStop(1, color + '00');
      
      ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight);
      ctx.lineTo(0, canvas.offsetHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  };

  useEffect(() => {
    setTimeout(() => {
      drawMiniChart('coverageChart', '#10b981', 'up');
      drawMiniChart('ventureChart', '#3b82f6', 'neutral');
      drawMiniChart('tokenChart1', '#10b981', 'up');
      drawMiniChart('tokenChart2', '#10b981', 'up');
      drawMiniChart('tokenChart3', '#ef4444', 'down');
      drawMiniChart('tokenChart4', '#10b981', 'up');
    }, 100);

    // Refresh charts periodically
    const chartInterval = setInterval(() => {
      const trends = ['up', 'up', 'down', 'up'];
      const colors = ['#10b981', '#10b981', '#ef4444', '#10b981'];
      
      for (let i = 1; i <= 4; i++) {
        drawMiniChart(`tokenChart${i}`, colors[i-1], trends[i-1]);
      }
    }, 5000);

    return () => clearInterval(chartInterval);
  }, []);

  const navigate = (page: string) => {
    console.log('Navigating to:', page);
  };

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    console.log('Switched to tab:', tab);
  };

  const toggleSelection = (tokenName: string) => {
    console.log('Toggled selection for:', tokenName);
  };

  const watchlistItems = [
    { name: 'Token', ticker: '', id: 'tokenChart1' },
    { name: 'PlaysOut', ticker: '(PLAY)', id: 'tokenChart2' },
    { name: 'Naoris Protocol', ticker: '(NAORIS)', id: 'tokenChart3' },
    { name: 'Towns', ticker: '(TOWNS)', id: 'tokenChart4' }
  ];

  const filteredWatchlistItems = watchlistItems.filter(item =>
    item.name.toLowerCase().includes(watchlistSearchTerm.toLowerCase()) ||
    item.ticker.toLowerCase().includes(watchlistSearchTerm.toLowerCase())
  );

  return (
    <div style={{
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      background: '#14151C',
      color: '#e4e4e7',
      overflowX: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        height: '100vh'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '60px',
          background: '#13141a',
          borderRight: '1px solid #2a2b35',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 0',
          transition: 'width 0.3s ease'
        }} 
        onMouseEnter={(e) => e.currentTarget.style.width = '200px'}
        onMouseLeave={(e) => e.currentTarget.style.width = '60px'}
        >
          {/* Logo */}
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}>
            <img src="/white_shoal.svg" alt="Shoal" style={{ width: '32px', height: '32px' }} />
          </div>

          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            position: 'relative',
            background: '#2a2b35',
            color: '#10b981'
          }} 
          className="active"
          onClick={() => navigate('dashboard')}
          >
            <img src="/dashboard.svg" alt="Dashboard" style={{ width: '20px', height: '20px' }} />
            <span style={{
              position: 'absolute',
              left: '50px',
              whiteSpace: 'nowrap',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              fontSize: '14px',
              background: '#13141a',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #2a2b35'
            }}>Dashboard</span>
          </div>

          {[
              { icon: "/file.svg", label: "Listings Parity Analysis", onClick: () => navigate('token-matrix') },
              { icon: "/lightbulb.svg", label: "Venture Intelligence", onClick: () => navigate('venture-intelligence') },
              { icon: "/split_arrow.svg", label: "Recent Listings", onClick: () => navigate('listings-feed') }
          ].map((item, index) => (
            <div key={index} style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2b35';
              e.currentTarget.style.transform = 'translateX(5px)';
              const span = e.currentTarget.querySelector('span');
              if (span) span.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
              const span = e.currentTarget.querySelector('span');
              if (span) span.style.opacity = '0';
            }}
            onClick={item.onClick}
            >
              <img src={item.icon} alt={item.label} style={{ width: '20px', height: '20px' }} />
              <span style={{
                position: 'absolute',
                left: '50px',
                whiteSpace: 'nowrap',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                fontSize: '14px',
                background: '#13141a',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #2a2b35'
              }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{
            height: '60px',
            background: '#13141a',
            borderBottom: '1px solid #2a2b35',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 30px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#1a1b23',
              borderRadius: '8px',
              padding: '8px 16px',
              width: '400px',
              border: '1px solid #2a2b35',
              transition: 'border 0.3s ease'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input 
                type="text" 
                placeholder="Explore tokens, trends, or listing gaps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e4e4e7',
                  outline: 'none',
                  marginLeft: '10px',
                  width: '100%',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{
              background: '#2a2b35',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a3b45';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2a2b35';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => console.log('Alpha Mode toggled')}
            >
              ⬡ Alpha Mode
            </div>
          </div>

          {/* Dashboard */}
          <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff' }}>
              Main Page
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '30px' }}>
              Crypto analytics dashboard
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '30px',
              marginBottom: '30px'
            }}>
              {/* Listings Parity Analysis */}
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#ffffff' }}>
                  Listings Parity Analysis
                </h2>
                <div style={{
                background: '#1A1B1E',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #212228',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = '#3a3b45';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#212228';
              }}
              >
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                  Token coverage across major exchanges
                </div>
                
                <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '14px', color: '#ffffff' }}>Coverage Rate</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>73%</div>
                  </div>
                  <div style={{ flex: 1, background: '#1a1b23', borderRadius: '8px', height: '8px', position: 'relative' }}>
                    <div style={{ width: '73%', background: '#10b981', height: '100%', borderRadius: '8px' }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #2a2b35',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.paddingLeft = '10px';
                    e.currentTarget.style.margin = '0 -10px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.margin = '0';
                  }}
                  >
                    <span style={{ fontSize: '14px', color: '#ffffff' }}>Missing Tokens</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>47</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.paddingLeft = '10px';
                    e.currentTarget.style.margin = '0 -10px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.margin = '0';
                  }}
                  >
                    <span style={{ fontSize: '14px', color: '#ffffff' }}>Exclusive Listings</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>12</span>
                  </div>
                </div>

                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #2a2b35' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #2a2b35',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.paddingLeft = '10px';
                    e.currentTarget.style.margin = '0 -10px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.margin = '0';
                  }}
                  >
                    <span style={{ fontSize: '14px', color: '#ffffff' }}>
                      ARB <span style={{ color: '#9ca3af', fontSize: '12px' }}>(Arbitrum)</span>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>4/5</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.paddingLeft = '10px';
                    e.currentTarget.style.margin = '0 -10px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.margin = '0';
                  }}
                  >
                    <span style={{ fontSize: '14px', color: '#ffffff' }}>
                      PEPE <span style={{ color: '#9ca3af', fontSize: '12px' }}>(Memecoin)</span>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>3/5</span>
                  </div>
                </div>

                <span style={{
                  display: 'inline-block',
                  marginTop: '16px',
                  color: '#10b981',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  View Full Matrix →
                </span>
                </div>
              </div>

              {/* Venture Intelligence */}
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#ffffff' }}>
                  Venture Intelligence
                </h2>
                <div style={{
                background: '#1A1B1E',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #212228',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = '#3a3b45';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#212228';
              }}
              >
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                  30-day fundraising activity
                </div>
                <div style={{ marginTop: '20px' }}>
                  {[
                    { label: 'Total Raised', value: '$2.8B', isGreen: true },
                    { label: 'Active Deals', value: '187', isGreen: false },
                    { label: 'Avg Round', value: '$15M', isGreen: false }
                  ].map((stat, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 2 ? '1px solid #2a2b35' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a1b23';
                      e.currentTarget.style.paddingLeft = '10px';
                      e.currentTarget.style.margin = '0 -10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.style.margin = '0';
                    }}
                    >
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>{stat.label}</span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: stat.isGreen ? '#10b981' : '#ffffff'
                      }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: '150px', position: 'relative', marginTop: '20px' }}>
                  <canvas 
                    ref={el => canvasRefs.current.ventureChart = el}
                    id="ventureChart" 
                    style={{ width: '100%', height: '100%' }}
                  ></canvas>
                </div>
                <div style={{ marginTop: '20px' }}>
                  {[
                    { label: 'a16z crypto', value: '$485M' },
                    { label: 'Paradigm', value: '$320M' }
                  ].map((investor, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 1 ? '1px solid #2a2b35' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a1b23';
                      e.currentTarget.style.paddingLeft = '10px';
                      e.currentTarget.style.margin = '0 -10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.style.margin = '0';
                    }}
                    >
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>{investor.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>{investor.value}</span>
                    </div>
                  ))}
                </div>
                <span style={{
                  display: 'inline-block',
                  marginTop: '16px',
                  color: '#10b981',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  View Full Report →
                </span>
                </div>
              </div>

              {/* Recent Listings */}
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#ffffff' }}>
                  Recent Listings
                </h2>
                <div style={{
                background: '#1A1B1E',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #212228',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = '#3a3b45';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#212228';
              }}
              >
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                  Live listing activity feed
                </div>
                <div style={{ marginTop: '20px' }}>
                  {[
                    { label: 'New Listings (24h)', value: '47', isGreen: true },
                    { label: 'Active Exchanges', value: '28', isGreen: false },
                    { label: 'Most Listed', value: '$HBAR', isGreen: false }
                  ].map((stat, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #2a2b35',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a1b23';
                      e.currentTarget.style.paddingLeft = '10px';
                      e.currentTarget.style.margin = '0 -10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.style.margin = '0';
                    }}
                    >
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>{stat.label}</span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: stat.isGreen ? '#10b981' : '#ffffff'
                      }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '30px' }}>
                  {[
                    { token: '$HBAR', name: 'Hedera', value: '+5' },
                    { token: '$PHY', name: 'DePHY', value: '+3' },
                    { token: '$TREE', name: 'Tree Protocol', value: '+3' }
                  ].map((listing, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 2 ? '1px solid #2a2b35' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a1b23';
                      e.currentTarget.style.paddingLeft = '10px';
                      e.currentTarget.style.margin = '0 -10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.style.margin = '0';
                    }}
                    >
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>
                        {listing.token} <small style={{ color: '#9ca3af' }}>{listing.name}</small>
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{listing.value}</span>
                    </div>
                  ))}
                </div>
                <span style={{
                  display: 'inline-block',
                  marginTop: '16px',
                  color: '#10b981',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  View Live Feed →
                </span>
                </div>
              </div>

            </div>

            {/* Live Feed Section */}
            <div style={{ marginTop: '30px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '20px', color: '#ffffff' }}>
                Live Listings Feed
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '30px' }}>
                Real-time exchange activity
              </p>
              
              <div style={{
                background: '#1A1B1E',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #212228',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '15px',
                  borderBottom: '1px solid #2a2b35',
                  marginBottom: '25px'
                }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '50px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '15px'
                    }}>SEARCH</span>
                    <input 
                      type="text" 
                      placeholder="Search token name or symbol..."
                      value={watchlistSearchTerm}
                      onChange={(e) => setWatchlistSearchTerm(e.target.value)}
                      style={{
                        background: '#13141a',
                        border: '1px solid #2a2b35',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#e4e4e7',
                        fontSize: '13px',
                        width: '200px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#2a2b35'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '15px'
                    }}>WATCHLIST</span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    'All', 'Infra', 'DeFi', 'CeFi', 'Publicly listed company', 
                    'Crypto Stocks', 'AI', 'Layer1', 'CEX', 'DEX'
                  ].map((tab) => (
                    <button 
                      key={tab}
                      style={{
                        padding: '8px 12px',
                        background: activeTab === tab.toLowerCase() ? '#10b981' : '#1a1b23',
                        border: `1px solid ${activeTab === tab.toLowerCase() ? '#10b981' : '#2a2b35'}`,
                        borderRadius: '6px',
                        color: activeTab === tab.toLowerCase() ? '#13141a' : '#9ca3af',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.3s ease',
                        fontWeight: activeTab === tab.toLowerCase() ? '600' : 'normal',
                        minWidth: '60px'
                      }}
                      onClick={() => switchTab(tab.toLowerCase())}
                      onMouseEnter={(e) => {
                        if (activeTab !== tab.toLowerCase()) {
                          e.currentTarget.style.color = '#e4e4e7';
                          e.currentTarget.style.borderColor = '#3a3b45';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== tab.toLowerCase()) {
                          e.currentTarget.style.color = '#9ca3af';
                          e.currentTarget.style.borderColor = '#2a2b35';
                        }
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                  </div>
                </div>
             
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {filteredWatchlistItems.map((token, index) => (
                  <div key={index} style={{
                    background: 'transparent',
                    padding: '15px 0',
                    borderBottom: index < filteredWatchlistItems.length - 1 ? '1px solid #2a2b35' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#13141a';
                    e.currentTarget.style.padding = '15px';
                    e.currentTarget.style.margin = '0 -15px';
                    e.currentTarget.style.borderRadius = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.padding = '15px 0';
                    e.currentTarget.style.margin = '0';
                    e.currentTarget.style.borderRadius = '0';
                  }}
                  onClick={() => toggleSelection(token.name)}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid #2a2b35',
                      borderRadius: '4px',
                      marginRight: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Checkbox placeholder - could add checked state logic here */}
                    </div>
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#ffffff',
                        minWidth: '300px'
                      }}>
                        {token.name}
                        {token.ticker && (
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginLeft: '8px'
                          }}>{token.ticker}</span>
                        )}
                      </div>
                      <div style={{
                        width: '300px',
                        height: '40px',
                        position: 'relative',
                        marginLeft: '50px'
                      }}>
                        <canvas 
                          ref={el => canvasRefs.current[token.id] = el}
                          style={{ width: '100%', height: '100%' }}
                          id={token.id}
                        ></canvas>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}