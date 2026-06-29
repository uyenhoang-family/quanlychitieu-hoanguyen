import React, { useState } from 'react';
import { Transaction, Budget, Category } from '../types';
import { Edit2, TrendingDown, Wallet, CheckCircle, RefreshCw, Eye, EyeOff, Trash2, ShieldAlert, Paperclip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';

interface OverviewTabProps {
  transactions: Transaction[];
  categories: Category[];
  budget: Budget;
  setBudget: (budget: Budget) => void;
  loading: boolean;
  onRefresh: () => Promise<void>;
  currentUser: any;
}

export default function OverviewTab({
  transactions,
  categories,
  budget,
  setBudget,
  loading,
  onRefresh,
  currentUser,
}: OverviewTabProps) {
  const [isEditingHoang, setIsEditingHoang] = useState(false);
  const [isEditingUyen, setIsEditingUyen] = useState(false);
  const [hoangInput, setHoangInput] = useState(budget.hoang.toString());
  const [uyenInput, setUyenInput] = useState(budget.uyen.toString());
  const [showBudgets, setShowBudgets] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  
  // Image modal state
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Identify current logged-in user
  const loggedInSpender = currentUser?.user_metadata?.display_name || 
    (currentUser?.email?.includes('hoang') && !currentUser?.email?.includes('uyenhoang') ? 'Hoàng' : 'Uyên');

  // Create category map for fast lookup
  const catMap = new Map<string, string>();
  categories.forEach(c => catMap.set(c.name.toLowerCase().trim(), c.type));

  const getCatType = (name: string): string => {
    const norm = name.toLowerCase().trim();
    if (catMap.has(norm)) return catMap.get(norm)!;
    if (norm.includes('quỹ') || norm.includes('chung') || norm === 'quỹ sinh hoạt' || norm === 'quỹ ăn nhậu') {
      return 'chung';
    }
    return 'hoang'; // default fallback or let Spender decide
  };

  // Isolate transactions data for the logged-in user
  const isolatedTransactions = transactions.filter((t) => {
    const catType = getCatType(t.category);
    if (catType === 'chung') {
      // Common fund expenses are visible to everyone
      return true;
    }
    if (loggedInSpender === 'Hoàng') {
      // Show Hoàng's personal expenses or other non-Uyên categories spent by Hoàng
      return catType === 'hoang' || (catType !== 'uyen' && t.spender === 'Hoàng');
    } else {
      // Show Uyên's personal expenses or other non-Hoàng categories spent by Uyên
      return catType === 'uyen' || (catType !== 'hoang' && t.spender === 'Uyên');
    }
  });

  // Filter transactions for specific spenders from our isolated set
  const hoangTransactions = isolatedTransactions.filter((t) => t.spender === 'Hoàng');
  const uyenTransactions = isolatedTransactions.filter((t) => t.spender === 'Uyên');

  // Sum spending: ONLY sum transaction_type === 'chi' (or default / non-'thu')
  const hoangSpent = hoangTransactions
    .filter(t => t.transaction_type !== 'thu')
    .reduce((acc, t) => acc + t.amount, 0);
  const uyenSpent = uyenTransactions
    .filter(t => t.transaction_type !== 'thu')
    .reduce((acc, t) => acc + t.amount, 0);

  // Remaining
  const hoangRemaining = budget.hoang - hoangSpent;
  const uyenRemaining = budget.uyen - uyenSpent;

  // Percentage spent
  const hoangPercent = budget.hoang > 0 ? Math.min(Math.round((hoangSpent / budget.hoang) * 100), 100) : 0;
  const uyenPercent = budget.uyen > 0 ? Math.min(Math.round((uyenSpent / budget.uyen) * 100), 100) : 0;

  const handleSaveHoang = () => {
    const val = parseFloat(hoangInput.replace(/,/g, '')) || 0;
    setBudget({ ...budget, hoang: val });
    setIsEditingHoang(false);
  };

  const handleSaveUyen = () => {
    const val = parseFloat(uyenInput.replace(/,/g, '')) || 0;
    setBudget({ ...budget, uyen: val });
    setIsEditingUyen(false);
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleDeleteTransaction = async (id: string | number) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setDeleteConfirmId(null);
      await onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Không thể xóa giao dịch. Hãy thử lại sau!');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header section with refresh and visibility controls */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="font-serif italic text-2xl text-slate-700 flex items-center gap-2">
            Tổng quan chi tiêu
            {loading && <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>}
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Số liệu cập nhật thời gian thực</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBudgets(!showBudgets)}
            className="p-2 rounded-full bg-white border border-stone-100 hover:bg-stone-50 text-stone-600 transition-colors shadow-xs"
            title="Ẩn/Hiện ngân sách"
            id="btn-toggle-visibility"
          >
            {showBudgets ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className={`p-2 rounded-full bg-white border border-stone-100 hover:bg-stone-50 text-stone-600 transition-colors shadow-xs ${
              isRefreshing ? 'animate-spin text-teal-500' : ''
            }`}
            title="Tải lại dữ liệu"
            id="btn-refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of 2 spouses: Only show the logged-in spouse's budget card */}
      <div className="grid grid-cols-1 gap-5">
        {/* Card Hoàng (Chồng) - Mint Pastel Theme */}
        {loggedInSpender === 'Hoàng' && (
          <motion.div
          layout
          className="pastel-mint rounded-3xl p-5 border border-teal-100/30 card-shadow relative overflow-hidden"
          id="card-budget-hoang"
        >
          {/* Subtle background decoration */}
          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-teal-200/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">👨🏻‍💻</span>
              <div>
                <h3 className="font-bold text-teal-950 text-base">Hoàng (Chồng)</h3>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-200/50 text-teal-800">
                  Ngân sách cá nhân
                </span>
              </div>
            </div>
            {!isEditingHoang ? (
              <button
                onClick={() => {
                  setHoangInput(budget.hoang.toString());
                  setIsEditingHoang(true);
                }}
                className="p-1.5 rounded-full hover:bg-teal-200/50 text-teal-700 transition-all"
                title="Sửa ngân sách"
                id="btn-edit-hoang"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Budget Display / Form */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-700/60 tracking-wider block mb-0.5">
                Ngân sách ban đầu
              </span>
              {isEditingHoang ? (
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    value={hoangInput}
                    onChange={(e) => setHoangInput(e.target.value)}
                    className="bg-white px-3 py-1.5 rounded-xl border border-teal-200 text-stone-800 font-semibold text-sm w-full focus:outline-hidden focus:ring-2 focus:ring-teal-400"
                    placeholder="Nhập số tiền..."
                    id="input-budget-hoang"
                  />
                  <button
                    onClick={handleSaveHoang}
                    className="bg-teal-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors"
                    id="btn-save-hoang"
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <div className="text-xl font-extrabold text-teal-950">
                  {showBudgets ? formatVND(budget.hoang) : '••••••••'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white/80 rounded-2xl p-3 border border-stone-100">
                <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-400" /> Đã chi
                </span>
                <span className="text-sm font-bold text-stone-800 block mt-0.5">
                  {formatVND(hoangSpent)}
                </span>
              </div>
              <div className={`rounded-2xl p-3 border ${hoangRemaining >= 0 ? 'bg-teal-50/50 border-teal-100/50 text-teal-800' : 'bg-red-50/50 border-red-100/50 text-red-800'}`}>
                <span className="text-[10px] font-medium flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Còn lại
                </span>
                <span className="text-sm font-extrabold block mt-0.5">
                  {showBudgets ? formatVND(hoangRemaining) : '••••••••'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-semibold text-teal-800/80">
                <span>Mức tiêu thụ</span>
                <span>{hoangPercent}%</span>
              </div>
              <div className="w-full bg-white/50 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hoangPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    hoangPercent > 90
                      ? 'bg-red-400'
                      : hoangPercent > 70
                      ? 'bg-amber-400'
                      : 'bg-teal-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </motion.div>
        )}

        {/* Card Uyên (Vợ) - Pink Pastel Theme */}
        {loggedInSpender === 'Uyên' && (
          <motion.div
          layout
          className="pastel-pink rounded-3xl p-5 border border-pink-100/30 card-shadow relative overflow-hidden"
          id="card-budget-uyen"
        >
          {/* Subtle background decoration */}
          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-pink-200/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">👩🏻‍🎨</span>
              <div>
                <h3 className="font-bold text-pink-950 text-base">Uyên (Vợ)</h3>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-200/50 text-pink-800">
                  Ngân sách cá nhân
                </span>
              </div>
            </div>
            {!isEditingUyen ? (
              <button
                onClick={() => {
                  setUyenInput(budget.uyen.toString());
                  setIsEditingUyen(true);
                }}
                className="p-1.5 rounded-full hover:bg-pink-200/50 text-pink-700 transition-all"
                title="Sửa ngân sách"
                id="btn-edit-uyen"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Budget Display / Form */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-pink-700/60 tracking-wider block mb-0.5">
                Ngân sách ban đầu
              </span>
              {isEditingUyen ? (
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    value={uyenInput}
                    onChange={(e) => setUyenInput(e.target.value)}
                    className="bg-white px-3 py-1.5 rounded-xl border border-pink-200 text-stone-800 font-semibold text-sm w-full focus:outline-hidden focus:ring-2 focus:ring-pink-400"
                    placeholder="Nhập số tiền..."
                    id="input-budget-uyen"
                  />
                  <button
                    onClick={handleSaveUyen}
                    className="bg-pink-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors"
                    id="btn-save-uyen"
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <div className="text-xl font-extrabold text-pink-950">
                  {showBudgets ? formatVND(budget.uyen) : '••••••••'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white/80 rounded-2xl p-3 border border-stone-100">
                <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-400" /> Đã chi
                </span>
                <span className="text-sm font-bold text-stone-800 block mt-0.5">
                  {formatVND(uyenSpent)}
                </span>
              </div>
              <div className={`rounded-2xl p-3 border ${uyenRemaining >= 0 ? 'bg-pink-50/50 border-pink-100/50 text-pink-800' : 'bg-red-50/50 border-red-100/50 text-red-800'}`}>
                <span className="text-[10px] font-medium flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Còn lại
                </span>
                <span className="text-sm font-extrabold block mt-0.5">
                  {showBudgets ? formatVND(uyenRemaining) : '••••••••'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-semibold text-pink-800/80">
                <span>Mức tiêu thụ</span>
                <span>{uyenPercent}%</span>
              </div>
              <div className="w-full bg-white/50 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uyenPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    uyenPercent > 90
                      ? 'bg-red-400'
                      : uyenPercent > 70
                      ? 'bg-amber-400'
                      : 'bg-pink-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </motion.div>
        )}
      </div>

      {/* 5 Recent Transactions */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-stone-800 flex items-center space-x-2">
          <span>⏰</span>
          <span>5 Khoản chi gần nhất</span>
        </h3>

        {loading && isolatedTransactions.length === 0 ? (
          <div className="bg-white/50 border border-stone-100 rounded-3xl p-8 text-center text-stone-500">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-stone-400" />
            <p className="text-xs">Đang tải lịch sử chi tiêu...</p>
          </div>
        ) : isolatedTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-100">
            <span className="text-3xl block mb-2">🎁</span>
            <p className="text-sm text-stone-500 font-semibold">Chưa có giao dịch nào được ghi nhận</p>
            <p className="text-xs text-stone-400 mt-1">Bấm sang tab "Thêm chi tiêu" để ghi chép khoản đầu tiên!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {isolatedTransactions.slice(0, 5).map((item, index) => {
              const isHoang = item.spender === 'Hoàng';
              return (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-4 border border-stone-100 shadow-xs flex items-center justify-between hover:bg-stone-50/50 transition-colors relative group ${
                    item.image_url ? 'cursor-pointer border-teal-100/50 hover:border-teal-150' : ''
                  }`}
                  onClick={() => {
                    if (item.image_url) {
                      setSelectedReceiptUrl(item.image_url);
                      setSelectedTransaction(item);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3.5">
                    {/* Spender Avatar Badge */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-xs shrink-0 ${
                        isHoang ? 'bg-emerald-100/80 text-emerald-700' : 'bg-pink-100/80 text-pink-700'
                      }`}
                    >
                      {isHoang ? 'H' : 'U'}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-stone-800 text-sm">{item.notes || 'Chi tiêu không tên'}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                            item.category === 'Quỹ sinh hoạt'
                              ? 'bg-purple-100 text-purple-700'
                              : item.category === 'Quỹ ăn nhậu'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {item.category}
                        </span>
                        {item.image_url && (
                          <span
                            title="Đính kèm hóa đơn (Click để xem)"
                            className={`p-1 rounded-md flex items-center justify-center ${
                              isHoang ? 'bg-teal-50 text-teal-600' : 'bg-pink-50 text-pink-600'
                            }`}
                          >
                            <Paperclip className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : 'Vừa xong'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`font-bold text-sm ${item.transaction_type === 'thu' ? 'text-emerald-600 font-extrabold' : 'text-stone-800'}`}>
                      {item.transaction_type === 'thu' ? '+' : '-'}{formatVND(item.amount)}
                    </span>

                    {/* Delete button (displays a tiny confirmation or delete trigger) */}
                    {item.id && (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {deleteConfirmId === item.id ? (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-red-500 text-white flex items-center space-x-1 p-1 rounded-lg text-[9px] font-bold z-10 shadow-md">
                            <button
                              onClick={() => handleDeleteTransaction(item.id!)}
                              className="px-1.5 py-0.5 hover:bg-red-600 rounded"
                            >
                              Xóa
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1 py-0.5 bg-stone-700/50 hover:bg-stone-700 rounded"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item.id!)}
                            className="p-1 rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Xóa khoản chi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {selectedReceiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedReceiptUrl(null);
              setSelectedTransaction(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-[32px] overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#FDFCF0]">
                <div>
                  <h4 className="font-serif italic text-lg text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-teal-500" /> Ảnh hóa đơn
                  </h4>
                  <p className="text-[10px] text-slate-400 tracking-widest font-semibold mt-0.5 uppercase">
                    Khoản chi của <span className="normal-case">{selectedTransaction?.spender}</span> • <span className="normal-case font-bold text-slate-500">{selectedTransaction?.category}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReceiptUrl(null);
                    setSelectedTransaction(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 flex items-center justify-center max-h-[350px] overflow-y-auto">
                <img
                  src={selectedReceiptUrl}
                  alt="Receipt"
                  className="max-h-[300px] w-auto object-contain rounded-xl shadow-xs"
                />
              </div>

              <div className="p-5 bg-white space-y-2 border-t border-slate-100">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-bold text-slate-800 text-sm">{selectedTransaction?.notes}</span>
                  <span className="font-extrabold text-red-600 text-sm shrink-0">
                    -{selectedTransaction ? formatVND(selectedTransaction.amount) : ''}
                  </span>
                </div>
                {selectedTransaction?.created_at && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    Giao dịch ngày: {new Date(selectedTransaction.created_at).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

