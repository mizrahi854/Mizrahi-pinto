/**
 * AI food recognition – interface ready, NOT connected.
 * When a server endpoint is configured (EXPO_PUBLIC_AI_ENDPOINT, an Edge Function holding the provider key),
 * photos / descriptions are sent there and the result is shown for confirmation. Until then nothing is
 * "recognised": the UI says the service is not connected and offers manual / database matching instead.
 */
export const AI_ENDPOINT = process.env.EXPO_PUBLIC_AI_ENDPOINT ?? '';
export const aiConnected = AI_ENDPOINT.length > 0;

export type AiItem = { name: string; grams: number | null; confidence: number };

export async function recognizeMeal(input: { imageUri?: string; text?: string }): Promise<AiItem[]> {
  if (!aiConnected) throw new Error('AI_NOT_CONNECTED');
  const res = await fetch(AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { items?: AiItem[] };
  return (data.items ?? []).filter((i) => typeof i.name === 'string');
}
