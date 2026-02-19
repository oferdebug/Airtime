'use client';

import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { type ChangeEvent, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEFAULT_DURATION_SECONDS = 58 * 60 + 12;

function formatTimestamp(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function PlayerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const duration = DEFAULT_DURATION_SECONDS;
  const [currentTime, setCurrentTime] = useState(34 * 60 + 22);
  const [volume, setVolume] = useState(67);

  const progressPercent = useMemo(
    () => Math.min(100, Math.max(0, (currentTime / duration) * 100)),
    [currentTime, duration],
  );

  const togglePlayPause = () => {
    setIsPlaying((current) => !current);
  };

  const handleSkipBack = () => {
    setCurrentTime((current) => Math.max(0, current - 15));
  };

  const handleSkipForward = () => {
    setCurrentTime((current) => Math.min(duration, current + 15));
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const nextPercent = Number(event.target.value);
    setCurrentTime((nextPercent / 100) * duration);
  };

  const formatDurationBadge = (value: number) => {
    const formattedDuration = formatTimestamp(value);
    return value >= 3600 ? formattedDuration : formattedDuration.slice(3);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Episode Player</h1>
        <p className="text-muted-foreground mt-1">
          Play and review your episode with transcript context.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>The Future of AI in Podcasting</CardTitle>
            <Badge variant="outline">{formatDurationBadge(duration)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="h-20 rounded-xl border border-border bg-muted/40 overflow-hidden relative">
            <div className="absolute inset-0 opacity-70 bg-[linear-gradient(90deg,transparent_0%,rgba(139,92,246,0.3)_35%,transparent_70%)] animate-pulse" />
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Waveform preview ({Math.round(progressPercent)}%)
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progressPercent}
            onChange={handleSeek}
            className="w-full accent-primary"
            aria-label="Seek playback position"
          />
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Skip back 15 seconds"
              title="Skip back 15 seconds"
              onClick={handleSkipBack}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Skip forward 15 seconds"
              title="Skip forward 15 seconds"
              onClick={handleSkipForward}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-primary"
              aria-label="Adjust volume"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
