const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  try {
    console.log('Creating database tables...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_create_core_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error)
        // Continue with other statements
      } else {
        console.log(`Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('Table creation completed!')
    
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

// Alternative approach: create tables one by one
async function createTablesDirectly() {
  try {
    console.log('Creating tables directly...')
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
          stripe_customer_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: usersError } = await supabase.rpc('exec_sql', { sql: createUsersTable })
    if (usersError) {
      console.error('Error creating users table:', usersError)
    } else {
      console.log('Users table created successfully')
    }
    
    // Create themes table
    const createThemesTable = `
      CREATE TABLE IF NOT EXISTS public.themes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          monetization_score INTEGER CHECK (monetization_score >= 0 AND monetization_score <= 100),
          market_size BIGINT,
          competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
          technical_difficulty VARCHAR(20) CHECK (technical_difficulty IN ('beginner', 'intermediate', 'advanced')),
          estimated_revenue_min INTEGER,
          estimated_revenue_max INTEGER,
          data_sources JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: themesError } = await supabase.rpc('exec_sql', { sql: createThemesTable })
    if (themesError) {
      console.error('Error creating themes table:', themesError)
    } else {
      console.log('Themes table created successfully')
    }
    
    // Create trend_data table
    const createTrendDataTable = `
      CREATE TABLE IF NOT EXISTS public.trend_data (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
          source VARCHAR(50) NOT NULL,
          search_volume INTEGER,
          growth_rate DECIMAL(5,2),
          geographic_data JSONB DEFAULT '{}'::jsonb,
          demographic_data JSONB DEFAULT '{}'::jsonb,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: trendError } = await supabase.rpc('exec_sql', { sql: createTrendDataTable })
    if (trendError) {
      console.error('Error creating trend_data table:', trendError)
    } else {
      console.log('Trend_data table created successfully')
    }
    
    console.log('All tables created!')
    
  } catch (error) {
    console.error('Error in direct table creation:', error)
  }
}

// Try the direct approach since rpc might not be available
async function createTablesWithInsert() {
  try {
    console.log('Testing simple table creation...')
    
    // Just try to create the themes table using a simple approach
    // First, let's see if we can at least connect and do a basic operation
    const { data, error } = await supabase.auth.getSession()
    
    console.log('Auth session check:', { data: !!data, error: !!error })
    
    // Let's try to use the SQL editor approach
    console.log('Tables should be created via Supabase Dashboard SQL Editor')
    console.log('Please run the migration files manually in the Supabase Dashboard')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createTablesWithInsert().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('Failed:', error)
  process.exit(1)
})