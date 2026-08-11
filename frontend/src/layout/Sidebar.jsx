import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { NavLink } from 'react-router-dom'
import { FiFileText } from 'react-icons/fi'
import { NAV_ITEMS } from '../navigation.js'
import { COLORS } from '../theme.js'

export default function Sidebar({ onNavigate }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
      <Box sx={{ px: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(167, 192, 128, 0.15)',
            color: COLORS.green,
          }}
        >
          <FiFileText size={20} aria-hidden="true" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
            PDF Actions
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Herramientas de PDF
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mx: 2 }} />
      <List sx={{ px: 1, flexGrow: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            end={end}
            onClick={onNavigate}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              color: 'text.secondary',
              '&.active': {
                bgcolor: 'rgba(167, 192, 128, 0.14)',
                color: COLORS.green,
                '& .MuiListItemIcon-root': { color: COLORS.green },
              },
              '&:hover': {
                bgcolor: 'rgba(211, 198, 170, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <Icon size={19} aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
      <Typography variant="caption" color="text.disabled" sx={{ px: 2.5 }}>
        Sube, convierte y organiza tus PDFs localmente.
      </Typography>
    </Box>
  )
}
