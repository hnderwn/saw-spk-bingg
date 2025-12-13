import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useExam } from '../../context/ExamContext'
import { db } from '../../lib/supabase'

const Dashboard = () => {
  const navigate = useNavigate()
  const { profile, isAdmin, signOut } = useAuth()
  const { clearExam } = useExam()
  
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    lastExamDate: null
  })
  const [examHistory, setExamHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Data paket ujian (mockup)
  const examPackages = [
    {
      id: 'grammar_basic',
      name: 'Tes Dasar Tata Bahasa',
      description: 'Konsep dasar tata bahasa dan struktur kalimat',
      duration: 30,
      questions: 20,
      category: 'Tata Bahasa'
    },
    {
      id: 'vocabulary_intermediate',
      name: 'Kosakata Menengah',
      description: 'Kosakata tingkat menengah dan penggunaan kata',
      duration: 45,
      questions: 30,
      category: 'Kosakata'
    },
    {
      id: 'reading_comprehension',
      name: 'Pemahaman Bacaan',
      description: 'Uji kemampuan membaca dan pemahaman Anda',
      duration: 60,
      questions: 25,
      category: 'Membaca'
    },
    {
      id: 'cloze_advanced',
      name: 'Tes Rumpang Lanjutan',
      description: 'Tes rumpang lanjutan dengan bacaan kompleks',
      duration: 45,
      questions: 20,
      category: 'Rumpang'
    },
    {
      id: 'comprehensive_test',
      name: 'Tes Komprehensif',
      description: 'Tes lengkap mencakup semua kategori',
      duration: 90,
      questions: 50,
      category: 'Campuran'
    }
  ]

  useEffect(() => {
    if (isAdmin()) {
      navigate('/admin/questions')
      return
    }
    
    // Muat data dashboard
    loadDashboardData()
    clearExam() // Hapus status ujian sebelumnya
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Muat riwayat ujian
      const { data, error } = await db.getExamResults(profile?.id)
      if (error) throw error
      
      if (data && data.length > 0) {
        setExamHistory(data.slice(0, 5)) // 5 ujian terakhir
        
        // Hitung statistik
        const totalExams = data.length
        const totalScore = data.reduce((sum, exam) => sum + exam.score_total, 0)
        const averageScore = Math.round(totalScore / totalExams)
        const lastExamDate = data[0].created_at
        
        setStats({
          totalExams,
          averageScore,
          lastExamDate
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startExam = (packageId) => {
    navigate(`/siswa/exam?paket=${packageId}`)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat...</div>
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
                Halo, {profile?.full_name}!
              </h1>
              <p className="text-gray-600 mt-1">Siap belajar hari ini?</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">{profile?.school}</p>
              <button
                onClick={() => {
                  signOut()
                  navigate('/login')
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Kartu Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tryout Dikerjakan
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalExams}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rata-rata Skor
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.averageScore}/100
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Terakhir Tryout
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.lastExamDate ? formatDate(stats.lastExamDate) : 'Belum Pernah'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Paket Ujian */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Paket Tryout Tersedia
            </h2>
            <div className="space-y-4">
              {examPackages.map((pkg) => (
                <div key={pkg.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {pkg.description}
                      </p>
                      <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {pkg.duration} menit
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {pkg.questions} soal
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {pkg.category}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => startExam(pkg.id)}
                        className="btn-primary"
                      >
                        Mulai Kerjakan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Riwayat Ujian */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Riwayat Tryout
            </h2>
            <div className="space-y-3">
              {examHistory.length > 0 ? (
                examHistory.map((exam) => (
                  <div key={exam.id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Skor: {exam.score_total}/100
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(exam.created_at)}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exam.score_total >= 80 
                          ? 'bg-green-100 text-green-800'
                          : exam.score_total >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {exam.score_total >= 80 ? 'Sangat Baik' : 
                         exam.score_total >= 60 ? 'Baik' : 'Perlu Peningkatan'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center py-8">
                  <p className="text-gray-500">Belum ada riwayat tryout</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Mulai tryout pertama Anda sekarang!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
