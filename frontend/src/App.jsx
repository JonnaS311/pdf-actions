import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { FiFileText, FiMenu } from 'react-icons/fi'
import { OPERATIONS } from './operations.js'
import { COLORS } from './theme.js'
import Footer from './layout/Footer.jsx'
import Sidebar from './layout/Sidebar.jsx'
import HomePage from './pages/HomePage.jsx'
import OperationPage from './pages/OperationPage.jsx'

const DRAWER_WIDTH = 240

function OperationRoute() {
  const { operationId } = useParams()
  const operation = OPERATIONS.find((op) => op.id === operationId)
  if (!operation) return <Navigate to="/" replace />
  return <OperationPage key={operation.id} operation={operation} />
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: COLORS.background,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1.5, display: { md: 'none' } }}
          >
            <FiMenu />
          </IconButton>
          <FiFileText size={22} color={COLORS.green} aria-hidden="true" />
          <Typography variant="h6" sx={{ ml: 1.5 }}>
            PDF Actions
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ display: { xs: 'none', md: 'block' } }} aria-label="Navegación principal">
        <Drawer
          variant="permanent"
          open
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              top: 64,
              height: 'calc(100vh - 64px)',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          <Sidebar />
        </Drawer>
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          pt: { xs: 10, md: 10 },
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:operationId" element={<OperationRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      <Box sx={{ ml: { md: `${DRAWER_WIDTH}px` }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Footer />
      </Box>
      </Box>
    </BrowserRouter>
  )
}
