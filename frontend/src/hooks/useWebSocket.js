import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiBaseUrl } from '../api/axiosInstance'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]
const HEARTBEAT_INTERVAL_MS = 25000

function isLoopbackHost(hostname = '') {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  )
}

function buildWebSocketBaseUrl() {
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

export default function useWebSocket(conversationType, conversationId, accessToken) {
  const socketRef = useRef(null)
  const connectRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const closedByEffectRef = useRef(false)
  const heartbeatIntervalRef = useRef(null)
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('idle')

  const socketUrl = useMemo(() => {
    if (!conversationId || !accessToken || !conversationType) {
      return null
    }

    const baseUrl = buildWebSocketBaseUrl()
    const socketPath =
      conversationType === 'direct'
        ? `/ws/dm/${conversationId}/`
        : `/ws/chat/${conversationId}/`

    return `${baseUrl}${socketPath}?token=${encodeURIComponent(accessToken)}`
  }, [accessToken, conversationId, conversationType])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const clearHeartbeatInterval = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  const handleMessage = useCallback((event) => {
    try {
      const parsedMessage = JSON.parse(event.data)

      if (parsedMessage.type === 'pong') {
        return
      }

      if (parsedMessage.type === 'presence') {
        useChatStore.getState().updateMemberPresence({
          userId: parsedMessage.user_id,
          isOnline: Boolean(parsedMessage.is_online),
        })

        useAuthStore.getState().updateUserPresence({
          userId: parsedMessage.user_id,
          isOnline: Boolean(parsedMessage.is_online),
        })
      }

      setLastMessage(parsedMessage)
    } catch {
      // Ignore malformed websocket payloads.
    }
  }, [])

  const connect = useCallback(() => {
    if (!socketUrl) {
      return
    }

    clearReconnectTimer()
    clearHeartbeatInterval()
    setConnectionStatus(
      reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting',
    )

    const socket = new WebSocket(socketUrl)
    socketRef.current = socket

    socket.onopen = () => {
      reconnectAttemptRef.current = 0
      setConnectionStatus('open')
      clearHeartbeatInterval()
      heartbeatIntervalRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, HEARTBEAT_INTERVAL_MS)
    }

    socket.onmessage = handleMessage

    socket.onerror = () => {
      socket.close()
    }

    socket.onclose = () => {
      clearHeartbeatInterval()
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
  }, [clearHeartbeatInterval, clearReconnectTimer, handleMessage, socketUrl])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    closedByEffectRef.current = false
    clearReconnectTimer()
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
      clearHeartbeatInterval()
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [clearHeartbeatInterval, clearReconnectTimer, connect, socketUrl])

  const sendMessage = useCallback((payload) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return false
    }

    socketRef.current.send(JSON.stringify(payload))
    return true
  }, [])

  return {
    lastMessage,
    sendMessage,
    connectionStatus: socketUrl ? connectionStatus : 'idle',
  }
}
