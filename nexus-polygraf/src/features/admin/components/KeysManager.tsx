                                                import React, { useEffect, useState } from 'react';
import { adminAdapter } from '../../../firebase/adminAdapter';

export default function KeysManager() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminAdapter.listKeys();
      setKeys(list);
    } catch (err: any) {
      console.error('Failed to load keys:', err);
      setError(err.message || String(err));
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await adminAdapter.generateKey(role);
      await load();
      alert(`Key generated: ${created.key}`);
    } catch (err: any) {
      console.error('Failed to generate key:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete key?')) return;
    setLoading(true);
    setError(null);
    try {
      await adminAdapter.deactivateKey(id);
      await load();
    } catch (err: any) {
      console.error('Failed to delete key:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <select value={role} onChange={(e) => setRole(e.target.value)} className="p-2 border rounded">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={handleGenerate} disabled={loading}>
          Generate Key
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">Keys management (via Cloud Functions)</div>
        <div>
          <button onClick={load} className="px-3 py-1 mr-2 bg-gray-100 rounded">Refresh</button>
          <button onClick={() => window.location.reload()} className="px-3 py-1 bg-gray-50 rounded">Hard reload</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">Error: {error}. Make sure your account has `admin` claim or run the functions emulator locally.</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">Key</th>
              <th className="py-2">Role</th>
              <th className="py-2">Used</th>
              <th className="py-2">Created</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t">
                <td className="py-2 font-mono">{k.key}</td>
                <td className="py-2">{k.role}</td>
                <td className="py-2">{k.used ? 'Yes' : 'No'}</td>
                <td className="py-2">{k.createdAt?.toDate ? k.createdAt.toDate().toLocaleString() : ''}</td>
                <td className="py-2">
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(k.id)} disabled={loading || k.used}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {keys.length === 0 && <div className="text-gray-500 mt-4">No keys found</div>}
    </div>
  );
}
