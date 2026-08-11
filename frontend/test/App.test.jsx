import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App.jsx'
import { OPERATIONS } from '../src/operations.js'

function nav() {
  return within(screen.getByRole('navigation', { name: 'Navegación principal' }))
}

describe('App / navegación', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('muestra la página de inicio con las seis operaciones y el footer', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'PDF Actions', level: 1 })).toBeInTheDocument()
    for (const op of OPERATIONS) {
      expect(screen.getAllByText(op.title).length).toBeGreaterThan(0)
    }
    expect(screen.getByText(/© 2026 PDF Actions\. Todos los derechos reservados\./)).toBeInTheDocument()
  })

  it('navega a cada página de operación desde el menú lateral', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const op of OPERATIONS) {
      await user.click(nav().getByRole('link', { name: op.title }))
      expect(await screen.findByRole('heading', { name: op.title, level: 1 })).toBeInTheDocument()
      expect(screen.getByText(op.description)).toBeInTheDocument()
    }
  })

  it('navega a la página de inicio desde el menú lateral', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav().getByRole('link', { name: 'Rotar PDF' }))
    await user.click(nav().getByRole('link', { name: 'Inicio' }))
    expect(await screen.findByRole('heading', { name: 'PDF Actions', level: 1 })).toBeInTheDocument()
  })
})
