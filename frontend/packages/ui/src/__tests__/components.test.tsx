/**
 * Component tests for nself-chat UI package
 *
 * Tests all exported components for basic rendering and functionality
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from '../components/button'
import { Input } from '../components/input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/card'
import { Badge } from '../components/badge'
import { Avatar, AvatarImage, AvatarFallback } from '../components/avatar'

describe('UI Components', () => {
  describe('Button', () => {
    it('renders correctly', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>)
      expect(screen.getByText('Default')).toBeInTheDocument()

      rerender(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByText('Destructive')).toBeInTheDocument()

      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByText('Outline')).toBeInTheDocument()

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByText('Secondary')).toBeInTheDocument()

      rerender(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByText('Ghost')).toBeInTheDocument()

      rerender(<Button variant="link">Link</Button>)
      expect(screen.getByText('Link')).toBeInTheDocument()
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<Button size="default">Default Size</Button>)
      expect(screen.getByText('Default Size')).toBeInTheDocument()

      rerender(<Button size="sm">Small Size</Button>)
      expect(screen.getByText('Small Size')).toBeInTheDocument()

      rerender(<Button size="lg">Large Size</Button>)
      expect(screen.getByText('Large Size')).toBeInTheDocument()

      rerender(<Button size="icon">I</Button>)
      expect(screen.getByText('I')).toBeInTheDocument()
    })

    it('renders as disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toBeDisabled()
    })

    it('accepts custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByText('Custom')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Input', () => {
    it('renders correctly', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('shows error state', () => {
      render(<Input error="Error message" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows success state', () => {
      render(<Input success />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('accepts different types', () => {
      const { rerender } = render(<Input type="text" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')

      rerender(<Input type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

      rerender(<Input type="password" />)
      const passwordInput = document.querySelector('input[type="password"]')
      expect(passwordInput).toBeInTheDocument()
    })
  })

  describe('Card', () => {
    it('renders correctly with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here</CardContent>
        </Card>
      )
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      render(<Card className="custom-card">Content</Card>)
      const card = screen.getByText('Content').parentElement
      expect(card).toHaveClass('custom-card')
    })
  })

  describe('Badge', () => {
    it('renders correctly', () => {
      render(<Badge>New</Badge>)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Badge variant="default">Default</Badge>)
      expect(screen.getByText('Default')).toBeInTheDocument()

      rerender(<Badge variant="secondary">Secondary</Badge>)
      expect(screen.getByText('Secondary')).toBeInTheDocument()

      rerender(<Badge variant="destructive">Destructive</Badge>)
      expect(screen.getByText('Destructive')).toBeInTheDocument()

      rerender(<Badge variant="outline">Outline</Badge>)
      expect(screen.getByText('Outline')).toBeInTheDocument()
    })
  })

  describe('Avatar', () => {
    it('renders with fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('renders with image', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User Avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      const img = screen.getByAltText('User Avatar')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })
  })
})
