'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function AdminSettings() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, which: string) => {
        navigator.clipboard.writeText(text);
        setCopied(which);
        setTimeout(() => setCopied(null), 2000);
    };

    const grantCommand = userId ? `UPDATE public.users SET role = 'admin' WHERE id = '${userId}';` : '';
    const revokeCommand = userId ? `UPDATE public.users SET role = 'user' WHERE id = '${userId}';` : '';

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Admin Settings</h2>
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg">Your User Information</h3>
                    <p><strong>Role:</strong> <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{(session?.user as any)?.role || 'user'}</span></p>
                    <p><strong>User ID:</strong> <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{userId}</span></p>
                </div>

                <div>
                    <h3 className="font-semibold text-lg">Unlimited TTS Access</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        To get unlimited TTS plays, you need to have the 'admin' role. Run the following SQL command in your Supabase SQL Editor to grant yourself admin privileges.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md flex items-center">
                        <code className="text-sm text-green-600 dark:text-green-400">{grantCommand}</code>
                        <button 
                            onClick={() => copyToClipboard(grantCommand, 'grant')}
                            className="ml-4 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                        >
                            {copied === 'grant' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg">Revoke Admin Privileges</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        To go back to being a normal user, run this command.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md flex items-center">
                        <code className="text-sm text-yellow-600 dark:text-yellow-400">{revokeCommand}</code>
                         <button 
                            onClick={() => copyToClipboard(revokeCommand, 'revoke')}
                            className="ml-4 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                        >
                            {copied === 'revoke' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 