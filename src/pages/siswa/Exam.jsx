import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { db } from '../../lib/supabase';
import { calculateCategoryScores } from '../../lib/saw';
import QuestionCard from '../../components/Exam/QuestionCard';
import Timer from '../../components/ui/Timer';
import Button from '../../components/ui/Button';

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, user } = useAuth();
  const { questions, answers, currentQuestionIndex, timeLeft, isActive, currentQuestion, totalQuestions, startExam, setAnswer, goToQuestion, nextQuestion, prevQuestion, finishExam, formatTime, clearExam } = useExam();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Auto-submit function ketika waktu habis
  useEffect(() => {
    window.autoSubmitExam = handleAutoSubmit;
    return () => {
      window.autoSubmitExam = null;
    };
  }, [answers, questions]);

  useEffect(() => {
    loadExamQuestions();
  }, []);

  const loadExamQuestions = async () => {
    try {
      setLoading(true);

      // Ambil ID paket dari URL
      const packageId = searchParams.get('paket');

      // Reset state ujian sebelumnya jika ada
      clearExam();

      // Muat soal dari database
      const { data, error } = await db.getQuestions();
      if (error) throw error;

      // Filter soal berdasarkan paket
      let examQuestions = data || [];

      // Filter logic based on new package names
      if (packageId === 'kickstart_diagnostic') {
        // Full mixed difficulty
        examQuestions = examQuestions.slice(0, 50);
      } else if (packageId === 'grammar_master') {
        examQuestions = examQuestions.filter((q) => q.category === 'Grammar').slice(0, 20);
      } else if (packageId === 'vocab_power') {
        examQuestions = examQuestions.filter((q) => q.category === 'Vocabulary').slice(0, 20);
      } else if (packageId === 'reading_pro') {
        examQuestions = examQuestions.filter((q) => q.category === 'Reading').slice(0, 15);
      } else if (packageId === 'cloze_challenge') {
        examQuestions = examQuestions.filter((q) => q.category === 'Cloze').slice(0, 20);
      } else if (packageId === 'daily_speed_check') {
        examQuestions = examQuestions.slice(0, 15);
      } else if (packageId === 'basic_mastery') {
        // 80% L1, 20% L2
        const l1 = examQuestions.filter((q) => q.difficulty === 1).slice(0, 24);
        const l2 = examQuestions.filter((q) => q.difficulty === 2).slice(0, 6);
        examQuestions = [...l1, ...l2];
      } else if (packageId === 'intermediate_path') {
        // 20% L1, 60% L2, 20% L3
        const l1 = examQuestions.filter((q) => q.difficulty === 1).slice(0, 6);
        const l2 = examQuestions.filter((q) => q.difficulty === 2).slice(0, 18);
        const l3 = examQuestions.filter((q) => q.difficulty === 3).slice(0, 6);
        examQuestions = [...l1, ...l2, ...l3];
      } else if (packageId === 'advanced_pro') {
        // 20% L2, 80% L3
        const l2 = examQuestions.filter((q) => q.difficulty === 2).slice(0, 6);
        const l3 = examQuestions.filter((q) => q.difficulty === 3).slice(0, 24);
        examQuestions = [...l2, ...l3];
      } else if (packageId === 'practice') {
        const targetCategory = searchParams.get('category');
        if (targetCategory) {
          examQuestions = examQuestions.filter((q) => q.category === targetCategory).slice(0, 15);
        }
      } else {
        examQuestions = examQuestions.slice(0, 50);
      }

      if (examQuestions.length === 0) {
        examQuestions = generateMockQuestions(packageId, searchParams.get('category'));
      }

      const duration = getPackageDuration(packageId);
      startExam(examQuestions, duration);
    } catch (error) {
      console.error('Error loading exam questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPackageDuration = (packageId) => {
    const durations = {
      kickstart_diagnostic: 3600, // 60 mins
      grammar_master: 1500, // 25 mins
      vocab_power: 1500, // 25 mins
      reading_pro: 1800, // 30 mins
      cloze_challenge: 1500, // 25 mins
      daily_speed_check: 1200, // 20 mins
      basic_mastery: 2400, // 40 mins
      intermediate_path: 2700, // 45 mins
      advanced_pro: 3000, // 50 mins
      practice: 900, // 15 mins
    };
    return durations[packageId] || 3600;
  };

  const generateMockQuestions = (packageId, targetCategory) => {
    const mockQuestions = [];
    const packageConfig = {
      kickstart_diagnostic: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 50 },
      grammar_master: { cats: ['Grammar'], count: 20 },
      vocab_power: { cats: ['Vocabulary'], count: 20 },
      reading_pro: { cats: ['Reading'], count: 15 },
      cloze_challenge: { cats: ['Cloze'], count: 20 },
      daily_speed_check: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 15 },
      basic_mastery: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 30 },
      intermediate_path: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 30 },
      advanced_pro: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 30 },
      practice: { cats: [targetCategory || 'Grammar'], count: 15 },
    };

    const config = packageConfig[packageId] || { cats: ['Grammar'], count: 20 };

    for (let i = 0; i < config.count; i++) {
      const category = config.cats[i % config.cats.length];
      mockQuestions.push({
        id: `mock_${packageId}_${i + 1}`,
        category: category,
        question_text: `Sample ${category} question ${i + 1} for ${packageId}.`,
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D', E: 'Option E' },
        correct_answer: 'A',
        difficulty: (i % 3) + 1,
        weight: (i % 3) + 1,
      });
    }

    return mockQuestions;
  };

  const handleAnswerSelect = (answer) => {
    setAnswer(currentQuestion.id, answer);
  };

  const handleQuestionClick = (index) => {
    goToQuestion(index);
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const examResult = finishExam();
      console.log('Submitting exam result for user:', user?.id);

      if (!user?.id) throw new Error('User not authenticated');

      // Tentukan tipe ujian berdasarkan paket
      const packageId = searchParams.get('paket');
      const examType = packageId === 'practice' ? 'practice' : 'tryout';

      // Simpan ke database
      const dbPayload = {
        user_id: user.id, // Use auth user ID directly for RLS
        exam_type: examType,
        score_total: examResult.scores.total,
        category_scores: {
          grammar: examResult.scores.grammar || 0,
          vocab: examResult.scores.vocab || 0,
          reading: examResult.scores.reading || 0,
          cloze: examResult.scores.cloze || 0,
        },
        answers: examResult.answers, // Supabase handles JSONB conversion automatically
      };

      console.log('Submitting Exam Payload:', dbPayload);

      const { error } = await db.saveExamResult(dbPayload);

      if (error) throw error;

      // Navigasi ke halaman hasil
      navigate('/siswa/result', { state: { examResult } });
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert(`Error submitting exam: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExam = async () => {
    setShowConfirmSubmit(false);
    await handleAutoSubmit();
  };

  const handleCancelExam = () => {
    clearExam();
    navigate('/siswa/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat ujian...</div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Tidak ada soal tersedia</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Tryout Sedang Berlangsung</h1>
              <p className="text-sm text-gray-600">
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Timer timeLeft={timeLeft} isActive={isActive} />
              <div className="flex flex-col space-y-2">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowConfirmCancel(true)}>
                  Batalkan
                </Button>

                <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => setShowConfirmSubmit(true)}>
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
              <h3 className="text-sm font-medium text-gray-900 mb-3">Navigasi Soal</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalQuestions }, (_, i) => {
                  const questionId = questions[i]?.id;
                  const isAnswered = answers[questionId] !== undefined;
                  const isCurrent = i === currentQuestionIndex;

                  return (
                    <button
                      key={i}
                      onClick={() => handleQuestionClick(i)}
                      className={`
                        w-8 h-8 rounded text-xs font-medium transition-colors
                        ${isCurrent ? 'bg-blue-600 text-white' : isAnswered ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      `}
                    >
                      {i + 1}
                    </button>
                  );
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
            <QuestionCard question={currentQuestion} questionNumber={currentQuestionIndex + 1} totalQuestions={totalQuestions} selectedAnswer={answers[currentQuestion.id]} onAnswerSelect={handleAnswerSelect} />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="secondary" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Sebelumnya
              </Button>

              <div className="text-sm text-gray-600">
                {Object.keys(answers).length} dari {totalQuestions} soal terjawab
              </div>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button variant="primary" onClick={() => setShowConfirmSubmit(true)}>
                  Kumpulkan Jawaban
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </Button>
              ) : (
                <Button variant="secondary" onClick={nextQuestion}>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kumpulkan Ujian?</h3>
            <p className="text-gray-600 mb-6">Apakah Anda yakin ingin mengumpulkan ujian? Waktu tersisa {formatTime(timeLeft)} lagi.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
                Batal
              </Button>
              <Button variant="danger" onClick={handleSubmitExam} disabled={submitting}>
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
            <h3 className="text-lg font-medium text-red-600 mb-4">Batalkan Ujian?</h3>
            <p className="text-gray-600 mb-6">Apakah Anda yakin ingin membatalkan ujian ini? Semua progres jawaban Anda akan hilang dan tidak dapat dikembalikan.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowConfirmCancel(false)}>
                Kembali Lanjut
              </Button>
              <Button variant="danger" onClick={handleCancelExam}>
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;
