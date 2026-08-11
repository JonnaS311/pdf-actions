import { lazy, Suspense } from 'react'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { COLORS } from '../theme.js'

const EmbedPDFViewer = lazy(() =>
  import('@embedpdf/react-pdf-viewer').then((module) => ({ default: module.PDFViewer })),
)

export default function PdfViewer({ src, title, height = 560 }) {
  return (
    <Box
      sx={{
        width: '100%',
        height,
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {title && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 8,
            left: 12,
            zIndex: 2,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: 'rgba(39, 46, 51, 0.8)',
            color: COLORS.aqua,
          }}
        >
          {title}
        </Typography>
      )}
      <Suspense
        fallback={
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <LinearProgress sx={{ width: '60%' }} />
            <Typography color="text.secondary">Cargando visor de PDF…</Typography>
          </Box>
        }
      >
        <EmbedPDFViewer
          config={{
            src,
            theme: {
              preference: 'dark',
              dark: {
                accent: {
                  primary: COLORS.green,
                  primaryHover: COLORS.aqua,
                  primaryActive: COLORS.aqua,
                  primaryLight: 'rgba(167, 192, 128, 0.18)',
                  primaryForeground: COLORS.background,
                },
                background: {
                  app: COLORS.background,
                  surface: 'rgba(211, 198, 170, 0.05)',
                  surfaceAlt: 'rgba(211, 198, 170, 0.08)',
                  elevated: 'rgba(47, 55, 61, 0.98)',
                  overlay: 'rgba(39, 46, 51, 0.7)',
                  input: 'rgba(211, 198, 170, 0.08)',
                },
                foreground: {
                  primary: COLORS.foreground,
                  secondary: 'rgba(211, 198, 170, 0.72)',
                  muted: 'rgba(211, 198, 170, 0.5)',
                  disabled: 'rgba(211, 198, 170, 0.38)',
                  onAccent: COLORS.background,
                },
                border: {
                  default: 'rgba(211, 198, 170, 0.16)',
                  subtle: 'rgba(211, 198, 170, 0.08)',
                  strong: COLORS.aqua,
                },
                state: {
                  error: COLORS.foreground,
                  errorLight: 'rgba(211, 198, 170, 0.12)',
                  warning: COLORS.aqua,
                  warningLight: 'rgba(131, 192, 146, 0.12)',
                  success: COLORS.green,
                  successLight: 'rgba(167, 192, 128, 0.12)',
                  info: COLORS.aqua,
                  infoLight: 'rgba(131, 192, 146, 0.12)',
                },
              },
            },
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </Box>
  )
}
