# Data Collection Edge Function

This Edge Function collects trend data from multiple external APIs and stores it in the Supabase database.

## Supported Data Sources

1. **Google Trends** - Search volume and trend data
2. **Reddit** - Community discussions and engagement metrics
3. **Twitter** - Social media mentions and hashtag trends
4. **Product Hunt** - Product launches and maker activity
5. **GitHub** - Repository trends and developer activity

## Features

- **Rate Limiting**: Automatic rate limit management for each API
- **Error Handling**: Comprehensive error handling with retry logic
- **Exponential Backoff**: Smart retry mechanism with exponential backoff
- **Data Validation**: Input validation and data sanitization
- **Authentication**: User authentication required for access

## Environment Variables

The following environment variables need to be configured:

```bash
# Required for all functions
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys (optional - function will skip unavailable sources)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
PRODUCT_HUNT_ACCESS_TOKEN=your_product_hunt_token
GITHUB_ACCESS_TOKEN=your_github_token
```

## Usage

### Request Format

```typescript
POST /functions/v1/collect-trends

{
  "themes": ["productivity", "ai tools", "web development"],
  "sources": ["all"], // or specific sources: ["reddit", "twitter"]
  "region": "US",
  "forceRefresh": false
}
```

### Response Format

```typescript
{
  "success": true,
  "results": [
    {
      "source": "reddit",
      "status": "success",
      "recordCount": 25,
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "summary": {
    "totalSources": 5,
    "successfulSources": 4,
    "totalRecords": 150
  }
}
```

## Rate Limits

Each API has different rate limits that are automatically managed:

- **Google Trends**: 100 requests/minute (simulated)
- **Reddit**: 60 requests/minute
- **Twitter**: 300 requests/15 minutes
- **Product Hunt**: 1000 requests/hour
- **GitHub**: 5000 requests/hour

## Error Handling

The function implements several error handling strategies:

1. **Retryable Errors**: Network timeouts, rate limits, server errors
2. **Non-retryable Errors**: Authentication failures, malformed requests
3. **Partial Failures**: Continue processing other sources if one fails
4. **Exponential Backoff**: Increasing delays between retry attempts

## Data Storage

Collected data is stored in the `trend_data` table with the following structure:

```sql
CREATE TABLE trend_data (
    id UUID PRIMARY KEY,
    theme_id UUID REFERENCES themes(id),
    source VARCHAR(50),
    search_volume INTEGER,
    growth_rate DECIMAL(5,2),
    geographic_data JSONB,
    demographic_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## Deployment

Deploy the function using the Supabase CLI:

```bash
supabase functions deploy collect-trends
```

## Testing

Test the function locally:

```bash
supabase functions serve collect-trends
```

Then make a request:

```bash
curl -X POST http://localhost:54321/functions/v1/collect-trends \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"themes": ["test"], "sources": ["all"], "region": "US"}'
```

## Monitoring

Monitor function execution through:

1. Supabase Dashboard > Edge Functions
2. Function logs in the dashboard
3. `collection_runs` table for execution history
4. Error logs in the `ErrorHandler` class

## Security

- User authentication required
- Row Level Security (RLS) enabled
- API keys stored as environment variables
- Input validation and sanitization
- CORS headers configured

## Performance Considerations

- Concurrent API calls where possible
- Efficient database upserts
- Connection pooling
- Minimal data transformation
- Caching strategies for repeated requests