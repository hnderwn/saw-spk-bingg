import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { calculateSAWPriority } from '../../lib/saw'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const Result = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  
  const [examResult, setExamResult] = useState(null)
  const [sawRecommendations, setSawRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        if (location.state?.examResult) {
          // Menggunakan hasil dari state
          console.log('Using result from state:', location.state.examResult)
          setExamResult(location.state.examResult)
          const recommendations = calculateSAWPriority(location.state.examResult.scores)
          setSawRecommendations(recommendations)
          setLoading(false)
        } else {
          // Muat hasil ujian terakhir jika tidak ada state
          console.log('No state, loading latest result for user:', user?.id)
          await loadLatestResult()
        }
      } catch (error) {
        console.error('Error in Result initialization:', error)
        setLoading(false) // Hentikan loading saat error
      }
    }
    
    init()
  }, [user]) // Jalankan ulang jika user cocok

  const loadLatestResult = async () => {
    try {
      if (!user?.id) return

      const { data, error } = await db.getExamResults(user.id)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const latest = data[0]
        
        // Ubah format DB ke format aplikasi jika diperlukan
        const result = {
          id: latest.id,
          startTime: latest.created_at, // Perkiraan
          endTime: latest.created_at,
          duration: 0, // Belum disimpan dengan cara standar di DB atau hilang
          questions: 0, // Tidak diketahui dari baris hasil saja kecuali kita hitung jawaban
          answered: Object.keys(latest.answers || {}).length,
          scores: {
             total: latest.score_total,
             ...latest.category_scores
          },
          answers: latest.answers
        }
        
        // Jika perhitungan SAW ketat memerlukan struktur sempurna, pastikan default
        if (!result.scores.total) result.scores.total = 0

        setExamResult(result)
        const recommendations = calculateSAWPriority(result.scores)
        setSawRecommendations(recommendations)
      } else {
        console.log('No results found in DB')
        // navigate('/siswa/dashboard') // Optional: stay on page saying "No results"
      }
    } catch (error) {
      console.error('Error loading result from DB:', error)
      // navigate('/siswa/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Sangat Baik'
    if (score >= 60) return 'Baik'
    return 'Perlu Peningkatan'
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}d`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat hasil...</div>
      </div>
    )
  }

  if (!examResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Tidak ada hasil ujian ditemukan</p>
          <Button onClick={() => navigate('/siswa/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </div>
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
                Hasil Ujian
              </h1>
              <p className="text-gray-600 mt-1">
                Kerja bagus, {profile?.full_name}! Berikut analisis performa Anda.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Selesai: {new Date(examResult.endTime).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Score */}
        <div className="mb-8">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Skor Total Anda
            </h2>
            <div className="mb-4">
              <span className={`text-6xl font-bold ${getScoreColor(examResult.scores.total)}`}>
                {examResult.scores.total}
              </span>
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span>Durasi: {formatDuration(examResult.duration)}</span>
              <span>•</span>
              <span>Soal: {examResult.answered}/{examResult.questions}</span>
              <span>•</span>
              <span className={`font-medium ${getScoreColor(examResult.scores.total)}`}>
                {getScoreLabel(examResult.scores.total)}
              </span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Skor per Kategori
            </h2>
            <div className="space-y-4">
              {Object.entries(examResult.scores)
                .filter(([category]) => category !== 'total')
                .map(([category, score]) => (
                  <Card key={category} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {category === 'vocab' ? 'Kosakata' : 
                           category === 'grammar' ? 'Tata Bahasa' :
                           category === 'reading' ? 'Membaca' :
                           category === 'cloze' ? 'Rumpang' : category}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getScoreLabel(score)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score}
                        </span>
                        <span className="text-gray-500">/100</span>
                      </div>
                    </div>
                    <div className="mt-3">
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
                  </Card>
                ))
              }
            </div>
          </div>

          {/* SAW Recommendations */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Rekomendasi Prioritas Belajar
            </h2>
            <div className="space-y-4">
              {sawRecommendations.map((rec, index) => (
                <Card key={rec.categoryKey} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                        style={{ backgroundColor: rec.color }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {rec.category}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {rec.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Skor: {rec.rawScore}/100
                      </div>
                      <div className="text-xs text-gray-500">
                        Prioritas: {(rec.priorityScore * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Rekomendasi:</strong> {rec.recommendation}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Biaya: {rec.cost}/100</span>
                    <span>Bobot: {(rec.weight * 100).toFixed(0)}%</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            variant="primary"
            onClick={() => navigate('/siswa/dashboard')}
          >
            Kembali ke Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Mulai ujian baru yang berfokus pada area terlemah
              const weakestCategory = sawRecommendations[0]?.categoryKey
              if (weakestCategory) {
                navigate(`/siswa/exam?paket=${weakestCategory}_practice`)
              } else {
                navigate('/siswa/exam')
              }
            }}
          >
            Latihan Area Lemah
          </Button>
        </div>

        {/* Explanation */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Bagaimana rekomendasi dihitung?
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Sistem kami menggunakan metode SAW (Simple Additive Weighting) untuk menghitung prioritas belajar:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Skor lebih rendah mendapatkan prioritas lebih tinggi untuk perbaikan</li>
                <li>Setiap kategori memiliki bobot berbeda berdasarkan tingkat kepentingan</li>
                <li>Tes Rumpang (30%), Tata Bahasa (25%), Membaca (25%), Kosakata (20%)</li>
                <li>Sistem menyarankan untuk fokus pada area terlemah Anda terlebih dahulu</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Result
