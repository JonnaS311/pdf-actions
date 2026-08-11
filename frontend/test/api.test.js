import { describe, it, expect, vi, afterEach } from 'vitest'
import { runOperation, uploadFiles, downloadBlob } from '../src/api.js'

describe('runOperation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envía un POST JSON con el payload y devuelve un blob', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) })
    vi.stubGlobal('fetch', fetchMock)

    const result = await runOperation('/pdf/rotate', { file_key: 'doc.pdf', angle: 90 })

    expect(fetchMock).toHaveBeenCalledWith('/api/pdf/rotate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_key: 'doc.pdf', angle: 90 }),
    })
    expect(result).toBe(blob)
  })

  it('lanza un Error con el detail del servidor cuando falla', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Invalid PDF format' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(runOperation('/pdf/merge', { file_keys: ['a.pdf'] })).rejects.toThrow('Invalid PDF format')
  })

  it('lanza un Error con el código de estado cuando el body no es JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(runOperation('/pdf/split', {})).rejects.toThrow('Error del servidor (500)')
  })
})

describe('uploadFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envía los archivos como multipart y devuelve las claves', async () => {
    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ file_keys: ['abc123/doc.pdf'] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const keys = await uploadFiles([file])

    expect(keys).toEqual(['abc123/doc.pdf'])
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/files/upload')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('files')).toBe(file)
  })

  it('lanza un Error con el detail del servidor cuando falla', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Tipo de archivo no permitido: application/xml' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(uploadFiles([new File(['x'], 'a.xml')])).rejects.toThrow(
      'Tipo de archivo no permitido: application/xml',
    )
  })
})

describe('downloadBlob', () => {
  it('crea un enlace temporal, lo descarga y lo limpia', () => {
    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const click = vi.fn()
    const remove = vi.fn()
    const fakeLink = { href: '', download: '', click, remove }
    vi.stubGlobal('document', {
      createElement: () => fakeLink,
      body: { appendChild: vi.fn() },
    })

    const blob = new Blob([])
    downloadBlob(blob, 'resultado.pdf')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(fakeLink.download).toBe('resultado.pdf')
    expect(click).toHaveBeenCalled()
    expect(remove).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })
})