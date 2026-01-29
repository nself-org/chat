import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation')

// Test component to access auth context
function TestComponent() {
  const { user, loading, signIn, signUp, signOut, updateProfile } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password', 'testuser', 'Test User')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
      <button onClick={() => updateProfile({ displayName: 'Updated Name' })}>Update Profile</button>
    </div>
  )
}

// Mock fetch globally
global.fetch = jest.fn()

describe('AuthContext', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    localStorage.clear()
  })

  it('provides auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.getByTestId('user')).toBeInTheDocument()
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('initially shows loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
  })

  it('loads existing session from localStorage', async () => {
    const mockUser = {
      sub: '123',
      email: 'existing@example.com',
      username: 'existing',
      displayName: 'Existing User',
      role: 'member',
    }
    
    const mockToken = `mock.${Buffer.from(JSON.stringify(mockUser)).toString('base64')}.signature`
    localStorage.setItem('token', mockToken)
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('existing@example.com')
    })
  })

  it('handles sign in successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'mock.token.signature',
        user: {
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          role: 'member',
        },
      }),
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signInButton = screen.getByText('Sign In')
    
    await act(async () => {
      signInButton.click()
    })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signin', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      }))
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })
  })

  it('handles sign in failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signInButton = screen.getByText('Sign In')
    
    await expect(act(async () => {
      signInButton.click()
    })).rejects.toThrow('Sign in failed')
  })

  it('handles sign up successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'mock.token.signature',
        user: {
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          role: 'owner',
        },
      }),
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signUpButton = screen.getByText('Sign Up')
    
    await act(async () => {
      signUpButton.click()
    })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
          username: 'testuser',
          displayName: 'Test User',
        }),
      }))
      expect(mockPush).toHaveBeenCalledWith('/setup') // Owner goes to setup
    })
  })

  it('handles sign out', async () => {
    // Set up initial user
    const mockUser = {
      sub: '123',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'member',
    }
    
    const mockToken = `mock.${Buffer.from(JSON.stringify(mockUser)).toString('base64')}.signature`
    localStorage.setItem('token', mockToken)
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
    
    const signOutButton = screen.getByText('Sign Out')
    
    await act(async () => {
      signOutButton.click()
    })
    
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull()
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('handles profile update', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Updated Name',
        role: 'member',
      }),
    })
    
    // Set up initial user
    const mockUser = {
      sub: '123',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'member',
    }
    
    const mockToken = `mock.${Buffer.from(JSON.stringify(mockUser)).toString('base64')}.signature`
    localStorage.setItem('token', mockToken)
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
    
    const updateButton = screen.getByText('Update Profile')
    
    await act(async () => {
      updateButton.click()
    })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/profile', expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ displayName: 'Updated Name' }),
      }))
    })
  })
})