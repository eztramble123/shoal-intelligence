'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/coming-soon');
  };

  const handleGetStarted = () => {
    router.push('/coming-soon');
  };

  const handleContactSales = () => {
    // Could open a modal or navigate to contact form
    window.location.href = 'mailto:sales@shoalintelligence.com';
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

        {/* Value Props */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px'
        }}>
          <span style={{
            fontSize: '14px',
            color: '#9CA3AF',
            fontWeight: '500'
          }}>
            Real-time Intelligence
          </span>
          <span style={{
            fontSize: '14px',
            color: '#9CA3AF',
            fontWeight: '500'
          }}>
            Institutional Grade
          </span>
          <span style={{
            fontSize: '14px',
            color: '#9CA3AF',
            fontWeight: '500'
          }}>
            Market Surveillance
          </span>
        </div>

        {/* CTA Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid rgba(95, 100, 242, 0.4)',
              borderRadius: '8px',
              color: '#5F64F2',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(95, 100, 242, 0.1)';
              e.currentTarget.style.borderColor = '#5F64F2';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(95, 100, 242, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Early Access
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '40px 40px 60px',
        textAlign: 'center',
        position: 'relative',
        minHeight: 'calc(100vh - 70px)'
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
          opacity: 0.3,
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        
        {/* Content wrapper with higher z-index */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Tagline Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#1F2937',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '100px',
            marginBottom: '24px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: '#10B981',
              borderRadius: '50%',
              display: 'inline-block'
            }}></span>
            <span style={{
              fontSize: '14px',
              color: '#ffffff',
              fontWeight: '500'
            }}>
              Enterprise-Ready Intelligence Platform • 500 Founding Analysts
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: '52px',
            fontWeight: '700',
            lineHeight: '1.1',
            marginBottom: '20px',
            letterSpacing: '-1px',
            background: 'linear-gradient(180deg, #ffffff 0%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Institutional-Grade<br />
            Digital Asset Intelligence
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '18px',
            color: '#D1D5DB',
            lineHeight: '1.4',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            Track digital asset listings, competitive intelligence, research and news powering decision making.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleGetStarted}
            style={{
              padding: '12px 28px',
              background: '#5F64F2',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
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
            Apply for Access
          </button>

          {/* Enterprise Link */}
          <div style={{
            fontSize: '14px',
            color: '#E5E7EB'
          }}>
            Looking for an enterprise solution?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleContactSales();
              }}
              style={{
                color: '#ffffff',
                textDecoration: 'underline',
                cursor: 'pointer',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#5F64F2'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
            >
              Contact Sales
            </a>
          </div>

          {/* Stats Section - Floating within hero */}
          <div style={{
            maxWidth: '1200px',
            margin: '60px auto 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '40px',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Stat 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                marginBottom: '4px',
                color: '#5F64F2'
              }}>
                $2.8B
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '2px',
                color: '#D1D5DB'
              }}>
                Assets Tracked
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF'
              }}>
                Institutional portfolios monitored
              </div>
            </div>

            {/* Stat 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                marginBottom: '4px',
                color: '#5F64F2'
              }}>
                500+
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '2px',
                color: '#D1D5DB'
              }}>
                Daily Insights
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF'
              }}>
                Market signals and alerts
              </div>
            </div>

            {/* Stat 3 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                marginBottom: '4px',
                color: '#5F64F2'
              }}>
                24/7
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '2px',
                color: '#D1D5DB'
              }}>
                Monitoring
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF'
              }}>
                Real-time market surveillance
              </div>
            </div>

            {/* Stat 4 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                marginBottom: '4px',
                color: '#5F64F2'
              }}>
                100+
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '2px',
                color: '#D1D5DB'
              }}>
              Data Sources
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF'
              }}>
                Exchanges, news, and analytics
              </div>
            </div>
          </div>

          {/* Partners Section - Also in hero */}
          <div style={{
            marginTop: '60px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <p style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px'
            }}>
              The world's most advanced intelligence platform for analysts and institutional decision-makers, including
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: '0.6'
            }}>
              <Image src="/image.png" alt="Partner Companies" width={600} height={80} />
            </div>
          </div>
        </div> {/* End of content wrapper */}
      </section>
    </div>
  );
}