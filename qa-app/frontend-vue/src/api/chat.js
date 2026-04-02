const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8888";

/**
 * 流式消息发送 - SSE
 */
export async function sendMessageStream(
  payload,
  { onChunk, onState, onDone, onError } = {},
) {
  const response = await fetch(`${API_URL}/qa/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let eventBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    eventBuffer += decoder.decode(value, { stream: true });

    // SSE 事件以双换行分隔
    const blocks = eventBuffer.split("\n\n");
    eventBuffer = blocks.pop(); // 保留不完整的末块

    for (const block of blocks) {
      if (!block.trim()) continue;
      let eventType = "message";
      let dataLine = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        if (line.startsWith("data: ")) dataLine = line.slice(6).trim();
      }
      if (!dataLine) continue;
      try {
        const data = JSON.parse(dataLine);
        if (eventType === "chunk" && onChunk) onChunk(data.text);
        if (eventType === "state" && onState) onState(data);
        if (eventType === "done" && onDone) onDone(data);
        if (eventType === "error" && onError) onError(data.message);
      } catch {
        /* 忽略解析失败 */
      }
    }
  }
}
