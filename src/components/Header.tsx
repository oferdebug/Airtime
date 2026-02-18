'use client';

// biome-ignore assist/source/organizeImports: Custom organization preferred for imports
import Link from 'next/link';
import Image from 'next/image';
import { Protect, useAuth, UserButton } from '@clerk/nextjs';
import { Crown, Home, Mic2, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import DashboardNav from './DashboardNav';
import ThemeToggle from './ThemeToggle';

export function Header() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const showDashboardNav = isDashboard;

  return (
    <header
      className={
        isDashboard
          ? 'gradient-brand sticky top-0 transition-all shadow-xxl backdrop-blur-sm z-50 border-b border-white/15'
          : 'glass-nav sticky top-0 transition-all z-50 backdrop-blur-md border-b border-brand-200/50 shadow-sm'
      }
    >
      <div className="container mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center gap-4 lg:gap-9">
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-all duration-400 group"
            >
              <div
                className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                  isDashboard
                    ? 'bg-white/90 group-hover:bg-white group-hover:scale-105 group-hover:shadow-xl transition-all duration-300'
                    : 'p-2 rounded-xl bg-white/95 group-hover:bg-white group-hover:scale-115 group-hover:shadow-xl transition-all duration-300'
                }`}
              >
                <Image
                  src="/assets/airtime-icon-clean.svg"
                  alt="Airtime"
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0"
                />
                <span
                  className="text-xl font-bold tracking-tight text-black"
                >
                  Airtime
                </span>
                <Mic2
                  className={
                    isDashboard
                      ? 'h-6 w-6 text-brand-700 group-hover:rotate-12 transition-transform duration-300'
                      : 'h-6 w-6 text-brand-700 group-hover:rotate-12 transition-transform duration-300'
                  }
                />
              </div>
            </Link>

            {/* Dashboard Navigation */}
            {isDashboard && (
              <div className="flex items-center pl-3 sm:pl-5">
                <DashboardNav />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 lg:gap-3">
            <ThemeToggle />
            {isSignedIn ? (
              <>
                {/* Show Upgrade to Pro If The User Is In The Free Plan */}
                <Protect
                  condition={(has) =>
                    !has({ plan: 'pro' }) && !has({ plan: 'ultra' })
                  }
                  fallback={null}
                >
                  <Link
                    href="/dashboard/upgrade"
                    className={
                      isDashboard
                        ? 'flex items-center px-4 py-2 rounded-full bg-white/90 text-brand-600 hover:bg-white hover:scale-110 gap-3 shadow-lg font-semibold transition-all duration-300 border border-white/30'
                        : 'flex items-center px-4 py-2 rounded-full gradient-brand text-white hover-glow hover:scale-110 gap-3 shadow-lg transition-all duration-300'
                    }
                  >
                    <Zap className="h-5 w-5" />
                    <span className="hidden lg:inline">Upgrade to Pro</span>
                    <span className="lg:hidden">Pro</span>
                  </Link>
                </Protect>
                {/* Show Upgrade To Ultra From Pro Button For Pro Users */}
                <Protect
                  condition={(has) =>
                    has({ plan: 'pro' }) && !has({ plan: 'ultra' })
                  }
                  fallback={null}
                >
                  <Link
                    href="/dashboard/upgrade"
                    className={
                      isDashboard
                        ? 'flex items-center px-4 py-2 rounded-full bg-white/90 text-brand-600 hover:bg-white hover:scale-110 gap-3 shadow-lg font-semibold transition-all duration-300 border border-white/30'
                        : 'flex items-center px-4 py-2 rounded-full gradient-brand text-white hover-glow hover:scale-110 gap-3 shadow-lg transition-all duration-300'
                    }
                  >
                    <Zap className="h-5 w-5" />
                    <span className="hidden lg:inline">Upgrade to Ultra</span>
                    <span className="lg:hidden">Ultra</span>
                  </Link>
                </Protect>
                {/* Ultra Badge For All Ultra Users */}
                <Protect
                  condition={(has) => has({ plan: 'ultra' })}
                  fallback={null}
                >
                  <Badge
                    className={
                      isDashboard
                        ? 'gap-1.5 hidden md:flex bg-white/95 text-brand-600 border-0 px-3 py-1.5 shadow-md hover:shadow-lg transition-all duration-300'
                        : 'gap-1.5 hidden md:flex gradient-brand text-white border-0 px-3 py-1.5 shadow-md hover:shadow-lg transition-all duration-300'
                    }
                  >
                    <Crown className="h-4 w-4" />
                    <span className="hidden sm:inline">Ultra</span>
                  </Badge>
                </Protect>
                {!isDashboard && (
                  <Link href="/dashboard/projects">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover-scale transition-all duration-300"
                    >
                      <span className="hidden lg:inline"> My Projects</span>
                      <span className="lg:hidden">Projects</span>
                    </Button>
                  </Link>
                )}
                {showDashboardNav && (
                  <Link href="/" className="hidden lg:block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        isDashboard
                          ? 'gap-3 hover-scale text-white hover:bg-white/20 transition-all duration-300'
                          : 'gap-3 hover-scale transition-all duration-300'
                      }
                    >
                      <Home className="h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                )}
                <div className="scale-110 hover:scale-125 transition-transform duration-300">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <Link href="/sign-in">
                <Button
                  className={
                    isDashboard
                      ? 'flex items-center px-4 py-2 rounded-full bg-white/90 text-brand-600 hover:bg-white hover:scale-110 gap-3 shadow-lg font-semibold transition-all duration-300 border border-white/30'
                      : 'flex items-center px-4 py-2 rounded-full gradient-brand text-white hover-glow hover:scale-110 gap-3 shadow-lg transition-all duration-300'
                  }
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
