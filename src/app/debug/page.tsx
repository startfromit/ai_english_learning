import { promises as fs } from 'fs';
import path from 'path';

async function getEnvStatus() {
  const requiredServerEnvs = [
    'GITHUB_ID',
    'GITHUB_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    // These are public, but let's check them on the server too
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const status: Record<string, string> = {};

  for (const envVar of requiredServerEnvs) {
    status[envVar] = process.env[envVar] ? 'Set' : 'NOT SET';
  }
  
  // Check if .env.local exists
  try {
    await fs.access(path.join(process.cwd(), '.env.local'));
    status['.env.local file'] = 'Exists';
  } catch {
    status['.env.local file'] = 'NOT FOUND';
  }

  return status;
}


export default async function DebugPage() {
  const envStatus = await getEnvStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Server-Side Debug Information</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Server Environment Variables Status
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              This page shows the status of environment variables on the server.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              {Object.entries(envStatus).map(([key, value]) => (
                <div key={key} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{key}</dt>
                  <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 ${value === 'Set' || value === 'Exists' ? 'text-green-600' : 'text-red-600'}`}>
                    <code className="bg-gray-100 px-2 py-1 rounded font-bold">{value}</code>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Troubleshooting Steps
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">1. Check `.env.local` File</h4>
                <p className="text-sm text-gray-600 mt-1">
                  If any variable above is 'NOT SET', please check your <code className="bg-gray-100 px-2 py-1 rounded text-xs">.env.local</code> file in the project root. It must contain the exact variable names:
                </p>
                <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-x-auto">
{`# For GitHub Login
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# For NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_long_random_string_here

# For Supabase (should already be there)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
                </pre>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900">2. Restart the Development Server</h4>
                <p className="text-sm text-gray-600 mt-1">
                  After any change to the <code className="bg-gray-100 px-2 py-1 rounded text-xs">.env.local</code> file, you **must** restart the development server. Stop it (Ctrl+C) and run <code className="bg-gray-100 px-2 py-1 rounded text-xs">npm run dev</code> again.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">3. Check GitHub OAuth App</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Ensure your GitHub OAuth app has the correct callback URL: 
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-2">http://localhost:3000/api/auth/callback/github</code>
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900">4. Check GitHub Email Privacy</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Ensure your GitHub email is public. Go to 
                  <a href="https://github.com/settings/emails" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 ml-1">
                    GitHub Email Settings
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 