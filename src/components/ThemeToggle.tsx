'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 border-black/20 bg-white text-black hover:bg-black/5 dark:border-white/30 dark:bg-black/30 dark:text-white dark:hover:bg-white/10"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span>Dark Mode</span>
        </>
      )}
    </Button>
  );
}
