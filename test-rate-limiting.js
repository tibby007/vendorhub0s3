/**
 * Test script for rate limiting functionality
 * Tests the rate-limiter Edge Function
 */

const RATE_LIMITER_URL = 'https://kfdlxorqopnibuzexoko.supabase.co/functions/v1/rate-limiter';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZGx4b3Jxb3BuaWJ1emV4b2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjI2OTYsImV4cCI6MjA3MDIzODY5Nn0.d3Q4d75ZOLIDSOVrx6TyQU3dj3ZLOddeMTbIg2VM01Y';

async function testRateLimit(testName, requestData) {
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    const response = await fetch(`${RATE_LIMITER_URL}/middleware`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.100' // Mock IP for testing
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    const status = response.status;
    
    console.log(`Status: ${status}`);
    console.log(`Response:`, {
      success: data.success,
      allowed: data.rate_limit?.allowed,
      count: data.rate_limit?.count,
      remaining: data.rate_limit?.remaining,
      limit: data.rate_limit?.limit
    });

    if (response.headers.get('X-RateLimit-Limit')) {
      console.log('Rate Limit Headers:');
      console.log(`  X-RateLimit-Limit: ${response.headers.get('X-RateLimit-Limit')}`);
      console.log(`  X-RateLimit-Remaining: ${response.headers.get('X-RateLimit-Remaining')}`);
      console.log(`  X-RateLimit-Reset: ${response.headers.get('X-RateLimit-Reset')}`);
      if (response.headers.get('Retry-After')) {
        console.log(`  Retry-After: ${response.headers.get('Retry-After')}`);
      }
    }

    return { status, data, success: status === 200 || status === 429 };

  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    return { status: 0, error: error.message, success: false };
  }
}

async function runRateLimitingTests() {
  console.log('🚀 Starting Rate Limiting Tests\n');
  
  const testUserId = 'test-user-12345';
  const testConfig = { limit: 5 }; // Low limit for testing

  // Test 1: First request should be allowed
  await testRateLimit('First request (should be allowed)', {
    user_id: testUserId,
    config: testConfig
  });

  // Test 2-4: More requests within limit
  for (let i = 2; i <= 4; i++) {
    await testRateLimit(`Request ${i} (should be allowed)`, {
      user_id: testUserId,
      config: testConfig
    });
  }

  // Test 5: Last allowed request
  await testRateLimit('Request 5 - at limit (should be allowed)', {
    user_id: testUserId,
    config: testConfig
  });

  // Test 6: Should be rate limited
  await testRateLimit('Request 6 - over limit (should be blocked)', {
    user_id: testUserId,
    config: testConfig
  });

  // Test 7: Test different user (should be allowed)
  await testRateLimit('Different user (should be allowed)', {
    user_id: 'different-user-67890',
    config: testConfig
  });

  // Test 8: Test anonymous user (IP-based)
  await testRateLimit('Anonymous user - IP based (should be allowed)', {
    config: testConfig
  });

  // Test 9: Test skip_authenticated feature
  await testRateLimit('Authenticated user with skip enabled', {
    user_id: testUserId,
    config: { limit: 5, skip_authenticated: true }
  });

  console.log('\n✅ Rate limiting tests completed!');
  console.log('\n📝 Notes:');
  console.log('- If rate_limits table does not exist, tests will show database errors');
  console.log('- Run CREATE_RATE_LIMITING.sql in Supabase Dashboard to create the table');
  console.log('- Rate limits reset every minute');
}

// Run the tests
runRateLimitingTests().catch(console.error);