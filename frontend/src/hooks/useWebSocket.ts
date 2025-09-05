import { useEffect, useRef } from 'react'

type GestureEvent =
  | { action: 'toggle_play' }
  | { action: 'next_track' }
  | { action: 'previous_track' }
  | { action: 'volume_control'; value: number }

type Handlers = {
  onTogglePlay: () => void
  onNext: () => void
  onPrevious: () => void
  onVolume: (value: number) => void
}

export function useWebSocket(url: string, handlers: Handlers, options?: { enabled?: boolean }) {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<number>(0)
  const handlersRef = useRef<Handlers>(handlers)
  const enabled = options?.enabled ?? true

  // Keep latest handlers without recreating the connection
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!enabled) {
      // If disabled, ensure any open socket is closed and skip connecting
      try { socketRef.current?.close() } catch {}
      socketRef.current = null
      return
    }
    let isMounted = true
    const lastActionAt: Record<string, number> = {}
    let lastVolumeTs = 0

    function callWithCooldown(action: string, fn: () => void, cooldownMs = 500) {
      const now = Date.now()
      if ((lastActionAt[action] ?? 0) + cooldownMs > now) return
      lastActionAt[action] = now
      fn()
    }

    function connect() {
      if (!isMounted) return
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        reconnectRef.current = 0
      }

      ws.onmessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as GestureEvent
          const h = handlersRef.current
          switch (data.action) {
            case 'toggle_play':
              callWithCooldown('toggle_play', () => h.onTogglePlay())
              break
            case 'next_track':
              callWithCooldown('next_track', () => h.onNext())
              break
            case 'previous_track':
              callWithCooldown('previous_track', () => h.onPrevious())
              break
            case 'volume_control': {
              const v = Number((data as any).value ?? 0)
              const now = Date.now()
              if (now - lastVolumeTs > 150) {
                lastVolumeTs = now
                h.onVolume(v)
              }
              break
            }
          }
        } catch {}
      }

      ws.onclose = () => {
        if (!isMounted) return
        const backoff = Math.min(1000 * Math.pow(2, reconnectRef.current++), 15000)
        setTimeout(connect, backoff)
      }
      ws.onerror = () => {
        try { ws.close() } catch {}
      }
    }

    connect()

    return () => {
      isMounted = false
      try { socketRef.current?.close() } catch {}
      socketRef.current = null
    }
  }, [url, enabled])
}


