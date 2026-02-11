import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { db } from '../../lib/supabase';

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();
  const { clearExam } = useExam();

  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    lastExamDate: null,
  });
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data paket ujian (mockup)
  // Data paket ujian yang baru
  const examPackages = [
    // Kategori: Ujian (Diagnostic & Proficiency)
    {
      id: 'kickstart_diagnostic',
      name: 'Kickstart Diagnostic',
      uniqueName: 'The Level Check',
      description: 'Paket lengkap (Mixed Difficulty) untuk profil awal.',
      duration: 60,
      questions: 50,
      category: 'Diagnostic',
      type: 'ujian',
    },
    {
      id: 'basic_mastery',
      name: 'Basic Mastery',
      uniqueName: 'Level A1-A2',
      description: 'Fokus pada penguasaan materi dasar.',
      duration: 40,
      questions: 30,
      category: 'Basic',
      type: 'ujian',
    },
    {
      id: 'intermediate_path',
      name: 'Intermediate Path',
      uniqueName: 'Level B1-B2',
      description: 'Fokus pada pemahaman konteks menengah.',
      duration: 45,
      questions: 30,
      category: 'Intermediate',
      type: 'ujian',
    },
    {
      id: 'advanced_pro',
      name: 'Advanced Pro',
      uniqueName: 'Level C1-C2',
      description: 'Tantangan tingkat tinggi & akademik.',
      duration: 50,
      questions: 30,
      category: 'Advanced',
      type: 'ujian',
    },
    // Kategori: Latihan (Daily & Focused)
    {
      id: 'daily_speed_check',
      name: 'Daily Speed-Check',
      uniqueName: 'Morning Brew',
      description: 'Versi lite Kickstart untuk rutinitas harian.',
      duration: 20,
      questions: 15,
      category: 'Daily',
      type: 'latihan',
    },
    {
      id: 'grammar_master',
      name: 'Grammar Master',
      uniqueName: 'Skill: Grammar',
      description: 'Fokus 100% pada struktur dan tata bahasa.',
      duration: 25,
      questions: 20,
      category: 'Skill',
      type: 'latihan',
    },
    {
      id: 'vocab_power',
      name: 'Vocab Power',
      uniqueName: 'Skill: Vocabulary',
      description: 'Fokus 100% pada kosakata dan makna kata.',
      duration: 25,
      questions: 20,
      category: 'Skill',
      type: 'latihan',
    },
    {
      id: 'reading_pro',
      name: 'Reading Pro',
      uniqueName: 'Skill: Reading',
      description: 'Fokus 100% pada pemahaman bacaan.',
      duration: 30,
      questions: 15,
      category: 'Skill',
      type: 'latihan',
    },
    {
      id: 'cloze_challenge',
      name: 'Cloze Challenge',
      uniqueName: 'Skill: Cloze',
      description: 'Fokus 100% pada pengisian teks rumpang.',
      duration: 25,
      questions: 20,
      category: 'Skill',
      type: 'latihan',
    },
  ];

  useEffect(() => {
    // Muat data dashboard
    loadDashboardData();
    clearExam(); // Hapus status ujian sebelumnya
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Muat riwayat ujian
      const { data, error } = await db.getExamResults(profile?.id);
      if (error) throw error;

      if (data && data.length > 0) {
        setExamHistory(data.slice(0, 5)); // 5 ujian terakhir

        // Hitung statistik
        const totalExams = data.length;
        const totalScore = data.reduce((sum, exam) => sum + exam.score_total, 0);
        const averageScore = Math.round(totalScore / totalExams);
        const lastExamDate = data[0].created_at;

        setStats({
          totalExams,
          averageScore,
          lastExamDate,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExam = (packageId) => {
    navigate(`/siswa/exam?paket=${packageId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat...</div>
      </div>
    );
  }

  const PackageCard = ({ pkg, onStart, layout = 'full' }) => (
    <div className={`card hover:shadow-md transition-shadow ${layout === 'compact' ? 'p-4' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">{pkg.name}</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded">{pkg.uniqueName}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
          <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {pkg.duration}m
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {pkg.questions} soal
            </span>
          </div>
        </div>
        <div className="ml-4">
          <button onClick={() => onStart(pkg.id)} className="btn-primary py-2 px-4 text-sm">
            Mulai
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Halo, {profile?.full_name}!</h1>
              <p className="text-gray-600 mt-1">Siap belajar hari ini?</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">{profile?.school}</p>
              <button
                onClick={() => {
                  signOut();
                  navigate('/login');
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Tryout Dikerjakan</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalExams}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rata-rata Skor</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.averageScore}/100</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Terakhir Tryout</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lastExamDate ? formatDate(stats.lastExamDate) : 'Belum Pernah'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Paket Ujian & Latihan */}
          <div className="lg:col-span-2 space-y-8">
            {/* Kategori Ujian */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ujian (Diagnostic & Proficiency)
              </h2>
              <div className="space-y-4">
                {examPackages
                  .filter((p) => p.type === 'ujian')
                  .map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} onStart={startExam} />
                  ))}
              </div>
            </section>

            {/* Kategori Latihan */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Latihan (Daily & Focused)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examPackages
                  .filter((p) => p.type === 'latihan')
                  .map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} onStart={startExam} layout="compact" />
                  ))}
              </div>
            </section>
          </div>

          {/* Riwayat Ujian */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Riwayat Tryout</h2>
            <div className="space-y-3">
              {examHistory.length > 0 ? (
                examHistory.map((exam) => (
                  <div key={exam.id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Skor: {exam.score_total}/100</p>
                        <p className="text-xs text-gray-500">{formatDate(exam.created_at)}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${exam.score_total >= 80 ? 'bg-green-100 text-green-800' : exam.score_total >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {exam.score_total >= 80 ? 'Sangat Baik' : exam.score_total >= 60 ? 'Baik' : 'Perlu Peningkatan'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center py-8">
                  <p className="text-gray-500">Belum ada riwayat tryout</p>
                  <p className="text-sm text-gray-400 mt-1">Mulai tryout pertama Anda sekarang!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
