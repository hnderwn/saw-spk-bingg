import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getAuditLogs();
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.startsWith('CREATE')) return 'bg-emerald-100 text-emerald-700';
    if (action.startsWith('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (action.startsWith('DELETE')) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Logs</h1>
        <p className="text-slate-500 mt-1">Lacak sejarah perubahan sistem oleh administrator.</p>
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Administrator</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Deskripsi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Target ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    Memuat log sistem...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">{log.profiles?.full_name || 'System'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.description}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">{log.target_id || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 space-y-2">
                    <div className="text-4xl">📭</div>
                    <div className="italic">Belum ada aktivitas yang tercatat.</div>
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

export default AuditLogs;
