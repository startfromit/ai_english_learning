// Debug script for GitHub authentication issues
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugGitHubAuth() {
  console.log('=== GitHub Authentication Debug ===\n');
  
  try {
    // 1. Check environment variables
    console.log('1. Checking environment variables...');
    console.log('GITHUB_ID:', process.env.GITHUB_ID ? 'Set' : 'Missing');
    console.log('GITHUB_SECRET:', process.env.GITHUB_SECRET ? 'Set' : 'Missing');
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set');
    
    // 2. Check Supabase connection
    console.log('\n2. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Supabase connection error:', testError.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
    
    // 3. Check users table structure
    console.log('\n3. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users in table`);
      if (users.length > 0) {
        console.log('Sample user structure:', Object.keys(users[0]));
        console.log('Sample user data:', users[0]);
      }
    }
    
    // 4. Check for GitHub users specifically
    console.log('\n4. Checking for GitHub users...');
    const { data: githubUsers, error: githubError } = await supabase
      .from('users')
      .select('*')
      .eq('provider', 'github');
    
    if (githubError) {
      console.log('❌ Error fetching GitHub users:', githubError.message);
    } else {
      console.log(`✅ Found ${githubUsers.length} GitHub users`);
      githubUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name}) - ID: ${user.id}`);
      });
    }
    
    // 5. Check RLS policies
    console.log('\n5. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (policiesError && policiesError.code === '42501') {
      console.log('❌ RLS policy issue - access denied');
    } else if (policiesError) {
      console.log('❌ Other error:', policiesError.message);
    } else {
      console.log('✅ RLS policies working correctly');
    }
    
    console.log('\n=== Debug Complete ===');
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

// Run the debug
debugGitHubAuth(); 