'use client';

import {
  FolderOpen,
  PlayCircle,
  Search,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface NavItemConfig {
  href: string;
  icon: ReactNode;
  label: string;
}

export default function DashboardNav() {
  const pathname = usePathname();
  const isActive = (path: string) => {
    if (path === '/dashboard/projects') {
      return pathname === path || pathname.startsWith('/dashboard/projects/');
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const NavItem = ({ href, icon, label }: NavItemConfig) => (
    <Link href={href}>
      <Button
        variant={'ghost'}
        size={'sm'}
        className={cn(
          'gap-2 transition-all duration-300 font-medium',
          isActive(href)
            ? 'bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20'
            : 'text-white/80 hover:bg-brand-50/10 hover:scale-105',
        )}
      >
        {icon}
        <span className={'hidden xl:inline'}>{label}</span>
      </Button>
    </Link>
  );

  const navItems: NavItemConfig[] = [
    { href: '/dashboard/projects', icon: <FolderOpen className={'h-4 w-4'} />, label: 'Library' },
    { href: '/dashboard/search', icon: <Search className={'h-4 w-4'} />, label: 'Search' },
    { href: '/dashboard/studio', icon: <Sparkles className={'h-4 w-4'} />, label: 'Studio' },
    { href: '/dashboard/uploads', icon: <Upload className={'h-4 w-4'} />, label: 'Upload' },
    { href: '/dashboard/player', icon: <PlayCircle className={'h-4 w-4'} />, label: 'Player' },
    { href: '/dashboard/settings', icon: <Settings className={'h-4 w-4'} />, label: 'Settings' },
  ];

  return (
    <nav className={'flex items-center gap-2'}>
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
        />
      ))}
    </nav>
  );
}
