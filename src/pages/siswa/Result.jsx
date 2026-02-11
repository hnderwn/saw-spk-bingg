import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { calculateSAWPriority } from '../../lib/saw';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [examResult, setExamResult] = useState(null);
  const [sawRecommendations, setSawRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedQuestions, setDetailedQuestions] = useState([]);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [selectedPracticeCategory, setSelectedPracticeCategory] = useState(null);
  const [explanationLang, setExplanationLang] = useState('en');

  // Fetch detailed questions when examResult is available
  useEffect(() => {
    const fetchQuestionDetails = async () => {
      if (!examResult?.answers) return;

      try {
        const questionIds = Object.keys(examResult.answers);
        if (questionIds.length === 0) return;

        // Fetch questions from DB based on IDs
        const { data, error } = await db.getQuestions();
        if (error) throw error;

        // Filter only questions that were in the exam
        // Note: In a real app with many questions, we should use a "where in" query
        // But for this mockup/small scale, filtering client-side is fine
        const relevantQuestions = data.filter((q) => questionIds.includes(q.id));
        setDetailedQuestions(relevantQuestions);
      } catch (err) {
        console.error('Error fetching question details:', err);
      }
    };

    if (examResult) {
      fetchQuestionDetails();
    }
  }, [examResult]);

  useEffect(() => {
    const init = async () => {
      try {
        if (location.state?.examResult) {
          // Menggunakan hasil dari state
          console.log('Using result from state:', location.state.examResult);
          setExamResult(location.state.examResult);
          const recommendations = calculateSAWPriority(location.state.examResult.scores);
          setSawRecommendations(recommendations);
          setLoading(false);
        } else {
          // Muat hasil ujian terakhir jika tidak ada state
          console.log('No state, loading latest result for user:', user?.id);
          await loadLatestResult();
        }
      } catch (error) {
        console.error('Error in Result initialization:', error);
        setLoading(false); // Hentikan loading saat error
      }
    };

    init();
  }, [user]); // Jalankan ulang jika user cocok

  const loadLatestResult = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await db.getExamResults(user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const latest = data[0];

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
            ...latest.category_scores,
          },
          answers: latest.answers,
        };

        // Jika perhitungan SAW ketat memerlukan struktur sempurna, pastikan default
        if (!result.scores.total) result.scores.total = 0;

        setExamResult(result);
        const recommendations = calculateSAWPriority(result.scores);
        setSawRecommendations(recommendations);
      } else {
        console.log('No results found in DB');
        // navigate('/siswa/dashboard') // Optional: stay on page saying "No results"
      }
    } catch (error) {
      console.error('Error loading result from DB:', error);
      // navigate('/siswa/dashboard')
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Sangat Baik';
    if (score >= 60) return 'Baik';
    return 'Perlu Peningkatan';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}d`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat hasil...</div>
      </div>
    );
  }

  if (!examResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Tidak ada hasil ujian ditemukan</p>
          <Button onClick={() => navigate('/siswa/dashboard')}>Kembali ke Dashboard</Button>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Hasil Ujian</h1>
              <p className="text-gray-600 mt-1">Kerja bagus, {profile?.full_name}! Berikut analisis performa Anda.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Selesai: {new Date(examResult.endTime).toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Score */}
        <div className="mb-8">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skor Total Anda</h2>
            <div className="mb-4">
              <span className={`text-6xl font-bold ${getScoreColor(examResult.scores.total)}`}>{examResult.scores.total}</span>
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span>Durasi: {formatDuration(examResult.duration)}</span>
              <span>•</span>
              <span>
                Soal: {examResult.answered}/{examResult.questions}
              </span>
              <span>•</span>
              <span className={`font-medium ${getScoreColor(examResult.scores.total)}`}>{getScoreLabel(examResult.scores.total)}</span>
            </div>
          </Card>
        </div>
        {/* Action Buttons */}
        <div className="my-8 flex justify-center space-x-4">
          <Button variant="primary" onClick={() => navigate('/siswa/dashboard')}>
            Kembali ke Dashboard
          </Button>
          <Button variant="outline" onClick={() => setShowDetails(true)}>
            Lihat Pembahasan
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              // Buka modal konfirmasi latihan
              const weakestRec = sawRecommendations[0];
              if (weakestRec) {
                setSelectedPracticeCategory(weakestRec);
                setIsPracticeModalOpen(true);
              }
            }}
          >
            Latihan Area Lemah
          </Button>
        </div>

        {/* Detailed Review Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-900">Pembahasan Soal</h2>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setExplanationLang('en')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${explanationLang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setExplanationLang('id')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${explanationLang === 'id' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Indonesia
                    </button>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowDetails(false)}>
                  Tutup
                </Button>
              </div>

              <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                {detailedQuestions.length > 0 ? (
                  <div className="space-y-6">
                    {detailedQuestions.map((item, index) => {
                      const userAnswer = examResult.answers[item.id];
                      const isCorrect = userAnswer === item.correct_answer;

                      return (
                        <Card key={item.id} className={`p-6 border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                          <div className="flex items-start justify-between mb-4">
                            <span className="font-semibold text-gray-700">Soal No. {index + 1}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{isCorrect ? 'BENAR' : 'SALAH'}</span>
                          </div>

                          <p className="text-gray-900 mb-4 whitespace-pre-wrap">{item.question_text}</p>

                          <div className="space-y-2 mb-4">
                            {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                              const optText = item.options?.[opt];
                              if (!optText) return null;

                              let optionClass = 'p-3 rounded-lg border flex items-center ';
                              if (opt === item.correct_answer) {
                                optionClass += 'bg-green-50 border-green-200 text-green-900 font-medium';
                              } else if (opt === userAnswer && !isCorrect) {
                                optionClass += 'bg-red-50 border-red-200 text-red-900';
                              } else {
                                optionClass += 'bg-white border-gray-200 text-gray-600';
                              }

                              return (
                                <div key={opt} className={optionClass}>
                                  <span className="w-6 font-bold">{opt}.</span>
                                  <span>{optText}</span>
                                  {opt === item.correct_answer && (
                                    <svg className="w-5 h-5 ml-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {opt === userAnswer && !isCorrect && (
                                    <svg className="w-5 h-5 ml-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h4 className="font-bold text-blue-900">Pembahasan ({explanationLang === 'en' ? 'English' : 'Indonesia'})</h4>
                            </div>
                            <p className="text-blue-800 text-sm whitespace-pre-wrap">
                              {explanationLang === 'id' ? item.explanation_bahasa || 'Maaf, penjelasan bahasa Indonesia belum tersedia untuk soal ini.' : item.explanation || 'No explanation available for this question.'}
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-gray-500">Memuat detail soal...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Practice Confirmation Modal */}
        {isPracticeModalOpen && selectedPracticeCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Latihan Fokus: {selectedPracticeCategory.category}</h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">Sistem mendeteksi skor {selectedPracticeCategory.category} Anda masih perlu ditingkatkan.</p>
              </div>

              <p className="text-gray-600 mb-6">
                Latihan ini terdiri dari <strong>15 soal</strong> khusus kategori {selectedPracticeCategory.category} untuk membantu Anda memahami materi lebih dalam.
              </p>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsPracticeModalOpen(false)}>
                  Nanti Saja
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // Navigate to Exam with specific practice params
                    const catKey = selectedPracticeCategory.categoryKey; // e.g., 'grammar'
                    // Map categoryKey to DB Category Value (Start Case)
                    const dbCategory = catKey.charAt(0).toUpperCase() + catKey.slice(1); // 'Grammar', 'Reading'

                    navigate(`/siswa/exam?paket=practice&category=${dbCategory}`);
                  }}
                >
                  Mulai Latihan
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skor per Kategori</h2>
            <div className="space-y-4">
              {Object.entries(examResult.scores)
                .filter(([category]) => category !== 'total')
                .map(([category, data]) => {
                  const score = typeof data === 'object' ? data.score : data;
                  const cefr = sawRecommendations.find((r) => r.categoryKey === category)?.cefrLevel || 'A1';

                  return (
                    <Card key={category} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 capitalize">
                              {category === 'vocab' ? 'Vocab - Kosakata' : category === 'grammar' ? 'Grammar - Tata Bahasa' : category === 'reading' ? 'Reading - Membaca' : category === 'cloze' ? 'Cloze - Rumpang' : category}
                            </h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">{cefr}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{getScoreLabel(score)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
                          <span className="text-gray-500">/100</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* SAW Recommendations */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rekomendasi Prioritas Belajar</h2>
            <div className="space-y-4">
              {sawRecommendations.map((rec, index) => (
                <ExpandableRecommendationCard key={rec.categoryKey} rec={rec} index={index} />
              ))}
            </div>
          </div>
        </div>
        {/* Explanation */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Bagaimana rekomendasi dihitung?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Sistem kami menggunakan metode SAW (Simple Additive Weighting) untuk menghitung prioritas belajar:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Skor akhir dihitung berdasarkan bobot soal (Level 1-3). Soal sulit (C1/C2) memberi poin lebih besar.</li>
                <li>Sistem mendeteksi level CEFR Anda (A1-C2) berdasarkan seberapa konsisten Anda menjawab benar di tiap tingkat kesulitan.</li>
                <li>Metode SAW memberikan prioritas lebih tinggi pada kategori yang masih memiliki kesalahan di level Dasar (A1/A2).</li>
                <li>Sistem menyarankan untuk fokus pada area dengan potensi peningkatan skor terbesar.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ExpandableRecommendationCard = ({ rec, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 transition-all duration-200">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3" style={{ backgroundColor: rec.color }}>
            {index + 1}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{rec.category}</h3>
            <p className="text-sm text-gray-600">{rec.label}</p>
          </div>
        </div>
        <div className="text-right flex items-center">
          <div className="mr-3">
            <div className="text-sm text-gray-600">Skor: {rec.rawScore}/100</div>
            <div className="text-xs text-gray-500">Prioritas: {(rec.priorityScore * 100).toFixed(1)}%</div>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
            <p className="text-sm text-blue-900">
              <strong>Rekomendasi:</strong> {rec.recommendation}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Kebutuhan Belajar: {rec.cost}/100</span>
            <span>Prioritas Kategori: {(rec.weight * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Result;
