import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiBaseUrl } from '../api/axiosInstance'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]
const PRESENCE_PING_INTERVAL_MS = 25000

function isLoopbackHost(hostname = '') {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function buildPresenceWebSocketBaseUrl() {
  const explicitUrl = import.meta.env.VITE_WS_URL?.replace(/\/$/, '')
  if (explicitUrl) {
    try {
      const currentHostname = window.location.hostname
      const parsedExplicitUrl = new URL(explicitUrl, window.location.origin)

      if (!isLoopbackHost(currentHostname) && isLoopbackHost(parsedExplicitUrl.hostname)) {
        throw new Error('Ignore loopback websocket URL on tunneled origins.')
      }

      return parsedExplicitUrl.toString().replace(/\/$/, '')
    } catch {
      // Fall through to the same-origin derived websocket URL.
    }
  }

  const httpUrl = new URL(apiBaseUrl, window.location.origin)
  const protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${httpUrl.host}`
}

export default function usePresenceSocket(accessToken) {
  const socketRef = useRef(null)
  const connectRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const closedByEffectRef = useRef(false)
  const pingIntervalRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('idle')

  const socketUrl = useMemo(() => {
    if (!accessToken) {
      return null
    }

    const baseUrl = buildPresenceWebSocketBaseUrl()
    return `${baseUrl}/ws/presence/?token=${encodeURIComponent(accessToken)}`
  }, [accessToken])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  const handleMessage = useCallback((event) => {
    try {
      const parsedMessage = JSON.parse(event.data)

      if (parsedMessage.type !== 'presence') {
        return
      }

      const nextPresence = {
        userId: parsedMessage.user_id,
        isOnline: Boolean(parsedMessage.is_online),
      }

      useChatStore.getState().updateMemberPresence(nextPresence)
      useAuthStore.getState().updateUserPresence(nextPresence)
    } catch {
      // Ignore malformed websocket payloads.
    }
  }, [])

  const connect = useCallback(() => {
    if (!socketUrl) {
      return
    }

    clearReconnectTimer()
    clearPingInterval()
    setConnectionStatus(
      reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting',
    )

    const socket = new WebSocket(socketUrl)
    socketRef.current = socket

    socket.onopen = () => {
      reconnectAttemptRef.current = 0
      setConnectionStatus('open')
      clearPingInterval()
      pingIntervalRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, PRESENCE_PING_INTERVAL_MS)
    }

    socket.onmessage = handleMessage

    socket.onerror = () => {
      socket.close()
    }

    socket.onclose = () => {
      clearPingInterval()

      if (closedByEffectRef.current) {
        setConnectionStatus('closed')
        return
      }

      const nextDelay = RECONNECT_DELAYS[reconnectAttemptRef.current]
      if (!nextDelay) {
        setConnectionStatus('closed')
        return
      }

      reconnectAttemptRef.current += 1
      setConnectionStatus('reconnecting')
      reconnectTimerRef.current = window.setTimeout(() => {
        connectRef.current?.()
      }, nextDelay)
    }
  }, [clearPingInterval, clearReconnectTimer, handleMessage, socketUrl])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    closedByEffectRef.current = false
    clearReconnectTimer()
    clearPingInterval()
    reconnectAttemptRef.current = 0

    if (!socketUrl) {
      return undefined
    }

    const initialConnectTimer = window.setTimeout(() => {
      connectRef.current?.()
    }, 0)

    return () => {
      window.clearTimeout(initialConnectTimer)
      closedByEffectRef.current = true
      clearReconnectTimer()
      clearPingInterval()
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [clearPingInterval, clearReconnectTimer, connect, socketUrl])

  return {
    connectionStatus: socketUrl ? connectionStatus : 'idle',
  }
}
