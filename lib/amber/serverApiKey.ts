export function getServerAmberApiKey(): string | null {
  const key = process.env.AMBER_DATA_API_KEY?.trim();
  return key || null;
}

export function isServerAmberApiKeyConfigured(): boolean {
  return Boolean(getServerAmberApiKey());
}
