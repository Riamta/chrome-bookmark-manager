// This is the URL of your deployed Cloudflare Worker.
// Make sure to replace this with your actual production URL after running `npm run deploy` in the worker project.
const AI_WORKER_URL = 'https://bookmark-ai-worker.hieulc2811.workers.dev';

export interface AiSummaryResponse {
  title?: string;
  tags: string[];
  collectionId?: string | null;
}

export async function getAiSummary(payload: { title: string; url: string; collections?: { id: string, name: string }[] }): Promise<AiSummaryResponse | undefined> {
  const { title, url, collections } = payload;
  if (!title && !url) return undefined;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s timeout for AI response

    const response = await fetch(AI_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, url, collections }),
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = errorText;
      try {
        const parsedError = JSON.parse(errorText);
        errorMsg = parsedError.error || errorText;
      } catch (e) {
        // use raw text if not JSON
      }
      console.error('AI Worker failed with status:', response.status, 'Error:', errorMsg);
      return undefined;
    }

    const data = await response.json();

    // Validate response shape
    if (data && Array.isArray(data.tags)) {
      return data as AiSummaryResponse;
    }
  } catch (error) {
    console.error('Failed to get AI summary:', error);
  }

  return undefined;
}
