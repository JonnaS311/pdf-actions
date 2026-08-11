import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { FiFile, FiImage, FiPlay, FiX } from 'react-icons/fi'
import { runOperation } from '../api.js'
import { buildPayload, parsePages } from '../operations.js'
import { COLORS } from '../theme.js'
import Dropzone from '../components/Dropzone.jsx'
import OrderableList from '../components/OrderableList.jsx'
import PdfViewer from '../components/PdfViewer.jsx'
import ResultSection from '../components/ResultSection.jsx'

function ImageThumb({ item }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [item])
  if (!url) return null
  return (
    <img
      src={url}
      alt={item.file.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  )
}

function ParamControl({ param, value, onChange }) {
  if (param.type === 'toggle') {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {param.label}
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={value}
          onChange={(_, next) => {
            if (next !== null) onChange(next)
          }}
          aria-label={param.label}
          fullWidth
        >
          {param.options.map((option) => (
            <ToggleButton key={option} value={option}>
              {option}°
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    )
  }

  if (param.type === 'slider') {
    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">{param.label}</Typography>
          <Chip label={`${value}`} color="secondary" size="small" />
        </Stack>
        <Slider
          min={param.min}
          max={param.max}
          step={param.step ?? 1}
          value={Number(value)}
          onChange={(_, next) => onChange(next)}
          valueLabelDisplay="auto"
          marks
          aria-label={param.label}
        />
      </Box>
    )
  }

  if (param.type === 'select') {
    return (
      <FormControl fullWidth>
        <InputLabel id={`param-${param.name}-label`}>{param.label}</InputLabel>
        <Select
          labelId={`param-${param.name}-label`}
          value={value}
          label={param.label}
          onChange={(e) => onChange(e.target.value)}
        >
          {param.options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  if (param.type === 'pages') {
    const pages = parsePages(value)
    return (
      <Box>
        <TextField
          fullWidth
          label={param.label}
          placeholder={param.placeholder}
          helperText={param.helperText}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {pages.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }} useFlexGap>
            {pages.map((page, index) => (
              <Chip
                key={`${page}-${index}`}
                label={`Página ${page}`}
                size="small"
                onDelete={() =>
                  onChange(
                    pages
                      .filter((_, other) => other !== index)
                      .join(', '),
                  )
                }
              />
            ))}
          </Stack>
        )}
      </Box>
    )
  }

  return null
}

export default function OperationPage({ operation }) {
  const [items, setItems] = useState([])
  const [paramValues, setParamValues] = useState(() =>
    Object.fromEntries(operation.params.map((param) => [param.name, param.defaultValue ?? ''])),
  )
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const pdfItems = useMemo(
    () => items.filter((item) => item.file.type === 'application/pdf'),
    [items],
  )
  const imageItems = useMemo(
    () => items.filter((item) => item.file.type.startsWith('image/')),
    [items],
  )
  const [previewIndex, setPreviewIndex] = useState(0)
  const previewItem = pdfItems[Math.min(previewIndex, Math.max(pdfItems.length - 1, 0))]

  const [previewUrl, setPreviewUrl] = useState(null)
  useEffect(() => {
    if (!previewItem) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(previewItem.file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [previewItem])

  useEffect(() => {
    setPreviewIndex(0)
  }, [pdfItems.length])

  useEffect(
    () => () => {
      if (result?.url) URL.revokeObjectURL(result.url)
    },
    [result],
  )

  function setParam(name, value) {
    setParamValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleFiles({ files, keys }) {
    const next = files.map((file, index) => ({ file, key: keys[index] }))
    setItems((prev) => (operation.multiple ? [...prev, ...next] : next.slice(0, 1)))
    setResult(null)
  }

  function handleRemove(index) {
    setItems((prev) => prev.filter((_, other) => other !== index))
  }

  function handleReorder(from, to) {
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  async function handleRun() {
    if (items.length === 0) {
      setError('Sube al menos un archivo antes de procesar.')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const payload = buildPayload(operation, {
        fileKeys: items.map((item) => item.key),
        paramValues,
      })
      const blob = await runOperation(operation.endpoint, payload)
      setResult({ blob, url: URL.createObjectURL(blob) })
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
        {operation.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {operation.description}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              1. Archivos
            </Typography>
            <Dropzone
              multiple={operation.multiple}
              accept={operation.accept}
              label={
                operation.multiple
                  ? 'Arrastra tus archivos aquí o haz clic para seleccionarlos'
                  : 'Arrastra tu archivo aquí o haz clic para seleccionarlo'
              }
              onFiles={handleFiles}
              onUploading={setUploading}
              onError={setError}
            />
            {uploading && <LinearProgress sx={{ mt: 2 }} aria-label="Subiendo archivos" />}

            {items.length > 0 &&
              (operation.orderable ? (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Orden de procesamiento (arrastra para reordenar)
                  </Typography>
                  <OrderableList items={items} onReorder={handleReorder} onRemove={handleRemove} />
                </Box>
              ) : (
                <Stack spacing={1} sx={{ mt: 3 }}>
                  {items.map((item) => {
                    const isImage = item.file.type.startsWith('image/')
                    const FileIcon = isImage ? FiImage : FiFile
                    return (
                      <Paper
                        key={item.key}
                        variant="outlined"
                        sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
                      >
                        <Box sx={{ color: COLORS.green, display: 'flex' }}>
                          <FileIcon size={22} aria-hidden="true" />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {item.file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(item.file.size / 1024).toFixed(0)} KB
                          </Typography>
                        </Box>
                        <IconButton size="small" aria-label={`Quitar ${item.file.name}`} onClick={() => handleRemove(0)}>
                          <FiX size={16} />
                        </IconButton>
                      </Paper>
                    )
                  })}
                </Stack>
              ))}

            {operation.orderable && imageItems.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Vista previa de imágenes
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                  {imageItems.map((item) => (
                    <Box key={item.key} sx={{ width: 72, height: 96, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
                      <ImageThumb item={item} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {previewItem && (
              <Box sx={{ mt: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }} useFlexGap>
                  <Typography variant="subtitle2">Vista previa</Typography>
                  {pdfItems.length > 1 && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="preview-select-label">Archivo a previsualizar</InputLabel>
                      <Select
                        labelId="preview-select-label"
                        label="Archivo a previsualizar"
                        size="small"
                        value={Math.min(previewIndex, pdfItems.length - 1)}
                        onChange={(e) => setPreviewIndex(Number(e.target.value))}
                      >
                        {pdfItems.map((item, index) => (
                          <MenuItem key={item.key} value={index}>
                            {item.file.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
                <PdfViewer src={previewUrl} title={previewItem.file.name} height={420} />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              2. Parámetros
            </Typography>
            {operation.params.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Esta operación no requiere parámetros adicionales.
              </Alert>
            ) : (
              <Stack spacing={3}>
                {operation.params.map((param) => (
                  <ParamControl
                    key={param.name}
                    param={param}
                    value={paramValues[param.name]}
                    onChange={(value) => setParam(param.name, value)}
                  />
                ))}
              </Stack>
            )}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<FiPlay />}
              disabled={processing || uploading || items.length === 0}
              onClick={handleRun}
              sx={{ mt: 3 }}
            >
              {processing ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Procesando…
                </>
              ) : (
                'Procesar'
              )}
            </Button>
            {items.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Sube un archivo para habilitar el botón.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {result && <ResultSection operation={operation} result={result} />}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError(null)} role="alert">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
