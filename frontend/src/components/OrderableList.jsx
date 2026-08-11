import { useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { FiChevronDown, FiChevronUp, FiFile, FiImage, FiMove, FiTrash2 } from 'react-icons/fi'
import { COLORS } from '../theme.js'

export default function OrderableList({ items, onReorder, onRemove }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  function handleDrop(targetIndex) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    onReorder(dragIndex, targetIndex)
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <Stack spacing={1}>
      {items.map((item, index) => {
        const isImage = item.file.type.startsWith('image/')
        const FileIcon = isImage ? FiImage : FiFile
        const isDragging = dragIndex === index
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index
        return (
          <Paper
            key={item.key}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault()
              setOverIndex(index)
            }}
            onDragLeave={() => setOverIndex(null)}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(index)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
            sx={{
              p: 1.25,
              border: '1px solid',
              borderColor: isDragging ? COLORS.green : 'divider',
              bgcolor: isOver ? 'rgba(167, 192, 128, 0.1)' : 'background.paper',
              opacity: isDragging ? 0.55 : 1,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
            data-testid="orderable-item"
          >
            <Typography
              variant="caption"
              sx={{
                width: 22,
                height: 22,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: 'rgba(131, 192, 146, 0.15)',
                color: COLORS.aqua,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </Typography>
            <Box sx={{ color: COLORS.green, display: 'flex', alignItems: 'center' }}>
              <FileIcon size={20} aria-hidden="true" />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {item.file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(item.file.size / 1024).toFixed(0)} KB
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label={`Subir ${item.file.name}`}
              disabled={index === 0}
              onClick={() => onReorder(index, index - 1)}
            >
              <FiChevronUp size={16} />
            </IconButton>
            <IconButton
              size="small"
              aria-label={`Bajar ${item.file.name}`}
              disabled={index === items.length - 1}
              onClick={() => onReorder(index, index + 1)}
            >
              <FiChevronDown size={16} />
            </IconButton>
            <IconButton
              size="small"
              aria-label={`Quitar ${item.file.name}`}
              onClick={() => onRemove(index)}
            >
              <FiTrash2 size={16} />
            </IconButton>
            <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
              <FiMove size={16} aria-hidden="true" />
            </Box>
          </Paper>
        )
      })}
    </Stack>
  )
}
