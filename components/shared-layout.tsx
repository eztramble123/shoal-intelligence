'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SharedLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export function SharedLayout({ children, currentPage }: SharedLayoutProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/');
    } else {
      router.push(`/${page}`);
    }
  };

  const navigationItems = [
    { icon: "/dashboard.svg", label: "Dashboard", path: 'dashboard', isActive: currentPage === 'dashboard' },
    { icon: "/file.svg", label: "Listings Parity Analysis", path: 'token-matrix', isActive: currentPage === 'token-matrix' },
    { icon: "/lightbulb.svg", label: "Venture Intelligence", path: 'venture-intelligence', isActive: currentPage === 'venture-intelligence' },
    { icon: "/split_arrow.svg", label: "Recent Listings", path: 'listings-feed', isActive: currentPage === 'listings-feed' }
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
              <Image src={item.icon} alt={item.label} width={20} height={20} />
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
            justifyContent: 'center',
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