import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useExam } from '../../context/ExamContext'
import { db } from '../../lib/supabase'
import { calculateCategoryScores } from '../../lib/saw'
import QuestionCard from '../../components/Exam/QuestionCard'
import Timer from '../../components/ui/Timer'
import Button from '../../components/ui/Button'

const Exam = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, user } = useAuth()
  const {
    questions,
    answers,
    currentQuestionIndex,
    timeLeft,
    isActive,
    currentQuestion,
    totalQuestions,
    startExam,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    finishExam,
    formatTime,
    clearExam
  } = useExam()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  // Auto-submit function ketika waktu habis
  useEffect(() => {
    window.autoSubmitExam = handleAutoSubmit
    return () => {
      window.autoSubmitExam = null
    }
  }, [answers, questions])

  useEffect(() => {
    loadExamQuestions()
  }, [])

  const loadExamQuestions = async () => {
    try {
      setLoading(true)
      
      // Ambil ID paket dari URL
      const packageId = searchParams.get('paket')
      
      // Reset state ujian sebelumnya jika ada
      clearExam()

      // Muat soal dari database
      const { data, error } = await db.getQuestions()
      if (error) throw error
      
      // Filter soal berdasarkan paket atau gunakan semua jika tidak ada paket
      let examQuestions = data || []
      
      // Mock package filtering (in real app, questions would have package_id)
      if (packageId === 'grammar_basic') {
        examQuestions = examQuestions.filter(q => q.category === 'Grammar').slice(0, 20)
      } else if (packageId === 'vocabulary_intermediate') {
        examQuestions = examQuestions.filter(q => q.category === 'Vocabulary').slice(0, 30)
      } else if (packageId === 'reading_comprehension') {
        examQuestions = examQuestions.filter(q => q.category === 'Reading').slice(0, 25)
      } else if (packageId === 'cloze_advanced') {
        examQuestions = examQuestions.filter(q => q.category === 'Cloze').slice(0, 20)
      } else if (packageId === 'comprehensive_test') {
        // Campuran semua category
        const categories = ['Grammar', 'Vocabulary', 'Reading', 'Cloze']
        examQuestions = []
        categories.forEach(cat => {
          const catQuestions = data.filter(q => q.category === cat).slice(0, 12)
          examQuestions.push(...catQuestions)
        })
      } else if (packageId === 'practice') {
        // Latihan Area Lemah: Ambil soal berdasarkan kategori spesifik
        const targetCategory = searchParams.get('category')
        if (targetCategory) {
          // Filter hanya kategori target, ambil 15 soal
          examQuestions = examQuestions.filter(q => q.category === targetCategory).slice(0, 15)
        }
      } else {
        // Default: gunakan semua soal yang tersedia hingga 50
        examQuestions = examQuestions.slice(0, 50)
      }
      
      if (examQuestions.length === 0) {
        // Soal dummy jika database kosong
        examQuestions = generateMockQuestions(packageId, searchParams.get('category'))
      }
      
      // Mulai ujian dengan soal
      const duration = getPackageDuration(packageId)
      startExam(examQuestions, duration)
      
    } catch (error) {
      console.error('Error loading exam questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPackageDuration = (packageId) => {
    const durations = {
      grammar_basic: 1800, // 30 minutes
      vocabulary_intermediate: 2700, // 45 minutes
      reading_comprehension: 3600, // 60 minutes
      cloze_advanced: 2700, // 45 minutes
      comprehensive_test: 5400, // 90 minutes
      practice: 900 // 15 minutes
    }
    return durations[packageId] || 3600 // Default 60 minutes
  }

  const generateMockQuestions = (packageId, targetCategory) => {
    const mockQuestions = []
    const categories = {
      grammar_basic: ['Grammar'],
      vocabulary_intermediate: ['Vocabulary'],
      reading_comprehension: ['Reading'],
      cloze_advanced: ['Cloze'],
      comprehensive_test: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'],
      practice: [targetCategory || 'Grammar']
    }
    
    const selectedCategories = categories[packageId] || ['Grammar']
    const questionCount = getPackageDuration(packageId) / 90 // Rough estimate
    
    for (let i = 0; i < Math.min(questionCount, 50); i++) {
      const category = selectedCategories[i % selectedCategories.length]
      mockQuestions.push({
        id: `mock_${i + 1}`,
        category: category,
        question_text: `Sample ${category} question ${i + 1}. This is a mock question for testing purposes.`,
        options: {
          A: 'Option A text',
          B: 'Option B text',
          C: 'Option C text',
          D: 'Option D text',
          E: 'Option E text'
        },
        correct_answer: 'A'
      })
    }
    
    return mockQuestions
  }

  const handleAnswerSelect = (answer) => {
    setAnswer(currentQuestion.id, answer)
  }

  const handleQuestionClick = (index) => {
    goToQuestion(index)
  }

  const handleAutoSubmit = async () => {
    if (submitting) return
    
    setSubmitting(true)
    try {
      const examResult = finishExam()
      console.log('Submitting exam result for user:', user?.id)
      
      if (!user?.id) throw new Error('User not authenticated')

      // Tentukan tipe ujian berdasarkan paket
      const packageId = searchParams.get('paket')
      const examType = packageId === 'practice' ? 'practice' : 'tryout'

      // Simpan ke database
      const dbPayload = {
        user_id: user.id, // Use auth user ID directly for RLS
        exam_type: examType,
        score_total: examResult.scores.total,
        category_scores: {
          grammar: examResult.scores.grammar || 0,
          vocab: examResult.scores.vocab || 0,
          reading: examResult.scores.reading || 0,
          cloze: examResult.scores.cloze || 0
        },
        answers: examResult.answers // Supabase handles JSONB conversion automatically
      }
      
      console.log('Submitting Exam Payload:', dbPayload)

      const { error } = await db.saveExamResult(dbPayload)
      
      if (error) throw error
      
      // Navigasi ke halaman hasil
      navigate('/siswa/result', { state: { examResult } })
      
    } catch (error) {
      console.error('Error submitting exam:', error)
      alert(`Error submitting exam: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitExam = async () => {
    setShowConfirmSubmit(false)
    await handleAutoSubmit()
  }

  const handleCancelExam = () => {
    clearExam()
    navigate('/siswa/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat ujian...</div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Tidak ada soal tersedia</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Tryout Sedang Berlangsung
              </h1>
              <p className="text-sm text-gray-600">
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Timer timeLeft={timeLeft} isActive={isActive} />
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowConfirmCancel(true)}
                >
                  Batalkan
                </Button>

                <Button
                  variant="outline"
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => setShowConfirmSubmit(true)}
                >
                  Kumpulkan Jawaban
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Navigasi Soal
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalQuestions }, (_, i) => {
                  const questionId = questions[i]?.id
                  const isAnswered = answers[questionId] !== undefined
                  const isCurrent = i === currentQuestionIndex
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handleQuestionClick(i)}
                      className={`
                        w-8 h-8 rounded text-xs font-medium transition-colors
                        ${isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : isAnswered
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Terjawab:</span>
                  <span className="font-medium">
                    {Object.keys(answers).length} / {totalQuestions}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              selectedAnswer={answers[currentQuestion.id]}
              onAnswerSelect={handleAnswerSelect}
            />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="secondary"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Sebelumnya
              </Button>

              <div className="text-sm text-gray-600">
                {Object.keys(answers).length} dari {totalQuestions} soal terjawab
              </div>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  onClick={() => setShowConfirmSubmit(true)}
                >
                  Kumpulkan Jawaban
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={nextQuestion}
                >
                  Selanjutnya
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Kumpulkan Ujian?
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin mengumpulkan ujian? Waktu tersisa {formatTime(timeLeft)} lagi.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleSubmitExam}
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : 'Kumpulkan Jawaban'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showConfirmCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-red-600 mb-4">
              Batalkan Ujian?
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin membatalkan ujian ini? Semua progres jawaban Anda akan hilang dan tidak dapat dikembalikan.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmCancel(false)}
              >
                Kembali Lanjut
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelExam}
              >
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Exam
