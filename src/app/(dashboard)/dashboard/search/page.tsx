'use client';

import { Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  timestamp: string;
}

const sampleResults: SearchResult[] = [
  {
    id: 'episode-24-pricing-growth-loops',
    title: 'Episode 24 - Pricing Growth Loops',
    snippet:
      '…we tested three pricing tiers and saw conversion lift at week 6…',
    timestamp: '12:40',
  },
  {
    id: 'episode-18-founder-sales',
    title: 'Episode 18 - Founder Sales',
    snippet: '…cold outreach worked once we personalized opening hooks…',
    timestamp: '31:12',
  },
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return sampleResults;
    }
    return sampleResults.filter(
      (result) =>
        result.title.toLowerCase().includes(term) ||
        result.snippet.toLowerCase().includes(term),
    );
  }, [searchTerm]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Magic Search</h1>
        <p className="text-muted-foreground mt-1">
          Ask questions across your podcast library.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Search Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Semantic</Badge>
            <Badge variant="outline">Transcript</Badge>
            <Badge variant="outline">Social posts</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Find episodes discussing pricing strategy..."
              aria-label="Search episodes"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Start typing to search episodes, transcripts, and generated
            insights.
          </p>

          <div className="pt-2">
            <ul className="space-y-3">
              {filteredResults.map((result) => (
                <li
                  key={result.id}
                  className="rounded-xl border border-border bg-card/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{result.title}</p>
                    <Badge
                      aria-label={`Episode timestamp: ${result.timestamp}`}
                    >
                      {result.timestamp}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {result.snippet}
                  </p>
                </li>
              ))}
            </ul>
            {filteredResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matching episodes found for &quot;{searchTerm}&quot;.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
