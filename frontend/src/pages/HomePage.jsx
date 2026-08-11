import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiFileText } from 'react-icons/fi'
import { OPERATIONS } from '../operations.js'
import { operationIcon, operationRoute } from '../navigation.js'
import { COLORS } from '../theme.js'

export default function HomePage() {
  return (
    <Box>
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 2,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(167, 192, 128, 0.15)',
            color: COLORS.green,
          }}
        >
          <FiFileText size={30} aria-hidden="true" />
        </Box>
        <Typography variant="h3" component="h1">
          PDF Actions
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Herramientas rápidas y privadas para manipular tus documentos PDF.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Elige una operación para empezar. Tus archivos se eliminan del servidor tras cada
          operación.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {OPERATIONS.map((operation) => {
          const Icon = operationIcon(operation.id)
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={operation.id}>
              <Paper
                component={Link}
                to={operationRoute(operation.id)}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  textDecoration: 'none',
                  color: 'text.primary',
                  transition: 'border-color 0.15s ease, transform 0.15s ease',
                  '&:hover': {
                    borderColor: COLORS.aqua,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(131, 192, 146, 0.14)',
                      color: COLORS.aqua,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} aria-hidden="true" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" noWrap>
                      {operation.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {operation.filename}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  {operation.description}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: COLORS.green }}>
                  <Typography variant="button">Abrir</Typography>
                  <FiArrowRight size={15} aria-hidden="true" />
                </Stack>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
