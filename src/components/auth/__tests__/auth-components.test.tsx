import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../LoginForm'
import { SignupForm } from '../SignupForm'
import { ProfileSettings } from '../ProfileSettings'
import { ProtectedRoute, AuthGuard } from '../ProtectedRoute'
import { AuthNavigation } from '../AuthNavigation'
import { AuthStatus, FeatureGate } from '../AuthStatus'

// Mock the useAuth hook
const mockUseAuth = {
  user: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithGitHub: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
}

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  },
}))

describe('Authentication Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.user = null
    mockUseAuth.loading = false
  })

  describe('LoginForm', () => {
    it('renders login form correctly', () => {
      render(<LoginForm />)
      
      expect(screen.getByText('ログイン')).toBeInTheDocument()
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
      expect(screen.getByText('Googleでログイン')).toBeInTheDocument()
      expect(screen.getByText('GitHubでログイン')).toBeInTheDocument()
    })

    it('handles form submission', async () => {
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText('メールアドレス')
      const passwordInput = screen.getByLabelText('パスワード')
      const submitButton = screen.getByRole('button', { name: 'ログイン' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUseAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('handles OAuth login', async () => {
      render(<LoginForm />)
      
      const googleButton = screen.getByText('Googleでログイン')
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(mockUseAuth.signInWithGoogle).toHaveBeenCalled()
      })
    })

    it('redirects authenticated users', () => {
      mockUseAuth.user = { id: '1', email: 'test@example.com' }
      render(<LoginForm />)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('SignupForm', () => {
    it('renders signup form correctly', () => {
      render(<SignupForm />)
      
      expect(screen.getByText('新規登録')).toBeInTheDocument()
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
      expect(screen.getByLabelText('パスワード確認')).toBeInTheDocument()
    })

    it('validates password confirmation', async () => {
      render(<SignupForm />)
      
      const emailInput = screen.getByLabelText('メールアドレス')
      const passwordInput = screen.getByLabelText('パスワード')
      const confirmPasswordInput = screen.getByLabelText('パスワード確認')
      const submitButton = screen.getByRole('button', { name: '新規登録' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
      })
    })
  })

  describe('ProtectedRoute', () => {
    it('shows login form for unauthenticated users', () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )
      
      expect(screen.getByText('ログインが必要です')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('shows content for authenticated users', () => {
      mockUseAuth.user = { id: '1', email: 'test@example.com' }
      
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  describe('AuthGuard', () => {
    it('shows upgrade prompt for insufficient subscription tier', () => {
      mockUseAuth.user = { 
        id: '1', 
        email: 'test@example.com',
        user_metadata: { subscription_tier: 'free' }
      }
      
      render(
        <AuthGuard subscriptionTier="pro">
          <div>Pro Content</div>
        </AuthGuard>
      )
      
      expect(screen.getByText('プランをアップグレード')).toBeInTheDocument()
      expect(screen.queryByText('Pro Content')).not.toBeInTheDocument()
    })
  })

  describe('AuthNavigation', () => {
    it('shows login buttons for unauthenticated users', () => {
      render(<AuthNavigation />)
      
      expect(screen.getByText('ログイン')).toBeInTheDocument()
      expect(screen.getByText('新規登録')).toBeInTheDocument()
    })

    it('shows user info for authenticated users', () => {
      mockUseAuth.user = { id: '1', email: 'test@example.com' }
      
      render(<AuthNavigation />)
      
      expect(screen.getByText('T')).toBeInTheDocument() // User initial
    })
  })

  describe('AuthStatus', () => {
    it('shows unauthenticated status', () => {
      render(<AuthStatus />)
      
      expect(screen.getByText('未ログイン')).toBeInTheDocument()
    })

    it('shows subscription tier for authenticated users', () => {
      mockUseAuth.user = { 
        id: '1', 
        email: 'test@example.com',
        user_metadata: { subscription_tier: 'pro' }
      }
      
      render(<AuthStatus />)
      
      expect(screen.getByText('プロプラン')).toBeInTheDocument()
    })
  })

  describe('FeatureGate', () => {
    it('shows content for users with sufficient tier', () => {
      mockUseAuth.user = { 
        id: '1', 
        email: 'test@example.com',
        user_metadata: { subscription_tier: 'pro' }
      }
      
      render(
        <FeatureGate requiredTier="basic">
          <div>Feature Content</div>
        </FeatureGate>
      )
      
      expect(screen.getByText('Feature Content')).toBeInTheDocument()
    })

    it('shows upgrade prompt for insufficient tier', () => {
      mockUseAuth.user = { 
        id: '1', 
        email: 'test@example.com',
        user_metadata: { subscription_tier: 'free' }
      }
      
      render(
        <FeatureGate requiredTier="pro">
          <div>Feature Content</div>
        </FeatureGate>
      )
      
      expect(screen.getByText('プロプラン限定機能')).toBeInTheDocument()
      expect(screen.queryByText('Feature Content')).not.toBeInTheDocument()
    })
  })
})