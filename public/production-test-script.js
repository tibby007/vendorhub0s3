// Production Test Script for Partner Settings and Resource Upload Issues
// Copy and paste this into the browser console on your production site

console.log('🔍 Starting Production Diagnostics...');

// Test 1: Environment Variables
console.log('\n1. Testing Environment Variables:');
try {
    const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL;
    const supabaseKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY;
    
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Present' : '❌ Missing');
    
    if (supabaseUrl) {
        console.log('Supabase URL format:', supabaseUrl.includes('supabase.co') ? '✅ Valid' : '⚠️ Unusual format');
    }
} catch (error) {
    console.error('❌ Error accessing environment variables:', error);
}

// Test 2: Supabase Client
console.log('\n2. Testing Supabase Client:');
try {
    // Try to access the global supabase client if available
    if (window.supabase) {
        console.log('✅ Supabase client found in window');
        console.log('Supabase URL:', window.supabase.supabaseUrl);
    } else {
        console.log('⚠️ Supabase client not found in window');
    }
} catch (error) {
    console.error('❌ Error accessing Supabase client:', error);
}

// Test 3: Authentication State
console.log('\n3. Testing Authentication:');
try {
    // Check localStorage for auth tokens
    const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth') || key.includes('session')
    );
    
    console.log('Auth-related localStorage keys:', authKeys.length > 0 ? authKeys : 'None found');
    
    // Check if user is logged in
    const hasAuthData = authKeys.some(key => {
        const value = localStorage.getItem(key);
        return value && value.includes('access_token');
    });
    
    console.log('Authentication status:', hasAuthData ? '✅ Logged in' : '❌ Not logged in');
} catch (error) {
    console.error('❌ Error checking authentication:', error);
}

// Test 4: Network Requests
console.log('\n4. Testing Network Connectivity:');
fetch('/api/health')
    .then(response => {
        console.log('API health check:', response.ok ? '✅ Reachable' : '⚠️ Issues detected');
    })
    .catch(error => {
        console.log('API health check: ⚠️ No health endpoint or network issue');
    });

// Test 5: Partner Settings Save Function
console.log('\n5. Testing Partner Settings Save Function:');
try {
    // Create a test function to simulate partner settings save
    window.testPartnerSave = async function() {
        console.log('🧪 Testing partner settings save...');
        
        const testData = {
            name: 'Test Company ' + Date.now(),
            contact_email: 'test@example.com',
            contact_phone: '555-0123',
            brand_color: '#FF0000'
        };
        
        try {
            // This would need to be adapted based on your actual implementation
            console.log('Test data prepared:', testData);
            console.log('⚠️ Manual test required: Try saving partner settings in the UI');
            return testData;
        } catch (error) {
            console.error('❌ Partner save test failed:', error);
            throw error;
        }
    };
    
    console.log('✅ Partner save test function created. Run testPartnerSave() to test.');
} catch (error) {
    console.error('❌ Error creating partner save test:', error);
}

// Test 6: File Upload Capability
console.log('\n6. Testing File Upload Capability:');
try {
    // Test File API support
    const hasFileAPI = typeof File !== 'undefined' && typeof FileReader !== 'undefined';
    console.log('File API support:', hasFileAPI ? '✅ Available' : '❌ Not supported');
    
    // Test FormData support
    const hasFormData = typeof FormData !== 'undefined';
    console.log('FormData support:', hasFormData ? '✅ Available' : '❌ Not supported');
    
    // Create a test file upload function
    window.testFileUpload = function() {
        console.log('🧪 Testing file upload capability...');
        
        // Create a test file
        const testContent = 'This is a test file for upload testing';
        const testFile = new Blob([testContent], { type: 'text/plain' });
        testFile.name = 'test-file.txt';
        
        console.log('Test file created:', {
            name: testFile.name,
            size: testFile.size,
            type: testFile.type
        });
        
        console.log('⚠️ Manual test required: Try uploading a file in the Resources section');
        return testFile;
    };
    
    console.log('✅ File upload test function created. Run testFileUpload() to test.');
} catch (error) {
    console.error('❌ Error creating file upload test:', error);
}

// Test 7: Console Error Monitoring
console.log('\n7. Setting up Error Monitoring:');
let errorCount = 0;
const originalError = console.error;
console.error = function(...args) {
    errorCount++;
    console.log(`🚨 Error #${errorCount} detected:`, ...args);
    originalError.apply(console, args);
};

window.addEventListener('error', (event) => {
    console.log('🚨 JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.log('🚨 Unhandled Promise Rejection:', event.reason);
});

console.log('✅ Error monitoring activated');

// Test 8: Storage Limits
console.log('\n8. Testing Storage Limits:');
try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
            const used = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const usedMB = Math.round(used / 1024 / 1024);
            const quotaMB = Math.round(quota / 1024 / 1024);
            const usagePercent = quota > 0 ? Math.round((used / quota) * 100) : 0;
            
            console.log(`Storage usage: ${usedMB}MB / ${quotaMB}MB (${usagePercent}%)`);
            
            if (usagePercent > 80) {
                console.log('⚠️ Storage usage is high, this might affect file uploads');
            } else {
                console.log('✅ Storage usage is normal');
            }
        });
    } else {
        console.log('⚠️ Storage API not available');
    }
} catch (error) {
    console.error('❌ Error checking storage:', error);
}

// Summary
console.log('\n📋 DIAGNOSTIC SUMMARY:');
console.log('1. Check environment variables above');
console.log('2. Verify authentication status');
console.log('3. Run testPartnerSave() to test partner settings');
console.log('4. Run testFileUpload() to test file upload capability');
console.log('5. Try actual operations and watch for error messages');
console.log('6. Check Network tab in DevTools for failed requests');
console.log('\n🔍 Diagnostics complete. Monitor console for ongoing errors.');

// Export test functions to global scope for easy access
window.runProductionDiagnostics = function() {
    console.log('Re-running production diagnostics...');
    // Re-run the script
    eval(document.querySelector('script[data-production-test]')?.textContent || 'console.log("Script not found")');
};

console.log('\n💡 Tip: Run runProductionDiagnostics() to re-run all tests');