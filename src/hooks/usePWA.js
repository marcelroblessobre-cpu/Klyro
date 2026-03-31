import { useEffect } from 'react'

// Registra el Service Worker y gestiona notificaciones push locales
export function usePWA() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
}

// Pide permiso y programa notificación diaria
export async function requestNotifications() {
  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Programa recordatorio diario usando notificación local
// (sin servidor push — funciona offline también)
export function scheduleDailyReminder(hour = 9) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = new Date()
  const next = new Date()
  next.setHours(hour, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)

  const ms = next.getTime() - now.getTime()

  // Guardamos el timeout id en localStorage para no duplicar
  const existing = localStorage.getItem('klyro_notif_scheduled')
  if (existing) clearTimeout(Number(existing))

  const id = setTimeout(() => {
    new Notification('Klyro 💪', {
      body: 'Toca entrenar hoy. ¡No rompas la racha!',
      icon: '/icons/icon-192.png',
      tag: 'klyro-daily',
    })
    // Re-programar para mañana
    localStorage.removeItem('klyro_notif_scheduled')
    scheduleDailyReminder(hour)
  }, ms)

  localStorage.setItem('klyro_notif_scheduled', String(id))
}
