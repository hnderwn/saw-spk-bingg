import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getAllProfiles();
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const confirmMsg = newRole === 'admin' ? 'Jadikan pengguna ini sebagai Admin? Mereka akan memiliki akses penuh ke sistem.' : 'Cabut akses Admin dari pengguna ini?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await db.updateProfile(userId, { role: newRole });
      if (error) throw error;

      // Update local state
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

      // Log activity
      await db.createAuditLog({
        action: 'UPDATE_ROLE',
        target_id: userId,
        description: `Mengubah peran user ${userId} menjadi ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Gagal mengubah peran: ' + error.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.school?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 mt-1">Kelola data siswa dan hak akses admin.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white border rounded-xl flex items-center px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <span className="text-gray-400 mr-2">🔍</span>
            <input type="text" placeholder="Cari nama atau sekolah..." className="outline-none text-sm w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="bg-white border rounded-xl px-4 py-2 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-blue-500" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Semua Peran</option>
            <option value="siswa">Siswa</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Sekolah</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Peran</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Terdaftar Pada</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{user.full_name || 'Anonymous'}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{user.school || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.role || 'siswa'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'admin' ? (
                        <button onClick={() => handleRoleChange(user.id, 'siswa')} className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors">
                          Jadikan Siswa
                        </button>
                      ) : (
                        <button onClick={() => handleRoleChange(user.id, 'admin')} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                          Jadikan Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                    Pencarian tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Users;
