#!/usr/bin/env node

/**
 * Database setup and verification script
 * This script helps verify that the database is properly configured
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Checking database tables...')
  
  const tables = [
    'users',
    'themes',
    'trend_data',
    'competitor_analysis',
    'user_alerts',
    'subscriptions'
  ]

  const results = {}
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        results[table] = { exists: false, error: error.message }
      } else {
        results[table] = { exists: true, count: count || 0 }
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message }
    }
  }

  return results
}

async function checkRLS() {
  console.log('🔒 Checking Row Level Security policies...')
  
  try {
    // Try to access tables without authentication (should fail for protected tables)
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data, error } = await anonClient
      .from('users')
      .select('*')
      .limit(1)
    
    // This should fail due to RLS
    if (error && error.message.includes('row-level security')) {
      return { rls_enabled: true, message: 'RLS is properly configured' }
    } else {
      return { rls_enabled: false, message: 'RLS may not be properly configured' }
    }
  } catch (err) {
    return { rls_enabled: false, error: err.message }
  }
}

async function checkIndexes() {
  console.log('📊 Checking database indexes...')
  
  try {
    const { data, error } = await supabase
      .rpc('pg_indexes', {})
    
    if (error) {
      return { error: error.message }
    }
    
    return { indexes_count: data?.length || 0 }
  } catch (err) {
    // If the function doesn't exist, that's okay
    return { message: 'Index check skipped (requires custom function)' }
  }
}

async function main() {
  console.log('🚀 Starting database setup verification...\n')
  
  try {
    // Check connection
    console.log('🔌 Testing database connection...')
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    if (error && !error.message.includes('row-level security')) {
      console.error('❌ Database connection failed:', error.message)
      process.exit(1)
    }
    
    console.log('✅ Database connection successful\n')
    
    // Check tables
    const tableResults = await checkTables()
    console.log('\n📋 Table Status:')
    for (const [table, result] of Object.entries(tableResults)) {
      if (result.exists) {
        console.log(`  ✅ ${table}: ${result.count} records`)
      } else {
        console.log(`  ❌ ${table}: ${result.error}`)
      }
    }
    
    // Check RLS
    const rlsResult = await checkRLS()
    console.log('\n🔒 Row Level Security:')
    if (rlsResult.rls_enabled) {
      console.log(`  ✅ ${rlsResult.message}`)
    } else {
      console.log(`  ⚠️  ${rlsResult.message}`)
    }
    
    // Check indexes
    const indexResult = await checkIndexes()
    console.log('\n📊 Database Indexes:')
    if (indexResult.indexes_count) {
      console.log(`  ✅ Found ${indexResult.indexes_count} indexes`)
    } else if (indexResult.message) {
      console.log(`  ℹ️  ${indexResult.message}`)
    } else if (indexResult.error) {
      console.log(`  ⚠️  ${indexResult.error}`)
    }
    
    console.log('\n🎉 Database verification complete!')
    
  } catch (err) {
    console.error('❌ Verification failed:', err.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { checkTables, checkRLS, checkIndexes }