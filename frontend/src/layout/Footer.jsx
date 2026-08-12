import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        textAlign: 'center',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © 2026 PDF Actions. Todos los derechos reservados.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Author by Jonnathan Sotelo
      </Typography>
    </Box>
  )
}
