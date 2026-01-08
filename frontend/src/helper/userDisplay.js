import { calculateHexColorByString } from '@/helper/Colors'

export const getInitials = (user) => {
  if (!user) return '??'
  const first = user.collaborator?.firstName?.[0] || ''
  const last = user.collaborator?.lastName?.[0] || ''
  const nameInit = (first + last).toUpperCase()
  if (nameInit) return nameInit
  if (user.email?.length >= 2) return user.email.slice(0, 2).toUpperCase()
  if (user.id?.length >= 2) return user.id.slice(0, 2).toUpperCase()
  return '??'
}

export const getAvatarColor = (user) => {
  const key = typeof user?.id === 'string' ? user.id : String(user || '')
  return calculateHexColorByString(key || 'user')
}

export const displayName = (user) => {
  if (!user) return 'Usuario'
  const fn = user.collaborator?.firstName || ''
  const ln = user.collaborator?.lastName || ''
  const name = `${fn} ${ln}`.trim()
  return name || user.email || user.id || 'Usuario'
}
