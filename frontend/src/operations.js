export const OPERATIONS = [
  {
    id: 'merge',
    title: 'Unir PDF',
    description: 'Combina varios PDFs en un solo documento. Arrastra los archivos para ordenarlos.',
    endpoint: '/pdf/merge',
    filename: 'unidos.pdf',
    resultType: 'pdf',
    accept: '.pdf',
    multiple: true,
    orderable: true,
    params: [],
  },
  {
    id: 'split',
    title: 'Dividir PDF',
    description: 'Extrae páginas específicas de un PDF y las descarga en un ZIP.',
    endpoint: '/pdf/split',
    filename: 'paginas_extraidas.zip',
    resultType: 'zip',
    accept: '.pdf',
    multiple: false,
    params: [
      {
        name: 'pages',
        label: 'Páginas a extraer',
        type: 'pages',
        placeholder: 'Ej.: 1, 3, 5',
        helperText: 'Escribe los números de página separados por comas.',
      },
    ],
  },
  {
    id: 'compress',
    title: 'Comprimir PDF',
    description: 'Reduce el tamaño de un PDF conservando la calidad deseada.',
    endpoint: '/pdf/compress',
    filename: 'comprimido.pdf',
    resultType: 'pdf',
    accept: '.pdf',
    multiple: false,
    params: [
      { name: 'quality', label: 'Calidad', type: 'slider', min: 1, max: 100, defaultValue: 75 },
    ],
  },
  {
    id: 'to-jpg',
    title: 'PDF a JPG',
    description: 'Convierte cada página de un PDF a imágenes JPG y las descarga en un ZIP.',
    endpoint: '/pdf/to-jpg',
    filename: 'imagenes.zip',
    resultType: 'zip',
    accept: '.pdf',
    multiple: false,
    params: [
      {
        name: 'dpi',
        label: 'Resolución (DPI)',
        type: 'select',
        options: [72, 150, 200, 300, 400, 600],
        defaultValue: 200,
      },
    ],
  },
  {
    id: 'jpg-to-pdf',
    title: 'JPG a PDF',
    description: 'Convierte varias imágenes JPG en un único PDF. El orden determina el de las páginas.',
    endpoint: '/pdf/jpg-to-pdf',
    filename: 'imagenes.pdf',
    resultType: 'pdf',
    accept: '.jpg,.jpeg',
    multiple: true,
    orderable: true,
    params: [],
  },
  {
    id: 'rotate',
    title: 'Rotar PDF',
    description: 'Rota un PDF a 90, 180, 270 o 360 grados.',
    endpoint: '/pdf/rotate',
    filename: 'rotado.pdf',
    resultType: 'pdf',
    accept: '.pdf',
    multiple: false,
    params: [
      {
        name: 'angle',
        label: 'Ángulo de rotación',
        type: 'toggle',
        options: [90, 180, 270, 360],
        defaultValue: 90,
      },
    ],
  },
]

export function parsePages(value) {
  return String(value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
}

export function buildPayload(operation, { fileKeys = [], paramValues = {} }) {
  const payload = {}
  if (operation.multiple) {
    payload.file_keys = [...fileKeys]
  } else if (fileKeys.length > 0) {
    payload.file_key = fileKeys[0]
  }
  for (const param of operation.params) {
    const value = paramValues[param.name] ?? param.defaultValue ?? 0
    payload[param.name] = param.type === 'pages' ? parsePages(value) : Number(value)
  }
  return payload
}
