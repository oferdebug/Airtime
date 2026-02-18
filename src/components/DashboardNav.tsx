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
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
export default function DashboardNav() {
  const pathname = usePathname();
  const isActive = (path: string) => {
    if (path === '/dashboard/projects') {
      return pathname === path || pathname.startsWith('/dashboard/projects/');
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  return (
    <nav className={'flex items-center gap-2'}>
      <Link href="/dashboard/projects">
        <Button
          variant={'ghost'}
          size={'sm'}
          className={cn(
            'gap-2 transition-all duration-300 font-medium',
            isActive('/dashboard/projects')
              ? 'bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20'
              : 'text-white/80 hover:bg-brand-50/10 hover:scale-105',
          )}
        >
          <FolderOpen className={'h-4 w-4'} />
          <span className={'hidden xl:inline'}>Library</span>
        </Button>
      </Link>
      <Link href={'/dashboard/search'}>
        <Button
          variant={'ghost'}
          size={'sm'}
          className={cn(
            'gap-2 transition-all duration-300 font-medium',
            isActive('/dashboard/search')
              ? 'bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20'
              : 'text-white/80 hover:bg-brand-50/10 hover:scale-105',
          )}
        >
          <Search className={'h-4 w-4'} />
          <span className={'hidden xl:inline'}>Search</span>
        </Button>
      </Link>
      <Link href={'/dashboard/studio'}>
        <Button
          variant={'ghost'}
          size={'sm'}
          className={cn(
            'gap-2 transition-all duration-300 font-medium',
            isActive('/dashboard/studio')
              ? 'bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20'
              : 'text-white/80 hover:bg-brand-50/10 hover:scale-105',
          )}
        >
          <Sparkles className={'h-4 w-4'} />
          <span className={'hidden xl:inline'}>Studio</span>
        </Button>
      </Link>
      <Link href={'/dashboard/uploads'}>
        <Button
          variant={'ghost'}
          size={'sm'}
          className={cn(
            'gap-2 transition-all duration-300 font-medium',
            isActive('/dashboard/uploads')
              ? 'bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20'
              : 'text-white/80 hover:bg-brand-50/10 hover:scale-105',
          )}
        >
          <Upload className={'h-4 w-4'} />
          <span className={'hidden xl:inline'}>Upload</span>
        </Button>
      </Link>
      <Link href={'/dashboard/player'}>
        <Button
          variant={'ghost'}
          size={'sm'}
          className={cn(
            'gap-2 transition-all duration-300 font-medium',
            isActive('/dashboard/player')
              ? 'bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20'
              : 'text-white/80 hover:bg-brand-50/10 hover:scale-105',
          )}
        >
          <PlayCircle className={'h-4 w-4'} />
          <span className={'hidden xl:inline'}>Player</span>
        </Button>
      </Link>
      <Link href={'/dashboard/settings'}>
        <Button
          variant={'ghost'}
          size={'sm'}
          className={cn(
            'gap-2 transition-all duration-300 font-medium',
            isActive('/dashboard/settings')
              ? 'bg-brand-50/10 text-white hover:bg-brand-50/20 hover:scale-105 shadow-lg border border-brand-50/20'
              : 'text-white/80 hover:bg-brand-50/10 hover:scale-105',
          )}
        >
          <Settings className={'h-4 w-4'} />
          <span className={'hidden xl:inline'}>Settings</span>
        </Button>
      </Link>
    </nav>
  );
}
