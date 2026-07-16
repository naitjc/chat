import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import { FIXED_NATIVE_MODEL } from './nativeModelConfig'

const STORAGE_KEY = 'chat-rp-model-settings'
const DEFAULT_SETTINGS = {
  apiURL: 'https://api.edgefn.net/v1',
  apiKey: '',
  model: FIXED_NATIVE_MODEL,
}

export async function loadNativeModelSettings() {
  const saved = await SecureStorage.get(STORAGE_KEY)
  return {
    ...DEFAULT_SETTINGS,
    ...(saved && typeof saved === 'object' ? saved : {}),
    model: FIXED_NATIVE_MODEL,
  }
}

export async function saveNativeModelSettings(settings) {
  const apiURL = String(settings.apiURL || '').trim().replace(/\/$/, '')
  const apiKey = String(settings.apiKey || '').trim()
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

  const normalized = { apiURL, apiKey }
  await SecureStorage.set(STORAGE_KEY, normalized)
  return { ...normalized, model: FIXED_NATIVE_MODEL }
}
