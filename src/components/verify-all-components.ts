/**
 * Simple verification script to check that all components can be imported
 * This script only checks imports without executing components
 */

// Common components
import Button from './common/Button'
import Header from './common/Header'
import Sidebar from './common/Sidebar'
import Layout from './common/Layout'
import LoadingSpinner from './common/LoadingSpinner'
import Card from './common/Card'
import Input from './common/Input'
import Badge from './common/Badge'

// Auth components
import { LoginForm } from './auth/LoginForm'
import { SignupForm } from './auth/SignupForm'
import { ProfileSettings } from './auth/ProfileSettings'
import { ProtectedRoute, AuthGuard } from './auth/ProtectedRoute'
import { AuthNavigation, useAuthRequirement } from './auth/AuthNavigation'
import { AuthStatus, FeatureGate } from './auth/AuthStatus'

// Index exports
import {
  Button as ButtonFromIndex,
  Header as HeaderFromIndex,
  Sidebar as SidebarFromIndex,
  Layout as LayoutFromIndex,
  LoadingSpinner as LoadingSpinnerFromIndex,
  Card as CardFromIndex,
  Input as InputFromIndex,
  Badge as BadgeFromIndex,
} from './common'

import {
  LoginForm as LoginFormFromIndex,
  SignupForm as SignupFormFromIndex,
  ProfileSettings as ProfileSettingsFromIndex,
  ProtectedRoute as ProtectedRouteFromIndex,
  AuthGuard as AuthGuardFromIndex,
  AuthNavigation as AuthNavigationFromIndex,
  AuthStatus as AuthStatusFromIndex,
  FeatureGate as FeatureGateFromIndex,
} from './auth'

console.log('✅ All component imports successful!')

// Verify component types exist
const componentChecklist = {
  'Common Components': {
    Button: !!Button,
    Header: !!Header,
    Sidebar: !!Sidebar,
    Layout: !!Layout,
    LoadingSpinner: !!LoadingSpinner,
    Card: !!Card,
    Input: !!Input,
    Badge: !!Badge,
  },
  'Auth Components': {
    LoginForm: !!LoginForm,
    SignupForm: !!SignupForm,
    ProfileSettings: !!ProfileSettings,
    ProtectedRoute: !!ProtectedRoute,
    AuthGuard: !!AuthGuard,
    AuthNavigation: !!AuthNavigation,
    AuthStatus: !!AuthStatus,
    FeatureGate: !!FeatureGate,
  },
  'Index Exports': {
    'Common Index': !!(ButtonFromIndex && HeaderFromIndex && SidebarFromIndex && LayoutFromIndex && LoadingSpinnerFromIndex && CardFromIndex && InputFromIndex && BadgeFromIndex),
    'Auth Index': !!(LoginFormFromIndex && SignupFormFromIndex && ProfileSettingsFromIndex && ProtectedRouteFromIndex && AuthGuardFromIndex && AuthNavigationFromIndex && AuthStatusFromIndex && FeatureGateFromIndex),
  }
}

console.log('\n📋 Component Verification Results:')
console.log('='.repeat(40))

Object.entries(componentChecklist).forEach(([category, components]) => {
  console.log(`\n${category}:`)
  Object.entries(components).forEach(([name, exists]) => {
    console.log(`  ${exists ? '✅' : '❌'} ${name}`)
  })
})

export default componentChecklist