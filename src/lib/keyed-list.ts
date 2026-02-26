export interface KeyedStringValue {
  value: string;
  key: string;
}

export function withOccurrenceKeys(values: string[]): KeyedStringValue[] {
  const seen = new Map<string, number>();
  return values.map((value) => {
    const occurrence = (seen.get(value) ?? 0) + 1;
    seen.set(value, occurrence);
    return { value, key: `${value}-${occurrence}` };
  });
}

export function withOccurrenceKeysBy<T>(
  items: T[],
  getBaseKey: (item: T) => string,
): Array<{ item: T; key: string }> {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const baseKey = getBaseKey(item);
    const occurrence = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, occurrence);
    return { item, key: `${baseKey}-${occurrence}` };
  });
}
