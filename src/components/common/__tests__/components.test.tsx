import { render, screen } from '@testing-library/react'
import Button from '../Button'
import LoadingSpinner from '../LoadingSpinner'
import Card from '../Card'
import Input from '../Input'
import Badge from '../Badge'

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    signOut: jest.fn(),
  }),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('Common Components', () => {
  describe('Button', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders with loading state', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-gray-600')

      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border-gray-300')
    })
  })

  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />)
      expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />)
      expect(screen.getByLabelText('読み込み中')).toHaveClass('w-4', 'h-4')

      rerender(<LoadingSpinner size="lg" />)
      expect(screen.getByLabelText('読み込み中')).toHaveClass('w-12', 'h-12')
    })
  })

  describe('Card', () => {
    it('renders children correctly', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies correct padding classes', () => {
      const { container, rerender } = render(<Card padding="sm">Content</Card>)
      expect(container.firstChild).toHaveClass('p-3')

      rerender(<Card padding="lg">Content</Card>)
      expect(container.firstChild).toHaveClass('p-6', 'sm:p-8')
    })
  })

  describe('Input', () => {
    it('renders with label', () => {
      render(<Input label="Test Label" />)
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    })

    it('shows error message', () => {
      render(<Input error="This is an error" />)
      expect(screen.getByText('This is an error')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveClass('border-red-300')
    })

    it('shows helper text', () => {
      render(<Input helperText="This is helper text" />)
      expect(screen.getByText('This is helper text')).toBeInTheDocument()
    })
  })

  describe('Badge', () => {
    it('renders with default variant', () => {
      render(<Badge>Default</Badge>)
      expect(screen.getByText('Default')).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Badge variant="success">Success</Badge>)
      expect(screen.getByText('Success')).toHaveClass('bg-green-100', 'text-green-800')

      rerender(<Badge variant="error">Error</Badge>)
      expect(screen.getByText('Error')).toHaveClass('bg-red-100', 'text-red-800')
    })
  })
})