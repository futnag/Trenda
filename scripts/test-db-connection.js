const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('themes')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2))
      return
    }

    console.log('Database connection successful!')
    console.log('Current themes count:', data)

    // Test insert with minimal data
    const { data: insertData, error: insertError } = await supabase
      .from('themes')
      .insert({
        title: 'Test Theme',
        description: 'Test description',
        category: 'productivity',
        monetization_score: 50,
        market_size: 1000000,
        competition_level: 'medium',
        technical_difficulty: 'intermediate',
        estimated_revenue_min: 10000,
        estimated_revenue_max: 50000
      })
      .select()

    if (insertError) {
      console.error('Insert error:', JSON.stringify(insertError, null, 2))
      return
    }

    console.log('Test insert successful:', insertData)

    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase
        .from('themes')
        .delete()
        .eq('id', insertData[0].id)
      console.log('Test data cleaned up')
    }

  } catch (error) {
    console.error('Connection test failed:', error)
  }
}

testConnection().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})