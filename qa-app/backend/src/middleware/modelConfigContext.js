const { AsyncLocalStorage } = require('node:async_hooks')

const requestContext = new AsyncLocalStorage()

function parseModelConfig(headers = {}) {
  const apiURL = String(headers['x-model-api-url'] || '').trim().replace(/\/$/, '')
  const apiKey = String(headers['x-model-api-key'] || '').trim()
  const model = String(headers['x-model-name'] || '').trim()

  if (!apiURL && !apiKey && !model) return null
  if (!apiURL || !apiKey || !model) {
    const error = new Error('模型 API 地址、API Key 和模型名称必须同时提供')
    error.status = 400
    throw error
  }
  if (apiURL.length > 2048 || apiKey.length > 4096 || model.length > 200) {
    const error = new Error('模型配置内容过长')
    error.status = 400
    throw error
  }

  let url
  try {
    url = new URL(apiURL)
  } catch {
    const error = new Error('模型 API 地址不是有效 URL')
    error.status = 400
    throw error
  }
  if (url.protocol !== 'https:') {
    const error = new Error('模型 API 地址必须使用 https://')
    error.status = 400
    throw error
  }

  return Object.freeze({ apiURL, apiKey, model })
}

function modelConfigContext(req, res, next) {
  let modelConfig
  try {
    modelConfig = parseModelConfig(req.headers)
  } catch (error) {
    return next(error)
  }
  requestContext.run({ modelConfig }, next)
}

function getRequestModelConfig() {
  return requestContext.getStore()?.modelConfig || null
}

module.exports = { modelConfigContext, getRequestModelConfig, parseModelConfig }
