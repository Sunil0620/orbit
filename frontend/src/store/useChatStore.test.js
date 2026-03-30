import { beforeEach, describe, expect, it } from 'vitest'

import useChatStore from './useChatStore'


describe('useChatStore unread behavior', () => {
  beforeEach(() => {
    useChatStore.getState().resetChatState()
  })

  it('clears a channel unread badge when the channel is marked as read', () => {
    useChatStore.getState().setChannels([
      { id: 1, name: 'general', unread_count: 3 },
      { id: 2, name: 'design', unread_count: 1 },
    ])

    useChatStore.getState().markChannelRead({
      channelId: 1,
      lastReadMessageId: 42,
    })

    const state = useChatStore.getState()

    expect(state.channels.find((channel) => channel.id === 1)?.unread_count).toBe(0)
    expect(state.channels.find((channel) => channel.id === 2)?.unread_count).toBe(1)
    expect(state.lastReadMessageId[1]).toBe(42)
  })

  it('clears a direct conversation unread badge and stores the last read message id', () => {
    useChatStore.getState().setDirectConversations([
      {
        id: 7,
        unread_count: 5,
        participant: { id: 13, username: 'maya' },
        last_message_at: '2026-03-30T10:00:00Z',
        updated_at: '2026-03-30T10:00:00Z',
        created_at: '2026-03-30T09:00:00Z',
      },
    ])

    useChatStore.getState().markDirectConversationRead({
      conversationId: 7,
      lastReadMessageId: 88,
    })

    const state = useChatStore.getState()

    expect(state.directConversations[0].unread_count).toBe(0)
    expect(state.lastReadDirectMessageId[7]).toBe(88)
  })

  it('keeps the active direct conversation at zero unread when a live message arrives', () => {
    useChatStore.getState().setDirectConversations([
      {
        id: 9,
        unread_count: 2,
        participant: { id: 21, username: 'alex' },
        last_message_at: '2026-03-30T10:00:00Z',
        updated_at: '2026-03-30T10:00:00Z',
        created_at: '2026-03-30T09:00:00Z',
      },
    ])
    useChatStore.getState().setActiveDirectConversation(9)
    useChatStore.getState().appendMessage({
      id: 100,
      direct_conversation_id: 9,
      content: 'Live update',
      sender: { id: 21, username: 'alex' },
      timestamp: '2026-03-30T10:05:00Z',
    })

    const state = useChatStore.getState()

    expect(state.directConversations[0].unread_count).toBe(0)
    expect(state.lastReadDirectMessageId[9]).toBe(100)
    expect(state.messagesByDirectConversation[9]).toHaveLength(1)
  })

  it('updates reactions for a message across the active message list and cache', () => {
    useChatStore.getState().setActiveChannel(3)
    useChatStore.getState().setMessages([
      {
        id: 12,
        channel_id: 3,
        content: 'Ship it',
        reactions: [],
        sender: { id: 1, username: 'maya' },
      },
    ])

    useChatStore.getState().setMessageReactions({
      messageId: 12,
      reactions: [
        {
          emoji: '🔥',
          count: 2,
          reacted_by_current_user: true,
        },
      ],
    })

    const state = useChatStore.getState()

    expect(state.messages[0].reactions[0].emoji).toBe('🔥')
    expect(state.messagesByChannel[3][0].reactions[0].count).toBe(2)
  })
})
