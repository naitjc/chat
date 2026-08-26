const STORAGE_KEY = 'chat-rp-web-model-settings'

const EMPTY_SETTINGS = Object.freeze({ apiURL: '', apiKey: '', model: '' })

const normalizeSettings = (settings = {}) => {
  const apiURL = String(settings.apiURL || '').trim().replace(/\/$/, '')
  const apiKey = String(settings.apiKey || '').trim()
  const model = String(settings.model || '').trim()
  let url

  try {
    url = new URL(apiURL)
  } catch {
    throw new Error('API 地址不是有效 URL')
  }
  if (url.protocol !== 'https:') {
    throw new Error('API 地址必须使用 https://，避免密钥明文传输')
  }
  if (!apiKey) throw new Error('API Key 不能为空')
  if (!model) throw new Error('模型名称不能为空')

  return { apiURL, apiKey, model }
}

export function loadWebModelSettings() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    return saved && typeof saved === 'object'
      ? { ...EMPTY_SETTINGS, ...saved }
      : { ...EMPTY_SETTINGS }
  } catch {
    return { ...EMPTY_SETTINGS }
  }
}

export function saveWebModelSettings(settings) {
  const normalized = normalizeSettings(settings)
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function clearWebModelSettings() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function webModelHeaders(settings = loadWebModelSettings()) {
  if (!settings.apiURL || !settings.apiKey || !settings.model) return {}
  const normalized = normalizeSettings(settings)
  return {
    'X-Model-API-URL': normalized.apiURL,
    'X-Model-API-Key': normalized.apiKey,
    'X-Model-Name': normalized.model,
  }
}
