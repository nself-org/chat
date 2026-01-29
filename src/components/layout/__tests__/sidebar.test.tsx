import { render, screen } from '@testing-library/react'
import { Sidebar } from '../sidebar'
import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'

jest.mock('@/contexts/auth-context')
jest.mock('next/navigation')

describe('Sidebar Component', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    role: 'member' as const,
    avatarUrl: 'https://example.com/avatar.jpg',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    })
    ;(usePathname as jest.Mock).mockReturnValue('/chat/channel/general')
  })

  it('renders app title', () => {
    render(<Sidebar />)
    expect(screen.getByText('nChat')).toBeInTheDocument()
  })

  it('displays channels section', () => {
    render(<Sidebar />)
    expect(screen.getByText('Channels')).toBeInTheDocument()
  })

  it('renders default channels', () => {
    render(<Sidebar />)
    expect(screen.getByText('general')).toBeInTheDocument()
    expect(screen.getByText('random')).toBeInTheDocument()
    expect(screen.getByText('announcements')).toBeInTheDocument()
  })

  it('highlights active channel', () => {
    render(<Sidebar />)
    const generalLink = screen.getByText('general').closest('a')
    expect(generalLink).toHaveClass('bg-accent')
  })

  it('displays direct messages section', () => {
    render(<Sidebar />)
    expect(screen.getByText('Direct Messages')).toBeInTheDocument()
    expect(screen.getByText('Add teammates')).toBeInTheDocument()
  })

  it('shows user profile section', () => {
    render(<Sidebar />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('displays user avatar', () => {
    render(<Sidebar />)
    const avatar = document.querySelector('img[src="https://example.com/avatar.jpg"]')
    expect(avatar).toBeInTheDocument()
  })

  it('shows avatar fallback when no image', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, avatarUrl: undefined },
      loading: false,
    })
    
    render(<Sidebar />)
    expect(screen.getByText('T')).toBeInTheDocument() // First letter of display name
  })

  it('generates correct channel links', () => {
    render(<Sidebar />)
    
    const generalLink = screen.getByText('general').closest('a')
    expect(generalLink).toHaveAttribute('href', '/chat/channel/general')
    
    const randomLink = screen.getByText('random').closest('a')
    expect(randomLink).toHaveAttribute('href', '/chat/channel/random')
  })

  it('displays channel hash symbol', () => {
    render(<Sidebar />)
    const hashSymbols = screen.getAllByText('#')
    expect(hashSymbols.length).toBeGreaterThan(0)
  })

  it('handles different pathname correctly', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/chat/channel/random')
    
    render(<Sidebar />)
    
    const randomLink = screen.getByText('random').closest('a')
    expect(randomLink).toHaveClass('bg-accent')
    
    const generalLink = screen.getByText('general').closest('a')
    expect(generalLink).not.toHaveClass('bg-accent')
  })
})