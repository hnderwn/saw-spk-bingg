import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const Reports = () => {
  const { isAdmin } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState(null)

  useEffect(() => {
    if (!isAdmin()) {
      // Redirect jika bukan admin
      window.location.href = '/siswa/dashboard'
      return
    }
    
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const { data, error } = await db.getExamResults()
      if (error) throw error
      
      setResults(data || [])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const calculateStats = () => {
    if (results.length === 0) return null
    
    const totalStudents = new Set(results.map(r => r.user_id)).size
    const averageScore = Math.round(
      results.reduce((sum, r) => sum + r.score_total, 0) / results.length
    )
    
    const categoryAverages = {
      grammar: Math.round(results.reduce((sum, r) => sum + r.score_grammar, 0) / results.length),
      vocab: Math.round(results.reduce((sum, r) => sum + r.score_vocab, 0) / results.length),
      reading: Math.round(results.reduce((sum, r) => sum + r.score_reading, 0) / results.length),
      cloze: Math.round(results.reduce((sum, r) => sum + r.score_cloze, 0) / results.length)
    }
    
    return {
      totalExams: results.length,
      totalStudents,
      averageScore,
      categoryAverages
    }
  }

  const stats = calculateStats()

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Akses ditolak. Khusus Admin.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Laporan Ujian
              </h1>
              <p className="text-gray-600 mt-1">
                Ringkasan performa ujian siswa
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => loadReports()}
            >
              Segarkan
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalExams}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Ujian
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalStudents}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Siswa Aktif
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Rata-rata Skor
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round((stats.averageScore / 100) * 5 * 10) / 10}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Nilai Rata-rata
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Category Performance */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Performa Kategori
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.categoryAverages).map(([category, score]) => (
                <Card key={category} className="p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600 capitalize mb-2">
                      {category === 'vocab' ? 'Kosakata' : 
                       category === 'grammar' ? 'Tata Bahasa' :
                       category === 'reading' ? 'Membaca' :
                       category === 'cloze' ? 'Rumpang' : category}
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 80 ? 'bg-green-500' : 
                            score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Results */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Hasil Ujian Terbaru
          </h2>
          
          {loading ? (
            <Card className="p-8 text-center">
              <div className="text-gray-600">Memuat hasil...</div>
            </Card>
          ) : results.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-600 mb-2">Tidak ada hasil ujian ditemukan</div>
              <div className="text-sm text-gray-500">
                Siswa belum mengambil ujian apapun.
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sekolah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skor Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tata Bahasa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kosakata
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membaca
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rumpang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {result.profiles?.full_name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {result.profiles?.school || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${getScoreColor(result.score_total)}`}>
                            {result.score_total}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${getScoreColor(result.score_grammar)}`}>
                            {result.score_grammar}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${getScoreColor(result.score_vocab)}`}>
                            {result.score_vocab}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${getScoreColor(result.score_reading)}`}>
                            {result.score_reading}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${getScoreColor(result.score_cloze)}`}>
                            {result.score_cloze}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(result.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedResult(result)}
                          >
                            Lihat Detail
                          </Button>
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
                <h3 className="text-lg font-medium text-gray-900">
                  Detail Ujian
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedResult(null)}
                >
                  Tutup
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Informasi Siswa
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama:</span>
                      <span className="font-medium">
                        {selectedResult.profiles?.full_name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sekolah:</span>
                      <span className="font-medium">
                        {selectedResult.profiles?.school || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-medium">
                        {formatDate(selectedResult.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Rincian Skor
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_total)}`}>
                          {selectedResult.score_total}
                        </div>
                        <div className="text-sm text-gray-600">Skor Total</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_grammar)}`}>
                          {selectedResult.score_grammar}
                        </div>
                        <div className="text-sm text-gray-600">Tata Bahasa</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_vocab)}`}>
                          {selectedResult.score_vocab}
                        </div>
                        <div className="text-sm text-gray-600">Kosakata</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score_reading)}`}>
                          {selectedResult.score_reading}
                        </div>
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
  )
}

export default Reports
