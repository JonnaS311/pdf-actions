const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function parseError(response) {
  let message = `Error del servidor (${response.status})`
  try {
    const data = await response.json()
    if (data.detail) message = data.detail
  } catch {
    // keep default message when body is not JSON
  }
  return message
}

export async function runOperation(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.blob()
}

export async function uploadFiles(files) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }

  const response = await fetch(`${API_BASE_URL}/files/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data = await response.json()
  return data.file_keys
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}