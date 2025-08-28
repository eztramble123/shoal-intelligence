'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

interface SharedLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export function SharedLayout({ children, currentPage }: SharedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/');
    } else {
      router.push(`/${page}`);
    }
  };

  // Map pathname to currentPage value for reliable active state detection
  const getCurrentPage = () => {
    if (pathname === '/') return 'dashboard';
    if (pathname === '/token-matrix') return 'token-matrix';
    if (pathname === '/venture-intelligence') return 'venture-intelligence';  
    if (pathname === '/listings-feed') return 'listings-feed';
    if (pathname === '/pricing') return 'pricing';
    return currentPage; // fallback to prop
  };
  
  const activePage = getCurrentPage();

  const navigationItems = [
    { icon: "/dash.svg", label: "Dashboard", path: 'dashboard', isActive: activePage === 'dashboard' },
    { icon: "/file.svg", label: "Listings Parity Analysis", path: 'token-matrix', isActive: activePage === 'token-matrix' },
    { icon: "/lightbulb.svg", label: "Venture Intelligence", path: 'venture-intelligence', isActive: activePage === 'venture-intelligence' },
    { icon: "/split_arrow.svg", label: "Recent Listings", path: 'listings-feed', isActive: activePage === 'listings-feed' }
  ];

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
          padding: '20px 0'
        }}>
          {/* Logo */}
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}>
            <Image src="/white_shoal.svg" alt="Shoal" width={32} height={32} />
          </div>

          {navigationItems.map((item, index) => (
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
              position: 'relative',
              background: item.isActive ? '#2a2b35' : 'transparent',
              color: item.isActive ? '#10b981' : '#9ca3af'
            }}
            onClick={() => navigate(item.path)}
            onMouseEnter={(e) => {
              if (!item.isActive) {
                e.currentTarget.style.background = '#1a1b23';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!item.isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }
            }}
            >
              <Image src={item.icon} alt={item.label} width={16} height={16} />
            </div>
          ))}

          {/* Spacer to push social links to bottom */}
          <div style={{ flex: 1 }} />

          {/* Social Links Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #2a2b35',
            marginTop: '20px'
          }}>
            {/* Twitter Main */}
            <a
              href="https://x.com/Shoalresearch"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1b23';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.opacity = '0.7';
              }}
              title="Shoal Research Twitter"
            >
              <Image src="/twitter.png" alt="Twitter" width={18} height={18} style={{ filter: 'invert(1)' }} />
            </a>

            {/* Substack */}
            <a
              href="https://www.shoal.gg/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1b23';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.opacity = '0.7';
              }}
              title="Shoal Research Website"
            >
              <Image src="/substack.svg" alt="Website" width={18} height={18} />
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/shoalresearch"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1b23';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.opacity = '0.7';
              }}
              title="Shoal Research Telegram"
            >
              <Image src="/telegram.svg" alt="Telegram" width={18} height={18} />
            </a>

            {/* Twitter News Feed */}
            <a
              href="https://x.com/shoalfeed"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1b23';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.opacity = '0.7';
              }}
              title="Shoal Feed Twitter"
            >
              <Image src="/icons/newspaper.png" alt="Twitter Feed" width={18} height={18} />
            </a>
          </div>
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
            {/* App Title */}
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffffff',
              letterSpacing: '-0.5px'
            }}>
              Shoal Intelligence
            </div>
            
            {/* User Menu */}
            {session?.user && (
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: showUserMenu ? '#1a1b23' : 'transparent',
                    transition: 'background 0.3s ease'
                  }}
                >
                  {session.user.image && (
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      width={24} 
                      height={24} 
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                  <span style={{ color: '#e4e4e7', fontSize: '14px' }}>
                    {session.user.name || session.user.email}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
                
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    marginTop: '8px',
                    background: '#1a1b23',
                    border: '1px solid #2a2b35',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    minWidth: '180px',
                    zIndex: 50
                  }}>
                    <div style={{ padding: '8px 0' }}>
                      <div 
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/profile');
                        }}
                        style={{
                          padding: '8px 16px',
                          color: '#e4e4e7',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2b35'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Profile & Settings
                      </div>
                      <div style={{ 
                        height: '1px', 
                        background: '#2a2b35', 
                        margin: '4px 0' 
                      }} />
                      <div 
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        style={{
                          padding: '8px 16px',
                          color: '#e4e4e7',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2b35'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Sign out
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Page Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}