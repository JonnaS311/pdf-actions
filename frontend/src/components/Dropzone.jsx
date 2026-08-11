import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { FiUploadCloud } from 'react-icons/fi'
import { uploadFiles } from '../api.js'
import { COLORS } from '../theme.js'

function matchesAccept(name, accept) {
  const patterns = String(accept || '')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
  if (patterns.length === 0) return true
  return patterns.some((pattern) => name.toLowerCase().endsWith(pattern))
}

export default function Dropzone({
  multiple = false,
  accept = '.pdf',
  label,
  hint,
  onFiles,
  onUploading,
  onError,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(selected) {
    const files = Array.from(selected).filter((file) => matchesAccept(file.name, accept))
    if (files.length === 0) {
      onError?.(`Formato no permitido. Archivos aceptados: ${accept}`)
      return
    }
    if (inputRef.current) inputRef.current.value = ''
    onUploading?.(true)
    onError?.(null)
    try {
      const keys = await uploadFiles(files)
      onFiles({ files, keys })
    } catch (e) {
      onError?.(e.message)
    } finally {
      onUploading?.(false)
    }
  }

  return (
    <Box>
      <Box
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 4,
          px: 2,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: dragging ? COLORS.aqua : 'divider',
          bgcolor: dragging ? 'rgba(131, 192, 146, 0.08)' : 'background.default',
          color: 'text.secondary',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
          '&:hover': { borderColor: COLORS.aqua },
          '&:focus-visible': { outline: `2px solid ${COLORS.green}`, outlineOffset: 2 },
        }}
      >
        <FiUploadCloud size={36} color={COLORS.green} aria-hidden="true" />
        <Typography variant="body1" color="text.primary">
          {label || 'Arrastra tus archivos aquí o haz clic para seleccionarlos'}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" variant="outlined" startIcon={<FiUploadCloud />}>
            {multiple ? 'Seleccionar archivos' : 'Seleccionar archivo'}
          </Button>
        </Stack>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </Box>
      {dragging && (
        <LinearProgress sx={{ mt: 1 }} color="secondary" aria-hidden="true" />
      )}
    </Box>
  )
}
