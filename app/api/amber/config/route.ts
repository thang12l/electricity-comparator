import { getServerAmberApiKey, isServerAmberApiKeyConfigured } from "@/lib/amber/serverApiKey";

export async function GET() {
  const defaultKey = getServerAmberApiKey();
  const includeKey =
    process.env.NODE_ENV === "development" && Boolean(defaultKey);

  return Response.json({
    defaultKeyConfigured: isServerAmberApiKeyConfigured(),
    ...(includeKey ? { defaultKey } : {}),
  });
}
