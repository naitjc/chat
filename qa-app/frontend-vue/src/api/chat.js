const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8888";
const REQUEST_TIMEOUT_MS = 15000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw new Error("请求超时，请稍后重试");
    throw error;
  } finally {
    clearTimeout(timeout);
  }

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

export async function listRelationships() {
  const data = await request("/relationships");
  return data.relationships;
}

export async function getRelationship(id) {
  const data = await request(`/relationships/${encodeURIComponent(id)}`);
  return data.relationship;
}

export async function createRelationship(payload) {
  return request("/relationships", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function renameRelationship(id, title) {
  const data = await request(
    `/relationships/${encodeURIComponent(id)}/title`,
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    },
  );
  return data.relationship;
}

export async function updateRelationshipSettings(id, payload) {
  const data = await request(
    `/relationships/${encodeURIComponent(id)}/settings`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  return data.relationship;
}

export async function deleteRelationship(id) {
  await request(`/relationships/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function createNextChapter(relationshipId, payload) {
  return request(
    `/relationships/${encodeURIComponent(relationshipId)}/chapters`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function forkConversation(id, payload = {}) {
  return request(`/conversations/${encodeURIComponent(id)}/fork`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  let completed = false;
  let streamError = "";

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
        if (eventType === "done") {
          completed = true;
          if (onDone) onDone(data);
        }
        if (eventType === "error") {
          streamError = data.message || "生成回复失败";
          if (onError) onError(streamError);
        }
      } catch {
        /* 忽略解析失败 */
      }
    }
  }

  if (streamError) throw new Error(streamError);
  if (!completed) throw new Error("连接提前结束，请重试");
}
