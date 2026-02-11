import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalQuestions: 0,
    avgScore: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [users, results, questions, logs] = await Promise.all([db.getAllProfiles(), db.getExamResults(), db.getQuestions(), db.getAuditLogs()]);

      const avg = results.data?.length > 0 ? Math.round(results.data.reduce((sum, r) => sum + r.score_total, 0) / results.data.length) : 0;

      setStats({
        totalUsers: users.data?.length || 0,
        totalExams: results.data?.length || 0,
        totalQuestions: questions.data?.length || 0,
        avgScore: avg,
      });

      setRecentLogs(logs.data || []);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Memuat dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Home</h1>
        <p className="text-slate-500 mt-1">Ringkasan aktivitas dan statistik sistem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="p-6 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pengguna</p>
          <p className="text-3xl font-black text-slate-900">{stats.totalUsers}</p>
        </Card>
        <Card className="p-6 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ujian Selesai</p>
          <p className="text-3xl font-black text-slate-900">{stats.totalExams}</p>
        </Card>
        <Card className="p-6 border-l-4 border-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Soal</p>
          <p className="text-3xl font-black text-slate-900">{stats.totalQuestions}</p>
        </Card>
        <Card className="p-6 border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rata-rata Skor</p>
          <p className="text-3xl font-black text-slate-900">{stats.avgScore}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="mr-2">🕒</span> Aktivitas Terbaru
          </h2>
          <Card className="overflow-hidden">
            <div className="divide-y divide-slate-100">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">{log.profiles?.full_name || 'System'}</p>
                      <span className="text-xs text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {log.action}: {log.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 italic text-sm">Belum ada aktivitas tercatat.</div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="mr-2">⚡</span> Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = '/admin/questions')}
              className="w-full text-left p-4 bg-white border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all font-medium flex items-center justify-between group"
            >
              <span>Tambah Soal Baru</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
            <button
              onClick={() => (window.location.href = '/admin/packages')}
              className="w-full text-left p-4 bg-white border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all font-medium flex items-center justify-between group"
            >
              <span>Kelola Paket Ujian</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
            <button
              onClick={() => (window.location.href = '/admin/users')}
              className="w-full text-left p-4 bg-white border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all font-medium flex items-center justify-between group"
            >
              <span>Lihat Daftar Siswa</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
