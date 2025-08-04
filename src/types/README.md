# Type Definitions and Validation

This directory contains comprehensive TypeScript type definitions and Zod validation schemas for the Theme Discovery Tool application.

## Overview

The type system provides:
- **Type Safety**: Complete TypeScript types for all data structures
- **Runtime Validation**: Zod schemas for validating data at runtime
- **API Contracts**: Request/response types for all API endpoints
- **Database Types**: Supabase-compatible database types
- **Utility Functions**: Helper functions for validation and type checking

## File Structure

```
src/types/
├── index.ts          # Main type definitions and Zod schemas
├── validation.ts     # Validation utilities and type guards
├── examples.ts       # Usage examples and sample data
├── __tests__/        # Test files
│   └── types.test.ts # Comprehensive test suite
└── README.md         # This documentation
```

## Core Types

### Theme
Represents a development theme/idea with monetization analysis:
```typescript
interface Theme {
  id: string
  title: string
  description: string
  category: ThemeCategory
  monetizationScore: number
  marketSize: number
  competitionLevel: CompetitionLevel
  technicalDifficulty: TechnicalDifficulty
  estimatedRevenue: { min: number; max: number }
  dataSources: DataSource[]
  monetizationFactors?: MonetizationFactors
  revenueProjection?: RevenueProjection
  createdAt: string
  updatedAt: string
}
```

### User
Represents a user account with subscription information:
```typescript
interface User {
  id: string
  email: string
  subscriptionTier: SubscriptionTier
  stripeCustomerId?: string
  preferences?: {
    categories?: ThemeCategory[]
    regions?: string[]
    notifications: boolean
  }
  createdAt: string
  updatedAt: string
}
```

### TrendData
Represents trend analysis data from external sources:
```typescript
interface TrendData {
  id: string
  themeId: string
  source: DataSourceType
  searchVolume: number
  growthRate: number
  geographicData?: Record<string, number>
  demographicData?: DemographicData
  timestamp: string
  metadata?: Record<string, unknown>
}
```

### DemographicData
Represents demographic segmentation data:
```typescript
interface DemographicData {
  country: string
  region?: string
  ageGroup: AgeGroup
  gender: Gender
  ethnicity?: string
  incomeLevel: IncomeLevel
}
```

## Enums and Constants

All enum values are available as both TypeScript types and runtime constants:

```typescript
// Theme categories
export const ThemeCategory = {
  PRODUCTIVITY: 'productivity',
  ENTERTAINMENT: 'entertainment',
  EDUCATION: 'education',
  HEALTH: 'health',
  FINANCE: 'finance',
  SOCIAL: 'social',
} as const

// Competition levels
export const CompetitionLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

// Technical difficulty levels
export const TechnicalDifficulty = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const

// Subscription tiers
export const SubscriptionTier = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
} as const
```

## Validation

### Basic Validation
```typescript
import { validateData, ThemeSchema } from '@/types'

const result = validateData(ThemeSchema, someData)
if (result.success) {
  // Data is valid, use result.data
  console.log('Valid theme:', result.data.title)
} else {
  // Data is invalid, check result.errors
  console.log('Validation errors:', result.errors)
}
```

### Safe Parsing
```typescript
import { safeParseData, UserSchema } from '@/types'

const user = safeParseData(UserSchema, unknownData)
if (user) {
  // Successfully parsed
  console.log('User email:', user.email)
} else {
  // Failed to parse, handle gracefully
  console.log('Invalid user data')
}
```

### API Request Validation
```typescript
import { validateAPIRequest, ThemeFilterRequestSchema } from '@/types'

try {
  const validatedRequest = validateAPIRequest(
    ThemeFilterRequestSchema,
    requestBody
  )
  // Request is valid, proceed with processing
} catch (error) {
  // Request validation failed, return error response
  return res.status(400).json(error)
}
```

## API Types

### Request Types
- `ThemeFilterRequest` - For filtering themes
- `CreateThemeRequest` - For creating new themes
- `UserRegistrationRequest` - For user registration
- `UserLoginRequest` - For user login
- `CreateAlertRequest` - For creating alerts

### Response Types
- `APIResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated response wrapper

### Example API Response
```typescript
import { APIResponse, Theme } from '@/types'

const response: APIResponse<Theme> = {
  data: theme,
  message: 'Theme retrieved successfully',
  timestamp: new Date().toISOString(),
}
```

## Database Integration

The types include Supabase-compatible database types:

```typescript
import { Database } from '@/types'

// Use with Supabase client
const supabase = createClient<Database>(url, key)

// Type-safe database operations
const { data: themes } = await supabase
  .from('themes')
  .select('*')
  .eq('category', 'productivity')
```

## Type Guards

Utility functions for runtime type checking:

```typescript
import { 
  isThemeCategory, 
  isValidUUID, 
  isValidEmail 
} from '@/types/validation'

if (isThemeCategory(someString)) {
  // someString is now typed as ThemeCategory
}

if (isValidUUID(id)) {
  // id is a valid UUID string
}

if (isValidEmail(email)) {
  // email is a valid email address
}
```

## Utility Functions

### Pagination
```typescript
import { validatePaginationParams } from '@/types/validation'

const { page, limit } = validatePaginationParams(
  req.query.page,
  req.query.limit
)
```

### Data Sanitization
```typescript
import { 
  normalizeThemeTitle,
  sanitizeSearchQuery 
} from '@/types/validation'

const title = normalizeThemeTitle(userInput)
const query = sanitizeSearchQuery(searchTerm)
```

## Testing

The type system includes comprehensive tests. Run them with:

```bash
npm test -- src/types/__tests__/types.test.ts
```

## Examples

See `src/types/examples.ts` for complete usage examples including:
- Data validation
- API request/response handling
- Database operations
- Type-safe filtering and analysis
- Error handling

## Best Practices

1. **Always validate external data** using the provided schemas
2. **Use type guards** for runtime type checking
3. **Leverage constants** instead of string literals
4. **Handle validation errors** gracefully
5. **Use safe parsing** when data validity is uncertain

## Adding New Types

When adding new types:

1. Define the TypeScript interface
2. Create a corresponding Zod schema
3. Add validation tests
4. Update this documentation
5. Add usage examples

Example:
```typescript
// 1. Define interface
export interface NewType {
  id: string
  name: string
}

// 2. Create schema
export const NewTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
})

// 3. Export inferred type
export type NewType = z.infer<typeof NewTypeSchema>
```

## Migration Guide

When updating types:

1. Update the schema first
2. Run tests to identify breaking changes
3. Update dependent code
4. Update documentation and examples
5. Consider backward compatibility

This type system ensures data integrity, provides excellent developer experience, and maintains consistency across the entire application.