'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const categories = [
  'Technology',
  'Marketing',
  'Business',
  'Education',
  'Health',
  'Comedy',
  'News',
  'Science',
];

export default function OnboardingStepOnePage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('airtime-onboarding-categories');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSelectedCategories(
          parsed.filter((item): item is string => typeof item === 'string'),
        );
      }
    } catch {
      // Ignore malformed localStorage values; user can re-select categories.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'airtime-onboarding-categories',
      JSON.stringify(selectedCategories),
    );
  }, [selectedCategories]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleContinue = () => {
    localStorage.setItem(
      'airtime-onboarding-categories',
      JSON.stringify(selectedCategories),
    );
    router.push('/onboarding/step-2');
  };

  return (
    <main className="min-h-screen mesh-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-3xl glass-card-strong rounded-3xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Badge className="w-fit">Step 1 of 2</Badge>
            <div className="flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-primary/40" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Personalize Your Experience
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Choose your podcast interests so Airtime can tailor recommendations.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleCategory(category)}
                  className={`rounded-xl border px-3 py-2 text-sm transition-colors flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card/70 hover:border-primary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 opacity-80" />
                  {category}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <Button asChild variant="ghost">
              <Link href="/">Skip for now</Link>
            </Button>
            <Button onClick={handleContinue}>Continue</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
