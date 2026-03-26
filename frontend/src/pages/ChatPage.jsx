import Sidebar from '../components/layout/Sidebar'
import ChannelList from '../components/layout/ChannelList'
import ChatWindow from '../components/chat/ChatWindow'
import useAuthStore from '../store/useAuthStore'

const placeholderServers = [
  { id: 1, name: 'Orbit Crew' },
  { id: 2, name: 'Launch Room' },
  { id: 3, name: 'Design Desk' },
]

const placeholderChannels = [
  { id: 11, name: 'general', channel_type: 'text' },
  { id: 12, name: 'announcements', channel_type: 'announcement' },
  { id: 13, name: 'handoff', channel_type: 'text' },
]

const placeholderMessages = [
  {
    id: 1,
    author: 'Orbit',
    content:
      'Day 11 ships the workspace shell. Server state, channel data, and real message history connect in the next steps.',
  },
  {
    id: 2,
    author: 'System',
    content:
      'This center pane is now a dedicated chat surface instead of a generic protected-route card.',
  },
]

function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const activeServer = placeholderServers[0]
  const activeChannel = placeholderChannels[0]

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-50">
        Logged in as <span className="font-semibold">{user?.username ?? 'orbit-user'}</span>.
        The shell is live and ready for real server/channel wiring.
      </div>

      <div className="grid gap-4 xl:grid-cols-[84px_280px_minmax(0,1fr)]">
        <Sidebar servers={placeholderServers} activeServerId={activeServer.id} />
        <ChannelList
          server={activeServer}
          channels={placeholderChannels}
          activeChannelId={activeChannel.id}
        />
        <ChatWindow
          server={activeServer}
          channel={activeChannel}
          messages={placeholderMessages}
        />
      </div>
    </div>
  )
}

export default ChatPage
