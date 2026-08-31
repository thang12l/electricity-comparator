import { retrieveAmberUsage, AmberApiError } from "@/lib/amber/retrieveUsage";

export async function POST(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!apiKey.trim()) {
    return Response.json({ error: "API key is required" }, { status: 400 });
  }

  try {
    const result = await retrieveAmberUsage(apiKey);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AmberApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Could not retrieve Amber usage" }, { status: 500 });
  }
}
