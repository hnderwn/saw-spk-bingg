import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const ResultsCenter = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedDetails, setSelectedDetails] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getExamResults();
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = [...results].sort((a, b) => {
    let valA, valB;

    if (sortConfig.key === 'full_name') {
      valA = a.profiles?.full_name?.toLowerCase() || '';
      valB = b.profiles?.full_name?.toLowerCase() || '';
    } else {
      valA = a[sortConfig.key];
      valB = b[sortConfig.key];
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredResults = sortedResults.filter((r) => r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.profiles?.school?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hasil Ujian</h1>
          <p className="text-slate-500 mt-1">Gudang data seluruh nilai siswa secara mendetail.</p>
        </div>
        <div className="bg-white border rounded-xl flex items-center px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <span className="text-gray-400 mr-2">🔍</span>
          <input type="text" placeholder="Cari nama atau sekolah..." className="outline-none text-sm w-72" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('full_name')}>
                  Siswa {sortConfig.key === 'full_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Sekolah</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('score_total')}>
                  Skor {sortConfig.key === 'score_total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors" onClick={() => handleSort('created_at')}>
                  Tanggal {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    Memuat data hasil...
                  </td>
                </tr>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{r.profiles?.full_name || 'Anonymous'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{r.profiles?.school || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-lg font-black ${r.score_total >= 80 ? 'text-emerald-500' : r.score_total >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{r.score_total}</span>
                      <span className="text-xs text-slate-400 font-bold">/100</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-tighter">{r.exam_type}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(r.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedDetails(r)} className="text-xs font-black text-slate-900 hover:underline">
                        DETAIL
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data hasil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal Sederhana */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8 bg-white rounded-3xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedDetails.profiles?.full_name}</h2>
                <p className="text-slate-500 font-medium">{selectedDetails.profiles?.school}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Skor</p>
                <p className="text-4xl font-black text-slate-900">{selectedDetails.score_total}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: 'Grammar', key: 'grammar', color: 'blue' },
                { label: 'Vocabulary', key: 'vocab', color: 'indigo' },
                { label: 'Reading', key: 'reading', color: 'emerald' },
                { label: 'Cloze', key: 'cloze', color: 'amber' },
              ].map((cat) => (
                <div key={cat.label} className={`p-4 rounded-2xl bg-${cat.color}-50 border border-${cat.color}-100 flex items-center justify-between`}>
                  <span className={`text-xs font-black text-${cat.color}-700 uppercase`}>{cat.label}</span>
                  <span className={`text-xl font-black text-${cat.color}-900`}>{selectedDetails.category_scores?.[cat.key]?.score || 0}%</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 mb-8">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Waktu Ujian</p>
              <p className="font-bold">{new Date(selectedDetails.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>

            <Button onClick={() => setSelectedDetails(null)} className="w-full py-4 rounded-2xl bg-white text-slate-900 border-slate-200 hover:bg-slate-50">
              Tutup Rincian
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResultsCenter;
