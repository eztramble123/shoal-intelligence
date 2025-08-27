'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ComingSoonPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/');
  };

  const handleContactGabe = () => {
    window.location.href = 'mailto:gabe@shoalresearch.xyz';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0b0f 0%, #14151a 100%)',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background overlay for data flow effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 50%, rgba(95, 100, 242, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 70% 50%, rgba(95, 100, 242, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      {/* Navigation Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 10,
        width: '100%'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '-0.5px',
          color: '#F3F4F6'
        }}>
          <Image src="/logo.png" alt="Shoal Intelligence" width={28} height={28} />
          SHOAL INTELLIGENCE
        </div>

        {/* Back Button */}
        <button
          onClick={handleGoBack}
          style={{
            padding: '10px 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Back to Home
        </button>
      </header>

      {/* Main Content */}
      <section style={{
        padding: '80px 40px',
        textAlign: 'center',
        position: 'relative',
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Background image covering entire section */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/mainbg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.2,
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        
        {/* Content wrapper with higher z-index */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#1F2937',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '100px',
            marginBottom: '32px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: '#F59E0B',
              borderRadius: '50%',
              display: 'inline-block'
            }}></span>
            <span style={{
              fontSize: '14px',
              color: '#ffffff',
              fontWeight: '500'
            }}>
              Platform in Development
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            lineHeight: '1.1',
            marginBottom: '24px',
            letterSpacing: '-1px',
            background: 'linear-gradient(180deg, #ffffff 0%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Coming Soon
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '20px',
            color: '#D1D5DB',
            lineHeight: '1.5',
            marginBottom: '32px'
          }}>
            We&apos;re putting the finishing touches on Shoal Intelligence. Our institutional-grade digital asset platform will be available soon.
          </p>

          {/* Email Contact */}
          <p style={{
            fontSize: '16px',
            color: '#9CA3AF',
            marginBottom: '32px'
          }}>
            Interested in early access or have questions?
          </p>

          {/* Contact Button */}
          <button
            onClick={handleContactGabe}
            style={{
              padding: '14px 32px',
              background: '#5F64F2',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '24px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#818CF8';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(95, 100, 242, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5F64F2';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Contact Gabe
          </button>

          {/* Email Address */}
          <div style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '48px'
          }}>
            <a
              href="mailto:gabe@shoalresearch.xyz"
              style={{
                color: '#9CA3AF',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#5F64F2'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
            >
              gabe@shoalresearch.xyz
            </a>
          </div>

          {/* Progress Indicators */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginTop: '48px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#10B981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '20px'
              }}>
                ✓
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#D1D5DB',
                marginBottom: '4px'
              }}>
                Data Collection
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF'
              }}>
                Complete
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#F59E0B',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '20px'
              }}>
                ⚡
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#D1D5DB',
                marginBottom: '4px'
              }}>
                Platform Development
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF'
              }}>
                In Progress
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#374151',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '20px',
                color: '#6B7280'
              }}>
                🚀
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#D1D5DB',
                marginBottom: '4px'
              }}>
                Launch
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF'
              }}>
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}