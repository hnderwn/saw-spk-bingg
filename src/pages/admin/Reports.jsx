import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      // Redirect jika bukan admin
      window.location.href = '/siswa/dashboard';
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, questionsResponse] = await Promise.all([db.getExamResults(), db.getQuestions()]);

      if (resultsResponse.error) throw resultsResponse.error;
      if (questionsResponse.error) throw questionsResponse.error;

      setResults(resultsResponse.data || []);
      setQuestions(questionsResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    if (results.length === 0 || questions.length === 0) return null;

    // Student-Centric Results: Ambil hanya hasil TERBARU untuk tiap siswa
    const latestResultsPerStudent = Object.values(
      results.reduce((acc, current) => {
        if (!acc[current.user_id] || new Date(current.created_at) > new Date(acc[current.user_id].created_at)) {
          acc[current.user_id] = current;
        }
        return acc;
      }, {}),
    );

    const totalStudents = latestResultsPerStudent.length;
    const averageScore = Math.round(results.reduce((sum, r) => sum + r.score_total, 0) / results.length);

    const categoryAverages = {
      Grammar: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.grammar?.score || 0), 0) / results.length),
      Vocabulary: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.vocab?.score || 0), 0) / results.length),
      Reading: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.reading?.score || 0), 0) / results.length),
      Cloze: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.cloze?.score || 0), 0) / results.length),
    };

    // CEFR Distribution Calculation (Based on Latest Student Ability)
    const cefrDist = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    latestResultsPerStudent.forEach((r) => {
      const s = r.score_total;
      if (s >= 95) cefrDist['C2']++;
      else if (s >= 85) cefrDist['C1']++;
      else if (s >= 75) cefrDist['B2']++;
      else if (s >= 60) cefrDist['B1']++;
      else if (s >= 40) cefrDist['A2']++;
      else cefrDist['A1']++;
    });

    // Topic Analysis (Hardest Topics)
    const topicStats = {};
    results.forEach((r) => {
      if (!r.answers) return;
      Object.entries(r.answers).forEach(([qId, answer]) => {
        const q = questions.find((question) => question.id === qId);
        if (!q || !q.sub_category) return;

        if (!topicStats[q.sub_category]) {
          topicStats[q.sub_category] = { correct: 0, total: 0 };
        }
        topicStats[q.sub_category].total++;
        if (answer === q.correct_answer) topicStats[q.sub_category].correct++;
      });
    });

    const hardestTopics = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        errorRate: Math.round((1 - stats.correct / stats.total) * 100),
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5); // Top 5 hardest

    return {
      totalExams: results.length,
      totalStudents,
      averageScore,
      categoryAverages,
      cefrDist,
      hardestTopics,
    };
  };

  const stats = calculateStats();

  const downloadCSV = () => {
    if (results.length === 0) return;

    // Header CSV
    const headers = ['Nama Siswa', 'Sekolah', 'Skor Total', 'Grammar', 'Vocab', 'Reading', 'Cloze', 'Tanggal'];

    // Data rows
    const rows = results.map((r) => [
      r.profiles?.full_name || 'Anonymous',
      r.profiles?.school || '-',
      r.score_total,
      r.category_scores?.grammar?.score || 0,
      r.category_scores?.vocab?.score || 0,
      r.category_scores?.reading?.score || 0,
      r.category_scores?.cloze?.score || 0,
      new Date(r.created_at).toLocaleDateString(),
    ]);

    // Gabungkan
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');

    // Download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Ujian_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Akses ditolak. Khusus Admin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laporan Analitik</h1>
              <p className="text-gray-600 mt-1">Ringkasan performa ujian siswa</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => downloadCSV()}>
                Ekspor CSV
              </Button>
              <Button variant="primary" onClick={() => loadData()}>
                Segarkan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.totalExams}</div>
                <div className="text-sm text-gray-600 mt-1">Total Ujian</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
                <div className="text-sm text-gray-600 mt-1">Total Siswa Unik</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>{stats.averageScore}</div>
                <div className="text-sm text-gray-600 mt-1">Rata-rata Skor</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{Math.round((stats.averageScore / 100) * 5 * 10) / 10}</div>
                <div className="text-sm text-gray-600 mt-1">Nilai Rata-rata</div>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* CEFR Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">📊</span> Distribusi Level CEFR
            </h2>
            <div className="space-y-4">
              {stats &&
                Object.entries(stats.cefrDist).map(([level, count]) => {
                  const percentage = stats.totalExams > 0 ? (count / stats.totalExams) * 100 : 0;
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-gray-700">{level}</span>
                        <span className="text-gray-500">
                          {count} Siswa ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all duration-500 ${level.startsWith('C') ? 'bg-purple-500' : level.startsWith('B') ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="mt-6 text-xs text-gray-500 italic">*Penentuan level berdasarkan skor total rata-rata ujian diagnostic & proficiency.</p>
          </Card>

          {/* Hardest Topics */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🧨</span> Rekap Topik Tersulit
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Topik Materi</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Error Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats && stats.hardestTopics.length > 0 ? (
                    stats.hardestTopics.map((item, idx) => (
                      <tr key={idx} className="hover:bg-red-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.topic}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.errorRate > 70 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{item.errorRate}% Salah</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-4 py-8 text-center text-sm text-gray-500">
                        Belum ada data materi yang tersisa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-xs text-gray-500 italic">*Topik dengan tingkat kesalahan tertinggi dari seluruh jawaban siswa.</p>
          </Card>
        </div>

        {/* Category Performance & Stock Check */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📈</span> Rata-rata Skor Kategori
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats &&
                Object.entries(stats.categoryAverages).map(([category, score]) => (
                  <Card key={category} className="p-4 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{category}</p>
                        <p className={`text-2xl font-black ${getScoreColor(score)}`}>{score}</p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                          <span className="text-xs font-bold text-gray-400">{score}%</span>
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-blue-500 transition-all duration-1000" strokeDasharray={175} strokeDashoffset={175 - (score / 100) * 175} />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📦</span> Stok Soal (Stock Check)
            </h2>
            <Card className="p-1 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {['Grammar', 'Vocabulary', 'Reading', 'Cloze'].map((cat) => {
                  const count = questions.filter((q) => q.category === cat).length;
                  const isLow = count < 50;
                  return (
                    <li key={cat} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-700">{cat}</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-bold mr-2 ${isLow ? 'text-orange-600' : 'text-green-600'}`}>{count} item</span>
                        {isLow && <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="bg-gray-50 p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Minimal stok: 50 per kategori</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hasil Ujian Terbaru</h2>

          {loading ? (
            <Card className="p-8 text-center">
              <div className="text-gray-600">Memuat hasil...</div>
            </Card>
          ) : results.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-600 mb-2">Tidak ada hasil ujian ditemukan</div>
              <div className="text-sm text-gray-500">Siswa belum mengambil ujian apapun.</div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sekolah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skor Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tata Bahasa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kosakata</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membaca</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rumpang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{result.profiles?.full_name || 'Anonymous Student'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{result.profiles?.school || 'Unknown School'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${getScoreColor(result.score_total)}`}>{result.score_total}/100</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{result.category_scores?.grammar?.score || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{result.category_scores?.vocab?.score || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{result.category_scores?.reading?.score || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{result.category_scores?.cloze?.score || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(result.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          <button onClick={() => setSelectedResult(result)} className="text-blue-600 hover:text-blue-900 font-bold">
                            Rincian
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Result Details Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detail Ujian</h3>
                <Button variant="outline" size="sm" onClick={() => setSelectedResult(null)}>
                  Tutup
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informasi Siswa</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama:</span>
                      <span className="font-medium">{selectedResult.profiles?.full_name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sekolah:</span>
                      <span className="font-medium">{selectedResult.profiles?.school || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-medium">{formatDate(selectedResult.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Rincian Skor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_total)}`}>{selectedResult.score_total}</div>
                        <div className="text-sm text-gray-600">Skor Total</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_grammar)}`}>{selectedResult.score_grammar}</div>
                        <div className="text-sm text-gray-600">Tata Bahasa</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_vocab)}`}>{selectedResult.score_vocab}</div>
                        <div className="text-sm text-gray-600">Kosakata</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_reading)}`}>{selectedResult.score_reading}</div>
                        <div className="text-sm text-gray-600">Membaca</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
