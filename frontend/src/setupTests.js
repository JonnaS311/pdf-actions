import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

vi.mock('@embedpdf/react-pdf-viewer', () => ({
  PDFViewer: () => null,
}))
