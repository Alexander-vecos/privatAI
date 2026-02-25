import React from 'react';
import KeysManager from '../features/admin/components/KeysManager';

export default function AdminPanelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <div className="bg-white rounded shadow">
          <KeysManager />
        </div>
      </div>
    </div>
  );
}
