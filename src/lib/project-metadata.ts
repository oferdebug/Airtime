function parseNumberField(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }
  return undefined;
}

export function getFileSizeAsNumber(value: unknown): number | undefined {
  return parseNumberField(value);
}

export function getFileDurationAsNumber(value: unknown): number | undefined {
  return parseNumberField(value);
}
