import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Questions = () => {
  const { isAdmin } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Grammar',
    sub_category: '',
    question_text: '',
    options: { A: '', B: '', C: '', D: '', E: '' },
    correct_answer: 'A',
    difficulty: 1,
    weight: 1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const categories = ['Grammar', 'Vocabulary', 'Reading', 'Cloze'];
  const subCategories = {
    Grammar: ['Tenses & Aspects', 'Passive Voice & Causative', 'Modals & Conditionals', 'Sentence Structure'],
    Vocabulary: ['Word Formation', 'Synonym/Antonym', 'Collocations & Phrasal Verbs', 'Legal/Formal Register'],
    Reading: ['Main Idea/Gist', 'Specific Detail', 'Inference/Implication', 'Reference'],
    Cloze: ['Grammatical Cloze', 'Lexical Cloze', 'Cohesive Devices'],
  };
  const options = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    if (!isAdmin()) {
      // Redirect jika bukan admin
      window.location.href = '/siswa/dashboard';
      return;
    }

    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getQuestions();
      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validasi form
      if (!formData.question_text.trim()) {
        alert('Teks soal wajib diisi');
        return;
      }

      if (!formData.sub_category) {
        alert('Sub-kategori (Topik) wajib dipilih');
        return;
      }

      for (const option of options) {
        if (!formData.options[option]?.trim()) {
          alert(`Pilihan ${option} wajib diisi`);
          return;
        }
      }

      // Convert difficulty and weight to numbers
      const submissionData = {
        ...formData,
        difficulty: parseInt(formData.difficulty),
        weight: parseInt(formData.weight),
      };

      if (editingQuestion) {
        // Update soal yang ada
        const { error } = await db.updateQuestion(editingQuestion.id, submissionData);
        if (error) throw error;
      } else {
        // Buat soal baru
        const { error } = await db.createQuestion(submissionData);
        if (error) throw error;
      }

      // Reset form dan muat ulang soal
      resetForm();
      await loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Gagal menyimpan soal. Silakan coba lagi.');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      category: question.category,
      sub_category: question.sub_category || '',
      question_text: question.question_text,
      options: question.options || { A: '', B: '', C: '', D: '', E: '' },
      correct_answer: question.correct_answer,
      difficulty: question.difficulty || 1,
      weight: question.weight || 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
      return;
    }

    try {
      const { error } = await db.deleteQuestion(id);
      if (error) throw error;

      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Gagal menghapus soal. Silakan coba lagi.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
    setFormData({
      category: 'Grammar',
      sub_category: '',
      question_text: '',
      options: { A: '', B: '', C: '', D: '', E: '' },
      correct_answer: 'A',
      difficulty: 1,
      weight: 1,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (option, value) => {
    setFormData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [option]: value,
      },
    }));
  };

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || q.category === filterCategory;
    const matchesDifficulty = !filterDifficulty || q.difficulty === parseInt(filterDifficulty);
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Paginated questions
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterDifficulty]);

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
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Soal</h1>
              <p className="text-gray-600 mt-1">Kelola soal ujian untuk semua kategori</p>
            </div>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Tambah Soal Baru
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => {
            const count = questions.filter((q) => q.category === category).length;
            return (
              <div key={category} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{category}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    category === 'Grammar' ? 'bg-blue-100 text-blue-600' : category === 'Vocabulary' ? 'bg-green-100 text-green-600' : category === 'Reading' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters & Questions Table */}
        <div className="card">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Data Perolehan Soal ({questions.length})</h2>
              <div className="flex flex-wrap items-center gap-2">
                <input type="text" placeholder="Cari teks soal..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">Semua Level</option>
                  <option value="1">Level 1 (A1/A2)</option>
                  <option value="2">Level 2 (B1/B2)</option>
                  <option value="3">Level 3 (C1/C2)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Memuat basis data soal...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Soal & Topik</th>
                      <th className="px-6 py-3 text-left">Level</th>
                      <th className="px-6 py-3 text-left">Point</th>
                      <th className="px-6 py-3 text-left">Key</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-sm">{q.question_text}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{q.category}</span>
                            <span className="text-xs text-gray-500 uppercase font-medium">• {q.sub_category || 'General'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${q.difficulty === 3 ? 'bg-red-100 text-red-700' : q.difficulty === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            Lvl {q.difficulty || 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">W:{q.weight || 1}</td>
                        <td className="px-6 py-4">
                          <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-800 rounded text-xs font-bold border">{q.correct_answer}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => handleEdit(q)} className="text-blue-600 hover:text-blue-900 font-medium">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-900 font-medium">
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Menampilkan <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredQuestions.length)}</span> dari{' '}
                  <span className="font-bold">{filteredQuestions.length}</span> soal
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                    Sebelumnya
                  </button>
                  <div className="flex items-center space-x-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                        if (pageNum === 2 || pageNum === totalPages - 1)
                          return (
                            <span key={pageNum} className="px-2">
                              ...
                            </span>
                          );
                        return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded border text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{editingQuestion ? '✏️ Perbarui Soal' : '➕ Tambah Soal Baru'}</h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta Row: Category, Topic, Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori Utama</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" required>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sub-Kategori (Topic)</label>
                  <select name="sub_category" value={formData.sub_category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" required>
                    <option value="">Pilih Topik...</option>
                    {subCategories[formData.category]?.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Difficulty</label>
                    <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" required>
                      <option value="1">1 (Easy)</option>
                      <option value="2">2 (Medium)</option>
                      <option value="3">3 (Hard)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Weight</label>
                    <select name="weight" value={formData.weight} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" required>
                      <option value="1">1 Poin</option>
                      <option value="2">2 Poin</option>
                      <option value="3">3 Poin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Question Body */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Narasi / Teks Soal</label>
                <textarea
                  name="question_text"
                  value={formData.question_text}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Ketikkan soal atau bacaan di sini..."
                  required
                />
              </div>

              {/* Options Grid */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Opsi Jawaban & Kunci</label>
                <div className="grid grid-cols-1 gap-3">
                  {options.map((option) => (
                    <div key={option} className="flex group">
                      <div
                        className={`w-10 flex items-center justify-center rounded-l-lg border border-r-0 font-bold transition-colors ${
                          formData.correct_answer === option ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {option}
                      </div>
                      <input
                        type="text"
                        value={formData.options[option] || ''}
                        onChange={(e) => handleOptionChange(option, e.target.value)}
                        className={`flex-1 px-4 py-2 border-y border-r rounded-r-lg focus:ring-2 focus:ring-blue-500 text-sm ${formData.correct_answer === option ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-300'}`}
                        placeholder={`Jawaban opsi ${option}...`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer Selection */}
              <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-900">Set Kunci Jawaban</p>
                  <p className="text-xs text-blue-700">Pilih opsi yang merupakan jawaban benar.</p>
                </div>
                <div className="flex space-x-2">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, correct_answer: option }))}
                      className={`w-10 h-10 rounded-lg font-bold transition-all border-2 ${
                        formData.correct_answer === option ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
                <button type="button" onClick={resetForm} className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">
                  Batal
                </button>
                <button type="submit" className="px-10 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all">
                  {editingQuestion ? 'Simpan Perubahan' : 'Terbitkan Soal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
