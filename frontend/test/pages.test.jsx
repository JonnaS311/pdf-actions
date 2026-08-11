import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App.jsx'

function afterTest() {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
}

function stubObjectURLs() {
  const createObjectURL = vi.fn(() => 'blob:fake')
  const revokeObjectURL = vi.fn()
  const URLMock = class URLMock extends globalThis.URL {
    static createObjectURL = createObjectURL
    static revokeObjectURL = revokeObjectURL
  }
  vi.stubGlobal('URL', URLMock)
  return { createObjectURL, revokeObjectURL }
}

function stubDownload() {
  const link = document.createElement('a')
  const click = vi.fn(() => {})
  const remove = vi.fn(() => {})
  vi.spyOn(link, 'click').mockImplementation(click)
  vi.spyOn(link, 'remove').mockImplementation(remove)
  const realAppendChild = document.body.appendChild.bind(document.body)
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) =>
    node === link ? node : realAppendChild(node),
  )
  return { click, remove }
}

function nav() {
  return within(screen.getByRole('navigation', { name: 'Navegación principal' }))
}

async function goTo(user, label) {
  render(<App />)
  await user.click(nav().getByRole('link', { name: label }))
  await screen.findByRole('heading', { name: label, level: 1 })
}

describe('Rotación', () => {
  afterTest()

  it('sube un archivo y envía el payload con el ángulo seleccionado', async () => {
    const user = userEvent.setup()
    const resultBlob = new Blob(['%PDF'], { type: 'application/pdf' })
    const fetchMock = vi.fn().mockImplementation((url, options) => {
      if (options?.body instanceof FormData) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ file_keys: ['abc123/documento.pdf'] }),
        })
      }
      return Promise.resolve({ ok: true, blob: () => Promise.resolve(resultBlob) })
    })
    vi.stubGlobal('fetch', fetchMock)
    stubObjectURLs()
    stubDownload()

    await goTo(user, 'Rotar PDF')

    const fileInput = document.querySelector('input[type="file"]')
    const file = new File(['%PDF'], 'documento.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    expect(await screen.findAllByText('documento.pdf')).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: '180°' }))
    await user.click(screen.getByRole('button', { name: 'Procesar' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/pdf/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_key: 'abc123/documento.pdf', angle: 180 }),
      })
    })
    expect(await screen.findByText('Resultado')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Descargar rotado\.pdf/ }),
    ).toBeInTheDocument()
  })
})

describe('Unir PDF', () => {
  afterTest()

  it('refleja el orden visual de la lista en el payload file_keys', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation((url, options) => {
      if (options?.body instanceof FormData) {
        const files = options.body.getAll('files')
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              file_keys: files.map((file, index) => `k${index}/${file.name}`),
            }),
        })
      }
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['%PDF'], { type: 'application/pdf' })),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    stubObjectURLs()

    await goTo(user, 'Unir PDF')

    const fileInput = document.querySelector('input[type="file"]')
    const fileA = new File(['%PDF-A'], 'a.pdf', { type: 'application/pdf' })
    const fileB = new File(['%PDF-B'], 'b.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, [fileA, fileB])
    expect(await screen.findAllByText('a.pdf')).not.toHaveLength(0)
    expect(screen.getAllByText('b.pdf')).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Bajar a.pdf' }))

    await user.click(screen.getByRole('button', { name: 'Procesar' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/pdf/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_keys: ['k1/b.pdf', 'k0/a.pdf'] }),
      })
    })
  })
})

describe('Errores del servidor', () => {
  afterTest()

  it('muestra el error del backend en un alert cuando la operación falla', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation((url, options) => {
      if (options?.body instanceof FormData) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ file_keys: ['abc123/doc.pdf'] }),
        })
      }
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'File not found in storage: doc.pdf' }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    stubObjectURLs()

    await goTo(user, 'Comprimir PDF')

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }))
    await screen.findAllByText('doc.pdf')

    await user.click(screen.getByRole('button', { name: 'Procesar' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('File not found in storage: doc.pdf')
  })
})
