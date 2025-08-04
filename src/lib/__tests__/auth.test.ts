/**
 * Authentication System Tests
 * 
 * These tests verify that the authentication system components
 * are properly structured and can be imported without errors.
 */

import { describe, it, expect } from '@jest/globals'

describe('Authentication System', () => {
  it('should export AuthService class', async () => {
    const { AuthService } = await import('../auth')
    expect(AuthService).toBeDefined()
    expect(typeof AuthService.signUp).toBe('function')
    expect(typeof AuthService.signIn).toBe('function')
    expect(typeof AuthService.signOut).toBe('function')
  })

  it('should have proper method signatures', async () => {
    const { AuthService } = await import('../auth')
    
    // Check that methods exist and are functions
    expect(typeof AuthService.signUp).toBe('function')
    expect(typeof AuthService.signIn).toBe('function')
    expect(typeof AuthService.signInWithGoogle).toBe('function')
    expect(typeof AuthService.signInWithGitHub).toBe('function')
    expect(typeof AuthService.signOut).toBe('function')
    expect(typeof AuthService.getSession).toBe('function')
    expect(typeof AuthService.getUser).toBe('function')
    expect(typeof AuthService.resetPassword).toBe('function')
    expect(typeof AuthService.updatePassword).toBe('function')
    expect(typeof AuthService.updateProfile).toBe('function')
  })

  it('should export proper TypeScript interfaces', async () => {
    const authModule = await import('../auth')
    
    // Check that interfaces are properly exported
    expect(authModule).toHaveProperty('AuthService')
    
    // These would be type-only exports, so we can't test them at runtime
    // but we can verify the module imports without errors
  })
})

describe('Authentication Components', () => {
  it('should export LoginForm component', async () => {
    const { LoginForm } = await import('../../components/auth/LoginForm')
    expect(LoginForm).toBeDefined()
    expect(typeof LoginForm).toBe('function')
  })

  it('should export SignupForm component', async () => {
    const { SignupForm } = await import('../../components/auth/SignupForm')
    expect(SignupForm).toBeDefined()
    expect(typeof SignupForm).toBe('function')
  })

  it('should export ProfileSettings component', async () => {
    const { ProfileSettings } = await import('../../components/auth/ProfileSettings')
    expect(ProfileSettings).toBeDefined()
    expect(typeof ProfileSettings).toBe('function')
  })

  it('should export ProtectedRoute component', async () => {
    const { ProtectedRoute } = await import('../../components/auth/ProtectedRoute')
    expect(ProtectedRoute).toBeDefined()
    expect(typeof ProtectedRoute).toBe('function')
  })
})

describe('Authentication Hook', () => {
  it('should export useAuth hook and AuthProvider', async () => {
    const authHook = await import('../../hooks/useAuth')
    expect(authHook.useAuth).toBeDefined()
    expect(authHook.AuthProvider).toBeDefined()
    expect(typeof authHook.useAuth).toBe('function')
    expect(typeof authHook.AuthProvider).toBe('function')
  })
})