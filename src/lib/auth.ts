import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export interface SignUpData {
  email: string
  password: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUp({ email, password }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new AuthError(error.message)
    }

    return data
  }

  /**
   * Sign in with email and password
   */
  static async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new AuthError(error.message)
    }

    return data
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw new AuthError(error.message)
    }

    return data
  }

  /**
   * Sign in with GitHub OAuth
   */
  static async signInWithGitHub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw new AuthError(error.message)
    }

    return data
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new AuthError(error.message)
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw new AuthError(error.message)
    }

    return data.session
  }

  /**
   * Get current user
   */
  static async getUser() {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      throw new AuthError(error.message)
    }

    return data.user
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      throw new AuthError(error.message)
    }
  }

  /**
   * Update password
   */
  static async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      throw new AuthError(error.message)
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: { email?: string; data?: any }) {
    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      throw new AuthError(error.message)
    }
  }
}