import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unique_name: '',
    description: '',
    duration: 3600,
    question_count: 50,
    category: 'Diagnostic',
    type: 'ujian',
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getPackages();
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        unique_name: pkg.unique_name || '',
        description: pkg.description || '',
        duration: pkg.duration,
        question_count: pkg.question_count,
        category: pkg.category,
        type: pkg.type,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        unique_name: '',
        description: '',
        duration: 3600,
        question_count: 50,
        category: 'Diagnostic',
        type: 'ujian',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        const { error } = await db.updatePackage(editingPackage.id, formData);
        if (error) throw error;

        await db.createAuditLog({
          action: 'UPDATE_PACKAGE',
          target_id: editingPackage.id,
          description: `Memperbarui paket: ${formData.name}`,
        });
      } else {
        const { error } = await db.createPackage(formData);
        if (error) throw error;

        await db.createAuditLog({
          action: 'CREATE_PACKAGE',
          description: `Membuat paket baru: ${formData.name}`,
        });
      }
      setIsModalOpen(false);
      loadPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus paket "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const { error } = await db.deletePackage(id);
      if (error) throw error;

      await db.createAuditLog({
        action: 'DELETE_PACKAGE',
        target_id: id,
        description: `Menghapus paket: ${name}`,
      });

      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Paket</h1>
          <p className="text-slate-500 mt-1">Konfigurasi jenis ujian, durasi, dan jumlah soal.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center">
          <span className="mr-2">+</span> Buat Paket Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading
          ? Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-slate-100 rounded-full w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-50 rounded-full w-1/2 mb-8"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-slate-100 rounded-lg w-16"></div>
                    <div className="h-8 bg-slate-100 rounded-lg w-16"></div>
                  </div>
                </Card>
              ))
          : packages.map((pkg) => (
              <Card key={pkg.id} className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all border-none shadow-lg shadow-slate-200/50 flex flex-col h-full bg-white rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${pkg.type === 'ujian' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{pkg.type}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => handleOpenModal(pkg)} className="text-slate-400 hover:text-blue-600 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(pkg.id, pkg.name)} className="text-slate-400 hover:text-red-600 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight mb-1">{pkg.name}</h3>
                <p className="text-xs font-bold text-blue-600 mb-3">{pkg.unique_name || 'Generic Package'}</p>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1 italic">{pkg.description || 'Tidak ada deskripsi.'}</p>

                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Durasi</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{Math.floor(pkg.duration / 60)} menit</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Jumlah Soal</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{pkg.question_count} butir</p>
                  </div>
                </div>
              </Card>
            ))}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-8 bg-white rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">{editingPackage ? 'Edit Paket Ujian' : 'Buat Paket Baru'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Paket</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Mid-Term Examination"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Label Unik</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                    value={formData.unique_name}
                    onChange={(e) => setFormData({ ...formData, unique_name: e.target.value })}
                    placeholder="e.g. Level B1-B2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kategori</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deskripsi Singkat</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all resize-none h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Durasi (Detik)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">3600 = 60 menit</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jumlah Soal</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                    value={formData.question_count}
                    onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipe Paket</label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="type" className="text-blue-600" checked={formData.type === 'ujian'} onChange={() => setFormData({ ...formData, type: 'ujian' })} />
                    <span className="text-sm font-medium">Ujian</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="type" className="text-emerald-600" checked={formData.type === 'latihan'} onChange={() => setFormData({ ...formData, type: 'latihan' })} />
                    <span className="text-sm font-medium">Latihan</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <Button variant="outline" type="button" className="flex-1 rounded-2xl py-4" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1 rounded-2xl py-4 bg-slate-900 hover:bg-black">
                  {editingPackage ? 'Simpan Perubahan' : 'Buat Paket'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Packages;
