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
  confidence: number;
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
  utterances?: AssemblyAiUtterance[];
  auto_chapters_result?: AssemblyAiChapter[];
};

const BASE_URL = 'https://api.assemblyai.com/v2';
const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 120;
// AssemblyAI now requires an explicit speech model list on transcript creation.
const DEFAULT_SPEECH_MODELS = ['universal-2'];

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
): Promise<string> {
  const response = await fetch(`${BASE_URL}/transcript`, {
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
  });

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
): Promise<AssemblyAiTranscriptResponse> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const response = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
      method: 'GET',
      headers: { Authorization: apiKey },
    });

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

    await new Promise((resolve) => {
      setTimeout(resolve, POLL_INTERVAL_MS);
    });
  }

  throw new Error('AssemblyAI transcription timed out');
}

function mapWordsToSegments(words: AssemblyAiWord[]): TranscriptSegment[] {
  return words
    .filter(
      (word) =>
        typeof word.text === 'string' &&
        typeof word.start === 'number' &&
        typeof word.end === 'number',
    )
    .map((word, index) => ({
      id: index,
      start: word.start as number,
      end: word.end as number,
      text: word.text as string,
      words: [
        {
          word: word.text as string,
          start: word.start as number,
          end: word.end as number,
        },
      ],
    }));
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
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.9,
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
): Promise<AssemblyTranscript> {
  if (!audioUrl) {
    throw new Error('audioUrl is required for transcription');
  }

  const apiKey = requireApiKey();
  const transcriptId = await startTranscription(apiKey, audioUrl);
  const result = await pollTranscription(apiKey, transcriptId);

  const words = Array.isArray(result.words) ? result.words : [];
  const text = typeof result.text === 'string' ? result.text : '';

  return {
    text,
    segments: mapWordsToSegments(words),
    speakers: mapUtterances(result.utterances),
    chapters: mapChapters(result.auto_chapters_result),
  };
}
