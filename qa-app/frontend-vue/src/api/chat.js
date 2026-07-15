const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8888";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function listConversations() {
  const data = await request("/conversations");
  return data.conversations;
}

export async function getConversation(id) {
  const data = await request(`/conversations/${encodeURIComponent(id)}`);
  return data.conversation;
}

export async function createConversation(payload) {
  const data = await request("/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.conversation;
}

export async function updateConversation(id, payload) {
  const data = await request(`/conversations/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.conversation;
}

export async function renameConversation(id, title) {
  const data = await request(
    `/conversations/${encodeURIComponent(id)}/title`,
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    },
  );
  return data.conversation;
}

export async function deleteConversation(id) {
  await request(`/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

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
