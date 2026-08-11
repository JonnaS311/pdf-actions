import { describe, it, expect } from 'vitest'
import { OPERATIONS, buildPayload, parsePages } from '../src/operations.js'

describe('OPERATIONS', () => {
  it('define las seis operaciones del backend', () => {
    expect(OPERATIONS.map((op) => op.endpoint).sort()).toEqual([
      '/pdf/compress',
      '/pdf/jpg-to-pdf',
      '/pdf/merge',
      '/pdf/rotate',
      '/pdf/split',
      '/pdf/to-jpg',
    ])
  })

  it('todas las operaciones tienen la configuración mínima', () => {
    for (const op of OPERATIONS) {
      expect(op.id).toBeTruthy()
      expect(op.title).toBeTruthy()
      expect(op.description).toBeTruthy()
      expect(op.filename).toBeTruthy()
      expect(op.resultType).toBeTruthy()
      expect(op.accept).toBeTruthy()
      expect(typeof op.multiple).toBe('boolean')
      expect(Array.isArray(op.params)).toBe(true)
    }
  })

  it('rotate usa un selector con solo ángulos válidos', () => {
    const rotate = OPERATIONS.find((op) => op.id === 'rotate')
    expect(rotate.params).toHaveLength(1)
    expect(rotate.params[0].type).toBe('toggle')
    expect(rotate.params[0].options).toEqual([90, 180, 270, 360])
  })

  it('compress usa un slider de calidad 1-100', () => {
    const compress = OPERATIONS.find((op) => op.id === 'compress')
    expect(compress.params[0].type).toBe('slider')
    expect(compress.params[0].min).toBe(1)
    expect(compress.params[0].max).toBe(100)
    expect(compress.params[0].defaultValue).toBe(75)
  })

  it('to-jpg ofrece DPIs típicos', () => {
    const toJpg = OPERATIONS.find((op) => op.id === 'to-jpg')
    expect(toJpg.params[0].type).toBe('select')
    expect(toJpg.params[0].options).toEqual([72, 150, 200, 300, 400, 600])
  })

  it('split pide páginas como lista numérica', () => {
    const split = OPERATIONS.find((op) => op.id === 'split')
    expect(split.params[0].type).toBe('pages')
  })

  it('merge y jpg-to-pdf son múltiples y reordenables', () => {
    for (const id of ['merge', 'jpg-to-pdf']) {
      const op = OPERATIONS.find((entry) => entry.id === id)
      expect(op.multiple).toBe(true)
      expect(op.orderable).toBe(true)
    }
  })
})

describe('parsePages', () => {
  it('convierte un texto en una lista de números', () => {
    expect(parsePages('1, 3, 5')).toEqual([1, 3, 5])
  })

  it('ignora entradas vacías', () => {
    expect(parsePages('1, , 2,')).toEqual([1, 2])
  })

  it('devuelve una lista vacía sin entrada', () => {
    expect(parsePages('')).toEqual([])
    expect(parsePages(undefined)).toEqual([])
  })
})

describe('buildPayload', () => {
  it('usa file_key para operaciones de un solo archivo', () => {
    const rotate = OPERATIONS.find((op) => op.id === 'rotate')
    expect(buildPayload(rotate, { fileKeys: ['doc.pdf'], paramValues: { angle: 180 } })).toEqual({
      file_key: 'doc.pdf',
      angle: 180,
    })
  })

  it('usa file_keys en orden para operaciones múltiples', () => {
    const merge = OPERATIONS.find((op) => op.id === 'merge')
    expect(buildPayload(merge, { fileKeys: ['b.pdf', 'a.pdf'], paramValues: {} })).toEqual({
      file_keys: ['b.pdf', 'a.pdf'],
    })
  })

  it('convierte páginas en una lista de números', () => {
    const split = OPERATIONS.find((op) => op.id === 'split')
    expect(buildPayload(split, { fileKeys: ['doc.pdf'], paramValues: { pages: '1, 3, 5' } })).toEqual({
      file_key: 'doc.pdf',
      pages: [1, 3, 5],
    })
  })

  it('aplica valores por defecto de parámetros numéricos', () => {
    const compress = OPERATIONS.find((op) => op.id === 'compress')
    expect(buildPayload(compress, { fileKeys: ['doc.pdf'], paramValues: {} })).toEqual({
      file_key: 'doc.pdf',
      quality: 75,
    })
  })
})
