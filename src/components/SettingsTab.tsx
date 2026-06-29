import React, { useState } from 'react';
import { supabase, addCategory, updateCategory, deleteCategory } from '../supabase';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, PlusCircle, LogOut, Sparkles, User, Check, Loader2, Edit2, Trash2, X, CheckCircle } from 'lucide-react';

interface SettingsTabProps {
  currentUser: any;
  categories: Category[];
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export default function SettingsTab({ currentUser, categories, onRefresh, onLogout }: SettingsTabProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatType, setNewCatType] = useState<'chung' | 'hoang' | 'uyen'>('chung');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Category Edit State
  const [editingCatId, setEditingCatId] = useState<string | number | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>('');
  const [editingCatType, setEditingCatType] = useState<'chung' | 'hoang' | 'uyen'>('chung');
  const [deletingCatId, setDeletingCatId] = useState<string | number | null>(null);

  // Sub-tab state for category divisions
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'shared'>('personal');

  // Identify who is logged in
  const displayName = currentUser?.user_metadata?.display_name || 
    (currentUser?.email?.includes('hoang') && !currentUser?.email?.includes('uyenhoang') ? 'Hoàng' : 'Uyên');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await addCategory({
        name: newCatName.trim(),
        type: newCatType
      });
      
      setNewCatName('');
      setSuccess(true);
      await onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError('Không thể thêm danh mục. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
    setEditingCatType(cat.type);
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setEditingCatName('');
  };

  const handleSaveEdit = async (catId: string | number) => {
    if (!editingCatName.trim()) return;
    try {
      await updateCategory(catId, editingCatName.trim(), editingCatType);
      setEditingCatId(null);
      await onRefresh();
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Không thể lưu thay đổi danh mục. Vui lòng thử lại!');
    }
  };

  const handleDeleteCat = async (catId: string | number) => {
    try {
      await deleteCategory(catId);
      setDeletingCatId(null);
      await onRefresh();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Không thể xóa danh mục. Có thể danh mục này đang liên kết với giao dịch hiện tại!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Filter Categories
  const myPersonalType = displayName === 'Hoàng' ? 'hoang' : 'uyen';
  const personalCategories = categories.filter(c => c.type === myPersonalType);
  const sharedCategories = categories.filter(c => c.type === 'chung');

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Title Header */}
      <div className="px-1 flex justify-between items-center">
        <div>
          <h2 className="font-serif italic text-2xl text-slate-700">Cài đặt hệ thống</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Quản lý danh mục & tài khoản</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors shadow-xs"
          title="Đăng xuất"
          id="btn-logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white/90 p-5 rounded-[28px] card-shadow border border-slate-100 flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
          displayName === 'Hoàng' ? 'pastel-mint text-teal-800' : 'pastel-pink text-pink-800'
        }`}>
          {displayName === 'Hoàng' ? '👨🏻‍💻' : '👩🏻‍🎨'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tài khoản đang đăng nhập</p>
          <h4 className="font-bold text-slate-700 text-base">{displayName} ({displayName === 'Hoàng' ? 'Chồng' : 'Vợ'})</h4>
          <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
        </div>
      </div>

      {/* Add New Category Card */}
      <div className="bg-white/90 p-6 rounded-[28px] card-shadow border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-teal-500" /> Thêm danh mục chi tiêu
        </h3>

        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block ml-1">Tên danh mục mới</label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ví dụ: Làm đẹp, Sức khoẻ, Xăng xe, Học tập..."
              className="w-full bg-[#F8F9FA] border-none rounded-2xl px-4 py-3 text-slate-700 font-semibold text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block ml-1">Phạm vi áp dụng</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewCatType('chung')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  newCatType === 'chung'
                    ? 'bg-slate-100 border-slate-300 text-slate-800 ring-2 ring-slate-50'
                    : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div>🏡</div>
                <div className="mt-0.5 text-[10px]">Chung</div>
              </button>

              <button
                type="button"
                onClick={() => setNewCatType('hoang')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  newCatType === 'hoang'
                    ? 'pastel-mint border-teal-300 text-teal-800 ring-2 ring-teal-50'
                    : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div>👨🏻‍💻</div>
                <div className="mt-0.5 text-[10px]">Hoàng</div>
              </button>

              <button
                type="button"
                onClick={() => setNewCatType('uyen')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  newCatType === 'uyen'
                    ? 'pastel-pink border-pink-300 text-pink-800 ring-2 ring-pink-50'
                    : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div>👩🏻‍🎨</div>
                <div className="mt-0.5 text-[10px]">Uyên</div>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-teal-50 border border-teal-100 rounded-2xl p-3.5 flex items-center space-x-2 text-teal-800"
              >
                <Check className="w-4 h-4 text-teal-600 stroke-[3]" />
                <span className="text-xs font-bold">Thêm danh mục mới thành công!</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-100 rounded-2xl p-3.5 text-xs text-red-800 font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={submitting || !newCatName.trim()}
            className={`w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 ${
              submitting || !newCatName.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-600 shadow-teal-100/50 cursor-pointer active:scale-98'
            }`}
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            <span>Thêm danh mục</span>
          </button>
        </form>
      </div>

      {/* Categories List Card with Division Tabs */}
      <div className="bg-white/90 p-6 rounded-[28px] card-shadow border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-pink-500" /> Danh sách danh mục
        </h3>

        {/* Division Tab Switcher */}
        <div className="flex bg-[#F8F9FA] rounded-2xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('personal')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              activeSubTab === 'personal'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Danh mục cá nhân tôi ({personalCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('shared')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              activeSubTab === 'shared'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Danh mục Quỹ chung ({sharedCategories.length})
          </button>
        </div>

        {/* List render */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {activeSubTab === 'personal' ? (
            personalCategories.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">Chưa có danh mục cá nhân nào.</div>
            ) : (
              personalCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] hover:bg-[#F1F3F5] transition-all relative group"
                >
                  {editingCatId === cat.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="bg-white border border-stone-200 px-2 py-1 rounded-xl text-xs font-bold text-slate-700 w-full focus:outline-hidden focus:ring-2 focus:ring-teal-400"
                        placeholder="Đổi tên..."
                      />
                      <select
                        value={editingCatType}
                        onChange={(e: any) => setEditingCatType(e.target.value)}
                        className="bg-white border border-stone-200 px-2 py-1 rounded-xl text-[10px] font-bold text-slate-600"
                      >
                        <option value="hoang">Hoàng</option>
                        <option value="uyen">Uyên</option>
                        <option value="chung">Chung</option>
                      </select>
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                        title="Lưu"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-stone-400 hover:text-stone-600"
                        title="Hủy"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {cat.type === 'chung' ? '🏡' : cat.type === 'hoang' ? '👨🏻‍💻' : '👩🏻‍🎨'}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          cat.type === 'hoang'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {cat.type === 'hoang' ? 'Hoàng' : 'Uyên'}
                        </span>

                        {/* Inline controls */}
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1 text-stone-400 hover:text-teal-600 hover:bg-white rounded-md transition-colors"
                            title="Sửa danh mục"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {deletingCatId === cat.id ? (
                            <div className="flex items-center space-x-1 bg-red-500 text-white rounded-lg px-1.5 py-0.5 text-[9px] font-extrabold shadow-sm">
                              <button onClick={() => handleDeleteCat(cat.id)} className="hover:underline">Xóa</button>
                              <span>|</span>
                              <button onClick={() => setDeletingCatId(null)} className="hover:underline">Hủy</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingCatId(cat.id)}
                              className="p-1 text-stone-400 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )
          ) : (
            sharedCategories.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">Chưa có danh mục chung nào.</div>
            ) : (
              sharedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] hover:bg-[#F1F3F5] transition-all relative group"
                >
                  {editingCatId === cat.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="bg-white border border-stone-200 px-2 py-1 rounded-xl text-xs font-bold text-slate-700 w-full focus:outline-hidden focus:ring-2 focus:ring-teal-400"
                        placeholder="Đổi tên..."
                      />
                      <select
                        value={editingCatType}
                        onChange={(e: any) => setEditingCatType(e.target.value)}
                        className="bg-white border border-stone-200 px-2 py-1 rounded-xl text-[10px] font-bold text-slate-600"
                      >
                        <option value="hoang">Hoàng</option>
                        <option value="uyen">Uyên</option>
                        <option value="chung">Chung</option>
                      </select>
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                        title="Lưu"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-stone-400 hover:text-stone-600"
                        title="Hủy"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🏡</span>
                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-200/60 text-slate-600">
                          Chung
                        </span>

                        {/* Inline controls */}
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1 text-stone-400 hover:text-teal-600 hover:bg-white rounded-md transition-colors"
                            title="Sửa danh mục"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {deletingCatId === cat.id ? (
                            <div className="flex items-center space-x-1 bg-red-500 text-white rounded-lg px-1.5 py-0.5 text-[9px] font-extrabold shadow-sm">
                              <button onClick={() => handleDeleteCat(cat.id)} className="hover:underline">Xóa</button>
                              <span>|</span>
                              <button onClick={() => setDeletingCatId(null)} className="hover:underline">Hủy</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingCatId(cat.id)}
                              className="p-1 text-stone-400 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
