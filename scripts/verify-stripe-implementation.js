#!/usr/bin/env node

/**
 * Script to verify Stripe implementation
 */

const { runFullVerification } = require('../src/lib/stripe-verification.ts')

async function main() {
  try {
    await runFullVerification()
  } catch (error) {
    console.error('Verification failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}