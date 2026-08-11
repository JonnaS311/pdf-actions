import { FiFileText, FiHome, FiImage, FiLayers, FiMinimize2, FiRotateCw, FiScissors } from 'react-icons/fi'

export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: FiHome, end: true },
  { to: '/merge', label: 'Unir PDF', icon: FiLayers },
  { to: '/split', label: 'Dividir PDF', icon: FiScissors },
  { to: '/compress', label: 'Comprimir PDF', icon: FiMinimize2 },
  { to: '/to-jpg', label: 'PDF a JPG', icon: FiImage },
  { to: '/jpg-to-pdf', label: 'JPG a PDF', icon: FiFileText },
  { to: '/rotate', label: 'Rotar PDF', icon: FiRotateCw },
]

export function operationIcon(id) {
  const item = NAV_ITEMS.find((nav) => nav.to === `/${id}`)
  return item ? item.icon : FiFileText
}

export function operationRoute(id) {
  return `/${id}`
}
