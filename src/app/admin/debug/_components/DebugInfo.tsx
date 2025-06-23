import React from 'react';

export default function DebugInfo() {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Debug Info</h2>
            <p className="mb-2">This is the debug information panel. You can add more diagnostic info here.</p>
            <p className="text-sm text-gray-500">Current time: {new Date().toLocaleString()}</p>
        </div>
    );
} 