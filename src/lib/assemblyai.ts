type TranscriptWord = {
  word: string;
  start: number;
  end: number;
};

type TranscriptSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: TranscriptWord[];
};

type TranscriptSpeakerSegment = {
  speaker: string;
  start: number;
  end: number;
  text: string;
  confidence?: number;
};

type TranscriptChapter = {
  start: number;
  end: number;
  headline: string;
  summary: string;
  gist: string;
};

export type AssemblyTranscript = {
  text: string;
  segments: TranscriptSegment[];
  speakers?: TranscriptSpeakerSegment[];
  chapters?: TranscriptChapter[];
};

type AssemblyAiWord = {
  text?: string;
  start?: number;
  end?: number;
  confidence?: number;
};

type AssemblyAiSentenceSegment = {
  text?: string;
  start?: number;
  end?: number;
  words?: AssemblyAiWord[];
};

type AssemblyAiUtterance = {
  speaker?: string;
  start?: number;
  end?: number;
  text?: string;
  confidence?: number;
};

type AssemblyAiChapter = {
  start?: number;
  end?: number;
  headline?: string;
  summary?: string;
  gist?: string;
};

type AssemblyAiTranscriptResponse = {
  id?: string;
  status?: string;
  error?: string;
  text?: string;
  words?: AssemblyAiWord[];
  segments?: AssemblyAiSentenceSegment[];
  utterances?: AssemblyAiUtterance[];
  auto_chapters_result?: AssemblyAiChapter[];
};

const BASE_URL = 'https://api.assemblyai.com/v2';
const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 120;
const REQUEST_TIMEOUT_MS = 30_000;
const RATE_LIMIT_MAX_RETRIES = 4;
const RATE_LIMIT_BASE_DELAY_MS = 1_000;
const RATE_LIMIT_BACKOFF_FACTOR = 2;
const WORD_SEGMENT_GAP_MS = 1_500;
const WORD_SEGMENT_MAX_WORDS = 24;
// Prefer the current model first and keep previous model as fallback.
const DEFAULT_SPEECH_MODELS = ['universal-3-pro', 'universal-2'];

type TranscriptionPollingOptions = {
  maxPolls?: number;
  pollIntervalMs?: number;
  backoffFactor?: number;
  maxPollIntervalMs?: number;
  requestTimeoutMs?: number;
  rateLimitMaxRetries?: number;
  rateLimitBaseDelayMs?: number;
  rateLimitBackoffFactor?: number;
};

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithRateLimitRetries(
  url: string,
  init: RequestInit,
  requestTimeoutMs: number,
  transcriptId: string,
  rateLimitBaseDelayMs: number,
  rateLimitBackoffFactor: number,
  maxPollIntervalMs: number,
  rateLimitMaxRetries: number,
): Promise<Response> {
  let rateLimitAttempt = 0;

  while (true) {
    const response = await fetchWithTimeout(
      url,
      init,
      requestTimeoutMs,
      `AssemblyAI poll request timed out for transcript ${transcriptId}`,
    );

    if (response.status === 429) {
      rateLimitAttempt += 1;
      const retryDelayMs = Math.min(
        rateLimitBaseDelayMs * Math.pow(rateLimitBackoffFactor, rateLimitAttempt - 1),
        maxPollIntervalMs,
      );

      console.warn('[assemblyai] Poll request rate-limited; retrying', {
        transcriptId,
        retryAttempt: rateLimitAttempt,
        maxRetries: rateLimitMaxRetries,
        retryDelayMs,
      });

      if (rateLimitAttempt > rateLimitMaxRetries) {
        const body = await response.text();
        throw new Error(
          `AssemblyAI poll failed (429) after ${rateLimitMaxRetries} retries: ${body}`,
        );
      }

      await delay(retryDelayMs);
      continue;
    }

    return response;
  }
}

function requireApiKey(): string {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY is not set');
  }
  return apiKey;
}

async function startTranscription(
  apiKey: string,
  audioUrl: string,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
): Promise<string> {
  const response = await fetchWithTimeout(
    `${BASE_URL}/transcript`,
    {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        speech_models: DEFAULT_SPEECH_MODELS,
        speaker_labels: true,
        auto_chapters: true,
      }),
    },
    requestTimeoutMs,
    'AssemblyAI start request timed out',
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AssemblyAI start failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as AssemblyAiTranscriptResponse;
  if (!data.id) {
    throw new Error('AssemblyAI did not return a transcript id');
  }
  return data.id;
}

async function pollTranscription(
  apiKey: string,
  transcriptId: string,
  options?: TranscriptionPollingOptions,
): Promise<AssemblyAiTranscriptResponse> {
  const maxPolls = options?.maxPolls ?? MAX_POLLS;
  const pollIntervalMs = options?.pollIntervalMs ?? POLL_INTERVAL_MS;
  const backoffFactor = options?.backoffFactor ?? 2;
  const maxPollIntervalMs = options?.maxPollIntervalMs ?? POLL_INTERVAL_MS * 8;
  const requestTimeoutMs = options?.requestTimeoutMs ?? REQUEST_TIMEOUT_MS;
  const rateLimitMaxRetries = options?.rateLimitMaxRetries ?? RATE_LIMIT_MAX_RETRIES;
  const rateLimitBaseDelayMs = options?.rateLimitBaseDelayMs ?? RATE_LIMIT_BASE_DELAY_MS;
  const rateLimitBackoffFactor =
    options?.rateLimitBackoffFactor ?? RATE_LIMIT_BACKOFF_FACTOR;

  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const response = await fetchWithRateLimitRetries(
      `${BASE_URL}/transcript/${transcriptId}`,
      {
        method: 'GET',
        headers: { Authorization: apiKey },
      },
      requestTimeoutMs,
      transcriptId,
      rateLimitBaseDelayMs,
      rateLimitBackoffFactor,
      maxPollIntervalMs,
      rateLimitMaxRetries,
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AssemblyAI poll failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as AssemblyAiTranscriptResponse;
    if (data.status === 'completed') {
      return data;
    }
    if (data.status === 'error') {
      throw new Error(data.error || 'AssemblyAI transcription failed');
    }

    const delayMs = Math.min(
      pollIntervalMs * Math.pow(backoffFactor, attempt),
      maxPollIntervalMs,
    );
    await delay(delayMs);
  }

  throw new Error('AssemblyAI transcription timed out');
}

function mapWordsToWordSegments(words: AssemblyAiWord[]): TranscriptSegment[] {
  const validWords = words
    .filter(
      (word) =>
        typeof word.text === 'string' &&
        typeof word.start === 'number' &&
        typeof word.end === 'number',
    )
    .map((word) => ({
      word: word.text as string,
      start: word.start as number,
      end: word.end as number,
    }));

  const segments: TranscriptSegment[] = [];
  let currentWords: TranscriptWord[] = [];

  const pushSegment = () => {
    if (currentWords.length === 0) return;
    const first = currentWords[0];
    const last = currentWords[currentWords.length - 1];
    segments.push({
      id: segments.length,
      start: first.start,
      end: last.end,
      text: currentWords.map((item) => item.word).join(' '),
      words: currentWords,
    });
    currentWords = [];
  };

  for (const currentWord of validWords) {
    const previousWord = currentWords[currentWords.length - 1];
    const hasLargeGap =
      previousWord != null &&
      currentWord.start - previousWord.end > WORD_SEGMENT_GAP_MS;
    const hasSentenceBoundary =
      previousWord != null && /[.!?]["')\]]?$/.test(previousWord.word.trim());
    const hitWordLimit = currentWords.length >= WORD_SEGMENT_MAX_WORDS;

    if (hasLargeGap || hasSentenceBoundary || hitWordLimit) {
      pushSegment();
    }

    currentWords.push(currentWord);
  }

  pushSegment();
  return segments;
}

function mapSentenceSegments(
  segments: AssemblyAiSentenceSegment[] | undefined,
): TranscriptSegment[] | undefined {
  if (!Array.isArray(segments) || segments.length === 0) return undefined;
  const mapped = segments
    .filter(
      (segment) =>
        typeof segment.text === 'string' &&
        typeof segment.start === 'number' &&
        typeof segment.end === 'number',
    )
    .map((segment, index) => {
      const words = Array.isArray(segment.words)
        ? segment.words
            .filter(
              (word) =>
                typeof word.text === 'string' &&
                typeof word.start === 'number' &&
                typeof word.end === 'number',
            )
            .map((word) => ({
              word: word.text as string,
              start: word.start as number,
              end: word.end as number,
            }))
        : undefined;
      return {
        id: index,
        start: segment.start as number,
        end: segment.end as number,
        text: segment.text as string,
        words,
      };
    });
  return mapped.length > 0 ? mapped : undefined;
}

function mapUtterances(
  utterances: AssemblyAiUtterance[] | undefined,
): TranscriptSpeakerSegment[] | undefined {
  if (!utterances || utterances.length === 0) {
    return undefined;
  }

  const mapped = utterances
    .filter(
      (item) =>
        typeof item.speaker === 'string' &&
        typeof item.start === 'number' &&
        typeof item.end === 'number' &&
        typeof item.text === 'string',
    )
    .map((item) => ({
      speaker: item.speaker as string,
      start: item.start as number,
      end: item.end as number,
      text: item.text as string,
      confidence:
        typeof item.confidence === 'number' ? item.confidence : undefined,
    }));

  return mapped.length > 0 ? mapped : undefined;
}

function mapChapters(
  chapters: AssemblyAiChapter[] | undefined,
): TranscriptChapter[] | undefined {
  if (!chapters || chapters.length === 0) {
    return undefined;
  }

  const mapped = chapters
    .filter(
      (chapter) =>
        typeof chapter.start === 'number' &&
        typeof chapter.end === 'number' &&
        typeof chapter.headline === 'string' &&
        typeof chapter.summary === 'string' &&
        typeof chapter.gist === 'string',
    )
    .map((chapter) => ({
      start: chapter.start as number,
      end: chapter.end as number,
      headline: chapter.headline as string,
      summary: chapter.summary as string,
      gist: chapter.gist as string,
    }));

  return mapped.length > 0 ? mapped : undefined;
}

export async function transcribeWithAssemblyAI(
  audioUrl: string,
  pollingOptions?: TranscriptionPollingOptions,
): Promise<AssemblyTranscript> {
  if (typeof audioUrl !== 'string' || audioUrl.trim() === '') {
    throw new Error('audioUrl is required for transcription');
  }
  try {
    new URL(audioUrl);
  } catch {
    throw new Error('invalid audioUrl format');
  }

  const apiKey = requireApiKey();
  const transcriptId = await startTranscription(
    apiKey,
    audioUrl,
    pollingOptions?.requestTimeoutMs,
  );
  const result = await pollTranscription(apiKey, transcriptId, pollingOptions);

  const words = Array.isArray(result.words) ? result.words : [];
  const text = typeof result.text === 'string' ? result.text : '';
  const sentenceSegments = mapSentenceSegments(result.segments);

  return {
    text,
    segments: sentenceSegments ?? mapWordsToWordSegments(words),
    speakers: mapUtterances(result.utterances),
    chapters: mapChapters(result.auto_chapters_result),
  };
}





