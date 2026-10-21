export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export interface DesktopNotification {
  title: string
  body: string
  icon?: string | null
  tag?: string
  onClick?: () => void
}

export function showDesktopNotification(options: DesktopNotification): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible' && document.hasFocus()) return
  try {
    const n = new Notification(options.title, {
      body: options.body,
      icon: options.icon ?? '/favicon.ico',
      tag: options.tag,
    })
    n.onclick = () => {
      window.focus()
      options.onClick?.()
      n.close()
    }
    setTimeout(() => n.close(), 8000)
  } catch {
    // ignore — e.g. notifications blocked by the OS
  }
}
