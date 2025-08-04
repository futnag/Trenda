# Database Setup

This directory contains the database migrations and setup for the Theme Discovery Tool.

## Database Schema

The application uses the following core tables:

### Core Tables

1. **users** - User profiles and subscription information
2. **themes** - Development themes with monetization scores
3. **trend_data** - Time-series data for theme trends
4. **competitor_analysis** - Competitor information for each theme
5. **user_alerts** - User-configured alerts for themes
6. **subscriptions** - Stripe subscription management

## Migrations

### 001_create_core_tables.sql
Creates all core tables with:
- Proper data types and constraints
- Foreign key relationships
- Performance-optimized indexes
- JSONB fields for flexible data storage

### 002_setup_rls_policies.sql
Sets up Row Level Security (RLS) policies:
- Users can only access their own data
- Public read access for themes and trend data
- Service role access for data collection
- Automatic timestamp updates

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Data isolation between users
- Proper access control based on authentication
- Service role access for automated processes

### Data Validation
- Check constraints on enum fields
- Foreign key constraints for data integrity
- NOT NULL constraints on required fields

## Performance Optimizations

### Indexes
- Primary key indexes (automatic)
- Foreign key indexes for joins
- Composite indexes for common query patterns
- Descending indexes for time-series data

### Query Patterns
The indexes are optimized for:
- Theme filtering by category, score, difficulty
- Trend data time-series queries
- User-specific data access
- Subscription status checks

## Usage

To apply these migrations to your Supabase project:

1. Copy the SQL files to your Supabase project
2. Run them in order through the Supabase dashboard
3. Verify the tables and policies are created correctly

## Environment Variables

Make sure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

Use the database health check functions in `src/lib/database.ts`:

```typescript
import { databaseHealth } from '@/lib/database'

// Check connection
const isConnected = await databaseHealth.checkConnection()

// Get table counts
const counts = await databaseHealth.getTableCounts()
```