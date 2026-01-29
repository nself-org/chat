import { render, screen } from '@testing-library/react'
import { MessageList } from '../message-list'

describe('MessageList Component', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello world',
      userId: 'user1',
      userName: 'John Doe',
      userAvatar: 'https://example.com/avatar1.jpg',
      createdAt: new Date('2024-01-01T10:00:00'),
      isEdited: false,
    },
    {
      id: '2',
      content: 'This is a reply',
      userId: 'user2',
      userName: 'Jane Smith',
      createdAt: new Date('2024-01-01T10:05:00'),
      isEdited: true,
    },
    {
      id: '3',
      content: 'System message',
      userId: 'system',
      userName: 'System',
      createdAt: new Date('2024-01-01T10:10:00'),
    },
  ]

  it('renders all messages', () => {
    render(<MessageList messages={mockMessages} />)
    
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('This is a reply')).toBeInTheDocument()
    expect(screen.getByText('System message')).toBeInTheDocument()
  })

  it('displays user names', () => {
    render(<MessageList messages={mockMessages} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('shows edited indicator for edited messages', () => {
    render(<MessageList messages={mockMessages} />)
    
    const editedIndicators = screen.getAllByText('(edited)')
    expect(editedIndicators).toHaveLength(1)
  })

  it('formats timestamps correctly', () => {
    render(<MessageList messages={mockMessages} />)
    
    // Check for time format (e.g., "10:00 AM")
    expect(screen.getByText('10:00 AM')).toBeInTheDocument()
    expect(screen.getByText('10:05 AM')).toBeInTheDocument()
  })

  it('displays user avatars', () => {
    render(<MessageList messages={mockMessages} />)
    
    const avatar = document.querySelector('img[src="https://example.com/avatar1.jpg"]')
    expect(avatar).toBeInTheDocument()
  })

  it('shows avatar fallback for users without avatars', () => {
    render(<MessageList messages={mockMessages} />)
    
    // Jane Smith has no avatar, should show 'J' as fallback
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('applies opacity to system messages', () => {
    render(<MessageList messages={mockMessages} />)
    
    const systemMessage = screen.getByText('System message').closest('.flex')
    expect(systemMessage).toHaveClass('opacity-60')
  })

  it('renders empty list correctly', () => {
    render(<MessageList messages={[]} />)
    
    const messageContainer = document.querySelector('.flex.flex-col.space-y-4')
    expect(messageContainer).toBeInTheDocument()
    expect(messageContainer?.children).toHaveLength(0)
  })

  it('preserves whitespace in message content', () => {
    const messageWithWhitespace = [{
      id: '1',
      content: 'Line 1\nLine 2\n  Indented line',
      userId: 'user1',
      userName: 'Test User',
      createdAt: new Date(),
    }]
    
    render(<MessageList messages={messageWithWhitespace} />)
    
    const content = screen.getByText(/Line 1/).closest('.text-sm')
    expect(content).toHaveClass('whitespace-pre-wrap')
  })

  it('handles messages in correct order', () => {
    render(<MessageList messages={mockMessages} />)
    
    const messages = screen.getAllByText(/world|reply|message/)
    expect(messages[0]).toHaveTextContent('Hello world')
    expect(messages[1]).toHaveTextContent('This is a reply')
    expect(messages[2]).toHaveTextContent('System message')
  })
})