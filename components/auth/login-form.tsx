'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import Image from "next/image"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  return (
    <div 
      className={cn("flex flex-col gap-6", className)} 
      {...props}
      style={{
        minHeight: '100vh',
        background: '#14151C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Card 
        className="overflow-hidden p-0"
        style={{
          background: '#1A1B1E',
          border: '1px solid #212228',
          maxWidth: '900px',
          width: '100%'
        }}
      >
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <div style={{ marginBottom: '12px' }}>
                  <Image src="/white_shoal.svg" alt="Shoal Intelligence" width={48} height={48} />
                </div>
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: '#e4e4e7' }}
                >
                  Welcome back
                </h1>
                <p 
                  className="text-balance"
                  style={{ color: '#9ca3af' }}
                >
                  Login to your Shoal Intelligence account
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email" style={{ color: '#e4e4e7' }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  style={{
                    background: '#212228',
                    border: '1px solid #2a2b35',
                    color: '#e4e4e7'
                  }}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password" style={{ color: '#e4e4e7' }}>Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                    style={{ color: '#9ca3af' }}
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  style={{
                    background: '#212228',
                    border: '1px solid #2a2b35',
                    color: '#e4e4e7'
                  }}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none'
                }}
              >
                Login
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span 
                  className="relative z-10 px-2"
                  style={{ 
                    background: '#1A1B1E', 
                    color: '#9ca3af' 
                  }}
                >
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  style={{
                    background: '#212228',
                    border: '1px solid #2a2b35',
                    color: '#e4e4e7'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
              <div className="text-center text-sm" style={{ color: '#9ca3af' }}>
                Don&apos;t have an account?{" "}
                <a href="#" className="underline underline-offset-4" style={{ color: '#10b981' }}>
                  Sign up
                </a>
              </div>
            </div>
          </form>
          <div 
            className="relative hidden md:block"
            style={{ 
              background: 'linear-gradient(135deg, #1A1B1E 0%, #212228 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ 
              textAlign: 'center',
              padding: '40px',
              color: '#e4e4e7'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                Crypto Intelligence
              </h3>
              <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
                Access real-time crypto analytics, listing parity analysis, and venture intelligence data from the most comprehensive blockchain data platform.
              </p>
              <div style={{ marginTop: '32px', opacity: 0.1 }}>
                <Image src="/white_shoal.svg" alt="" width={120} height={120} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div 
        className="text-center text-xs text-balance"
        style={{ color: '#9ca3af' }}
      >
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4" style={{ color: '#10b981' }}>
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4" style={{ color: '#10b981' }}>
          Privacy Policy
        </a>
        .
      </div>
    </div>
  )
}