import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { FiDownload } from 'react-icons/fi'
import { downloadBlob } from '../api.js'
import PdfViewer from './PdfViewer.jsx'

export default function ResultSection({ operation, result }) {
  const canPreview = operation.resultType === 'pdf'
  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">Resultado</Typography>
        <Button
          variant="contained"
          startIcon={<FiDownload />}
          onClick={() => downloadBlob(result.blob, operation.filename)}
        >
          Descargar {operation.filename}
        </Button>
      </Stack>
      {canPreview ? (
        <PdfViewer src={result.url} title="Vista previa del resultado" />
      ) : (
        <Alert severity="success">
          La operación finalizó correctamente. El resultado se empaquetó en un archivo ZIP:
          descárgalo con el botón superior.
        </Alert>
      )}
    </Paper>
  )
}
