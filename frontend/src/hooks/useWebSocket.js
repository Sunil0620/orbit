import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiBaseUrl } from '../api/axiosInstance'
import useChatStore from '../store/useChatStore'

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]

function buildWebSocketBaseUrl() {
  const explicitUrl = import.meta.env.VITE_WS_URL?.replace(/\/$/, '')
  if (explicitUrl) {
    return explicitUrl
  }

  const httpUrl = new URL(apiBaseUrl, window.location.origin)
  const protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${httpUrl.host}`
}

export default function useWebSocket(channelId, accessToken) {
  const socketRef = useRef(null)
  const connectRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const closedByEffectRef = useRef(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('idle')

  const socketUrl = useMemo(() => {
    if (!channelId || !accessToken) {
      return null
    }

    const baseUrl = buildWebSocketBaseUrl()
    return `${baseUrl}/ws/chat/${channelId}/?token=${encodeURIComponent(accessToken)}`
  }, [accessToken, channelId])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const handleMessage = useCallback((event) => {
    try {
      const parsedMessage = JSON.parse(event.data)

      if (parsedMessage.type === 'presence') {
        useChatStore.getState().updateMemberPresence({
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
    setConnectionStatus(
      reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting',
    )

    const socket = new WebSocket(socketUrl)
    socketRef.current = socket

    socket.onopen = () => {
      reconnectAttemptRef.current = 0
      setConnectionStatus('open')
    }

    socket.onmessage = handleMessage

    socket.onerror = () => {
      socket.close()
    }

    socket.onclose = () => {
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
  }, [clearReconnectTimer, handleMessage, socketUrl])

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
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [clearReconnectTimer, connect, socketUrl])

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
