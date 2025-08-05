// This file verifies that all components can be imported correctly
import Button from './Button'
import Header from './Header'
import Sidebar from './Sidebar'
import Layout from './Layout'
import LoadingSpinner from './LoadingSpinner'
import Card from './Card'
import Input from './Input'
import Badge from './Badge'

// Import from index
import {
  Button as ButtonFromIndex,
  Header as HeaderFromIndex,
  Sidebar as SidebarFromIndex,
  Layout as LayoutFromIndex,
  LoadingSpinner as LoadingSpinnerFromIndex,
  Card as CardFromIndex,
  Input as InputFromIndex,
  Badge as BadgeFromIndex,
} from './index'

// Type imports
import type { ButtonProps, InputProps } from './index'

console.log('All components imported successfully!')

// Export for verification
export {
  Button,
  Header,
  Sidebar,
  Layout,
  LoadingSpinner,
  Card,
  Input,
  Badge,
  ButtonFromIndex,
  HeaderFromIndex,
  SidebarFromIndex,
  LayoutFromIndex,
  LoadingSpinnerFromIndex,
  CardFromIndex,
  InputFromIndex,
  BadgeFromIndex,
}

export type { ButtonProps, InputProps }