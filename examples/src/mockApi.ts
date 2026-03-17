/**
 * Mock SSE response for examples: no real backend.
 * Two cases: pure markdown, and reply with custom component (agent_name).
 */

export type MockCase = "markdown" | "component";

/** Delay between chunks (ms). Increase for debugging (e.g. 800). */
const CHUNK_DELAY_MS = 100;

function formatSSE(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

/** Simulate streaming with configurable delays (ms). */
function streamWithDelay(
  chunks: string[],
  delayMs = CHUNK_DELAY_MS,
): ReadableStream<Uint8Array> {
  let i = 0;
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      controller.enqueue(encoder.encode(chunks[i]));
      i++;
    },
  });
}

/** Mock response: case 1 = pure markdown; case 2 = markdown + custom component (agent_name). */
export function mockChatResponse(caseKind: MockCase): Response {
  if (caseKind === "markdown") {
    const content = [
      "# Pure Markdown Demo\n\n",
      "This is **bold** and *italic*.\n\n",
      "- List item 1\n",
      "- List item 2\n\n",
      "`code` and [link](https://example.com).",
    ];
    const chunks = content.map((c) =>
      formatSSE("answer", JSON.stringify({ content: c })),
    );
    return new Response(streamWithDelay(chunks), {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  // case: 'component' — answer + custom_component (agent_name) + custom_component (login_form) + answer
  const chunks = [
    formatSSE("answer", JSON.stringify({ content: "Reply from " })),
    formatSSE(
      "custom_component",
      JSON.stringify({
        type: "agent_name",
        props: JSON.stringify({
          name: "MockAgent",
          description: "I am a mock agent for the demo",
        }),
      }),
    ),
    formatSSE(
      "answer",
      JSON.stringify({
        content: " — this line includes a **custom component** above.\n\n",
      }),
    ),
    formatSSE(
      "custom_component",
      JSON.stringify({
        type: "login_form",
        props: JSON.stringify({
          title: "Sign in to continue",
          submitText: "Sign in",
        }),
      }),
    ),
    formatSSE(
      "answer",
      JSON.stringify({
        content: "\n\nPlease complete the form above to proceed.",
      }),
    ),
  ];
  return new Response(streamWithDelay(chunks), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

/** Build a request function that mocks by message content: "markdown" / "component" or default markdown. */
export function createMockRequest(
  defaultCase: MockCase = "markdown",
): (message: string, _controller: AbortController) => Promise<Response> {
  return async (message: string, controller: AbortController) => {
    await new Promise((r) => setTimeout(r, 500));
    if (controller.signal.aborted)
      throw new DOMException("Aborted", "AbortError");
    const caseKind =
      message.trim().toLowerCase() === "component" ? "component" : defaultCase;
    return mockChatResponse(caseKind);
  };
}
