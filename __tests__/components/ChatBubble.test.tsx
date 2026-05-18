import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatBubble from '@/src/components/ChatBubble'
import type { ChatRoom, ChatMessage } from '@/src/types'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUsePathname = jest.fn(() => '/')
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

const mockChatContext = {
  rooms: [] as ChatRoom[],
  totalUnread: 0,
  isLoadingRooms: false,
  messages: {},
  loadingMessages: {},
  roomsError: null,
  messageErrors: {},
  reloadRooms: jest.fn(),
  loadMessagesForRoom: jest.fn(),
  sendMessage: jest.fn(),
  markRoomRead: jest.fn(),
  leaveRoom: jest.fn(),
}
jest.mock('@/src/context/ChatContext', () => ({
  useChatContext: () => mockChatContext,
}))

const mockAuth = { user: null as { id: string; name: string } | null }
jest.mock('@/src/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<ChatRoom> = {}): ChatRoom {
  return {
    id: 'room-1',
    eventTitle: 'Noche de Jazz',
    eventImageUrl: 'https://example.com/image.jpg',
    eventAddress: 'Bellavista 100',
    memberCount: 5,
    lastMessage: { id: 'msg-1', roomId: 'room-1', userId: 'u1', text: 'Hola a todos', timestamp: new Date().toISOString() } as ChatMessage,
    unreadCount: 0,
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUsePathname.mockReturnValue('/')
  mockAuth.user = null
  mockChatContext.rooms = []
  mockChatContext.totalUnread = 0
  mockChatContext.isLoadingRooms = false
})

describe('ChatBubble', () => {
  describe('visibilidad', () => {
    it('no renderiza nada si el usuario no está autenticado', () => {
      mockAuth.user = null
      const { container } = render(<ChatBubble />)
      expect(container).toBeEmptyDOMElement()
    })

    it('no renderiza en la página /chat', () => {
      mockAuth.user = { id: 'u1', name: 'Test' }
      mockUsePathname.mockReturnValue('/chat')
      const { container } = render(<ChatBubble />)
      expect(container).toBeEmptyDOMElement()
    })

    it('no renderiza en /chat/[roomId]', () => {
      mockAuth.user = { id: 'u1', name: 'Test' }
      mockUsePathname.mockReturnValue('/chat/room-abc')
      const { container } = render(<ChatBubble />)
      expect(container).toBeEmptyDOMElement()
    })

    it('renderiza el botón cuando el usuario está autenticado', () => {
      mockAuth.user = { id: 'u1', name: 'Test' }
      render(<ChatBubble />)
      expect(screen.getByRole('button', { name: /abrir chat/i })).toBeInTheDocument()
    })
  })

  describe('badge de mensajes no leídos', () => {
    it('no muestra badge cuando totalUnread es 0', () => {
      mockAuth.user = { id: 'u1', name: 'Test' }
      mockChatContext.totalUnread = 0
      render(<ChatBubble />)
      expect(screen.queryByText('9+')).not.toBeInTheDocument()
    })

    it('muestra el conteo exacto cuando hay menos de 10 no leídos', () => {
      mockAuth.user = { id: 'u1', name: 'Test' }
      mockChatContext.totalUnread = 3
      render(<ChatBubble />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('muestra "9+" cuando hay más de 9 no leídos', () => {
      mockAuth.user = { id: 'u1', name: 'Test' }
      mockChatContext.totalUnread = 15
      render(<ChatBubble />)
      expect(screen.getByText('9+')).toBeInTheDocument()
    })
  })

  describe('panel de chat', () => {
    beforeEach(() => {
      mockAuth.user = { id: 'u1', name: 'Test' }
    })

    it('el panel no es visible inicialmente', () => {
      render(<ChatBubble />)
      expect(screen.queryByText('Comunidad')).not.toBeInTheDocument()
    })

    it('abre el panel al hacer clic en el botón', async () => {
      const user = userEvent.setup()
      render(<ChatBubble />)
      await user.click(screen.getByRole('button', { name: /abrir chat/i }))
      expect(screen.getByText('Comunidad')).toBeInTheDocument()
    })

    it('muestra spinner cuando está cargando rooms', async () => {
      const user = userEvent.setup()
      mockChatContext.isLoadingRooms = true
      render(<ChatBubble />)
      await user.click(screen.getByRole('button', { name: /abrir chat/i }))
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('muestra mensaje vacío cuando no hay rooms', async () => {
      const user = userEvent.setup()
      mockChatContext.rooms = []
      render(<ChatBubble />)
      await user.click(screen.getByRole('button', { name: /abrir chat/i }))
      expect(screen.getByText(/no perteneces a ninguna comunidad/i)).toBeInTheDocument()
    })

    it('muestra las rooms con su título y último mensaje', async () => {
      const user = userEvent.setup()
      mockChatContext.rooms = [makeRoom()]
      render(<ChatBubble />)
      await user.click(screen.getByRole('button', { name: /abrir chat/i }))
      expect(screen.getByText('Noche de Jazz')).toBeInTheDocument()
      expect(screen.getByText('Hola a todos')).toBeInTheDocument()
    })

    it('muestra badge de no leídos por sala', async () => {
      const user = userEvent.setup()
      mockChatContext.rooms = [makeRoom({ unreadCount: 4 })]
      render(<ChatBubble />)
      await user.click(screen.getByRole('button', { name: /abrir chat/i }))
      // El badge dentro del panel de la sala
      const badges = screen.getAllByText('4')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('cierra el panel al hacer clic en el botón de nuevo', async () => {
      const user = userEvent.setup()
      render(<ChatBubble />)
      await user.click(screen.getByRole('button', { name: /abrir chat/i }))
      await user.click(screen.getByRole('button', { name: /cerrar chat/i }))
      await waitFor(() => {
        expect(screen.queryByText('Comunidad')).not.toBeInTheDocument()
      })
    })

    it('tiene el link "Ver todo" apuntando a /chat', async () => {
      const user = userEvent.setup()
      render(<ChatBubble />)
      await user.click(screen.getByRole('button', { name: /abrir chat/i }))
      const verTodoLink = screen.getByRole('link', { name: /ver todo/i })
      expect(verTodoLink).toHaveAttribute('href', '/chat')
    })
  })
})
