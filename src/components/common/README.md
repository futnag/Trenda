# Common UI Components

This directory contains reusable UI components that follow a unified design system using TailwindCSS. All components are designed to be responsive and performant, meeting the requirements 11.1 and 11.2.

## Components

### Button

A versatile button component with multiple variants and states.

```tsx
import { Button } from '@/components/common'

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With loading state
<Button loading>Loading...</Button>

// Full width
<Button fullWidth>Full Width</Button>

// As child (for Link components)
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

### LoadingSpinner

A customizable loading spinner component.

```tsx
import { LoadingSpinner } from '@/components/common'

// Basic usage
<LoadingSpinner />

// With different sizes
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />

// With different colors
<LoadingSpinner color="blue" />
<LoadingSpinner color="gray" />
<LoadingSpinner color="white" />
```

### Header

A responsive header component with navigation and user authentication.

```tsx
import { Header } from '@/components/common'

// Usage (automatically handles authentication state)
<Header />
```

Features:
- Responsive design with mobile menu
- User authentication dropdown
- Sticky positioning
- Automatic auth state handling

### Sidebar

A responsive sidebar navigation component.

```tsx
import { Sidebar } from '@/components/common'

// Basic usage
<Sidebar />

// With mobile controls
<Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

Features:
- Responsive design with mobile overlay
- Active route highlighting
- User profile section
- Pro feature badges

### Layout

A complete layout component that combines Header and Sidebar.

```tsx
import { Layout } from '@/components/common'

// Basic usage
<Layout>
  <YourPageContent />
</Layout>

// Without sidebar
<Layout showSidebar={false}>
  <YourPageContent />
</Layout>
```

### Card

A flexible card container component.

```tsx
import { Card } from '@/components/common'

// Basic usage
<Card>
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>

// With different padding
<Card padding="sm">Small padding</Card>
<Card padding="lg">Large padding</Card>

// With different shadows
<Card shadow="md">Medium shadow</Card>
<Card shadow="lg">Large shadow</Card>
```

### Input

A comprehensive input component with labels, errors, and icons.

```tsx
import { Input } from '@/components/common'

// Basic usage
<Input placeholder="Enter text" />

// With label
<Input label="Email" type="email" />

// With error
<Input label="Password" error="Password is required" />

// With helper text
<Input label="Username" helperText="Must be unique" />

// With icons
<Input 
  startIcon={<EmailIcon />}
  placeholder="Email"
/>

<Input 
  endIcon={<SearchIcon />}
  placeholder="Search"
/>

// Full width
<Input fullWidth label="Full Width Input" />
```

### Badge

A badge component for status indicators and labels.

```tsx
import { Badge } from '@/components/common'

// Basic usage
<Badge>Default</Badge>

// With variants
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>

// With sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

## Design System

### Colors

The components use a consistent color palette:

- **Primary**: Blue (blue-600, blue-700)
- **Secondary**: Gray (gray-600, gray-700)
- **Success**: Green (green-100, green-800)
- **Warning**: Yellow (yellow-100, yellow-800)
- **Error**: Red (red-100, red-800)
- **Info**: Blue (blue-100, blue-800)

### Typography

- **Font Family**: System font stack
- **Font Weights**: 
  - Normal (400)
  - Medium (500)
  - Bold (700)

### Spacing

Following TailwindCSS spacing scale:
- **sm**: 0.75rem (12px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)

### Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

## Performance Considerations

All components are optimized for performance:

1. **Lazy Loading**: Components use React.lazy where appropriate
2. **Memoization**: Expensive calculations are memoized
3. **Event Handling**: Proper cleanup of event listeners
4. **Bundle Size**: Tree-shakeable exports
5. **Accessibility**: ARIA labels and semantic HTML

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Testing

Each component includes comprehensive tests covering:

- Rendering with different props
- User interactions
- Accessibility features
- Error states
- Loading states

Run tests with:
```bash
npm test src/components/common/__tests__/
```

## Usage Guidelines

1. **Import from index**: Always import from the main index file for better tree-shaking
2. **Consistent styling**: Use the provided variants instead of custom classes
3. **Responsive design**: Components are responsive by default
4. **Performance**: Use loading states for better UX
5. **Accessibility**: Always provide proper labels and ARIA attributes