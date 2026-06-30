import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { addTransaction, updateTransactionAmount } from '../supabase';
import { Sparkles, PiggyBank, RefreshCw, PlusCircle, Coins, ArrowUpRight, TrendingUp, Landmark, AlertTriangle, ArrowRight, Loader2, Check, Edit2, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommonFundsTabProps {
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  currentUser: any;
}

const PRESETS = [
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1M', value: 1000000 },
  { label: '2M', value: 2000000 },
];

export default function CommonFundsTab({ transactions, categories, loading, onRefresh, currentUser }: CommonFundsTabProps) {
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositFund, setDepositFund] = useState('');
  const [depositAmountStr, setDepositAmountStr] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [editingDepositId, setEditingDepositId] = useState<string | number | null>(null);
  const [editingDepositAmountStr, setEditingDepositAmountStr] = useState('');
  const [savingDepositId, setSavingDepositId] = useState<string | number | null>(null);

  // Identify logged in spouse
  const loggedInSpender = currentUser?.user_metadata?.display_name || 
    (currentUser?.email?.includes('hoang') && !currentUser?.email?.includes('uyenhoang') ? 'Hoàng' : 'Uyên');

  // Filter categories to get all Common Funds (type === 'chung')
  const sharedFunds = categories.filter(c => c.type === 'chung');
  
  // Set default selected fund in form
  useEffect(() => {
    if (sharedFunds.length > 0 && !depositFund) {
      setDepositFund(sharedFunds[0].name);
    }
  }, [sharedFunds, depositFund]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getPercentage = (part: number, total: number) => {
    if (total === 0) return 50; // default split visual
    return Math.round((part / total) * 100);
  };

  const parseMoneyInput = (value: string) => {
    const cleanNum = value.replace(/[^0-9]/g, '');
    return cleanNum ? parseInt(cleanNum, 10) : 0;
  };

  // Process stats for all common funds
  const fundsStats = sharedFunds.map(fund => {
    const fundTransactions = transactions.filter(t => t.category.toLowerCase().trim() === fund.name.toLowerCase().trim());
    
    // Total deposits (Nạp tiền vào quỹ)
    const totalDeposited = fundTransactions
      .filter(t => t.transaction_type === 'thu')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total spent (Chi tiêu từ quỹ)
    const totalSpent = fundTransactions
      .filter(t => t.transaction_type !== 'thu')
      .reduce((sum, t) => sum + t.amount, 0);

    // Current Balance (Số dư = Nạp - Chi)
    const balance = totalDeposited - totalSpent;

    // Contributions by spouses (Deposits)
    const hoangDeposited = fundTransactions
      .filter(t => t.transaction_type === 'thu' && t.spender === 'Hoàng')
      .reduce((sum, t) => sum + t.amount, 0);

    const uyenDeposited = fundTransactions
      .filter(t => t.transaction_type === 'thu' && t.spender === 'Uyên')
      .reduce((sum, t) => sum + t.amount, 0);

    // Cash remaining percentage (Health check)
    const healthPercent = totalDeposited > 0 ? Math.max(0, Math.min(100, Math.round((balance / totalDeposited) * 100))) : 0;

    return {
      category: fund,
      totalDeposited,
      totalSpent,
      balance,
      hoangDeposited,
      uyenDeposited,
      healthPercent,
      transactions: fundTransactions
    };
  });

  // History of common transactions (both deposits and expenses)
  const jointTransactions = transactions.filter(t => {
    const isSharedCategory = sharedFunds.some(f => f.name.toLowerCase().trim() === t.category.toLowerCase().trim());
    return isSharedCategory;
  });

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseMoneyInput(depositAmountStr);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Vui lòng nhập số tiền nạp hợp lý!');
      return;
    }

    if (!depositNotes.trim()) {
      setDepositError('Vui lòng điền ghi chú đóng đóng góp (ví dụ: Đóng tiền ăn tháng 6)');
      return;
    }

    setSubmittingDeposit(true);
    setDepositError(null);

    try {
      await addTransaction({
        spender: loggedInSpender,
        category: depositFund,
        amount,
        notes: depositNotes.trim(),
        transaction_type: 'thu'
      });

      setDepositSuccess(true);
      setDepositAmountStr('');
      setDepositNotes('');
      await onRefresh();
      setTimeout(() => {
        setDepositSuccess(false);
        setShowDepositForm(false);
      }, 2000);
    } catch (err: any) {
      console.error('Deposit error:', err);
      setDepositError('Lỗi nạp tiền vào quỹ. Hãy thử lại sau!');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handlePresetSelect = (val: number) => {
    const currentVal = parseMoneyInput(depositAmountStr);
    const newVal = currentVal + val;
    setDepositAmountStr(newVal.toLocaleString('vi-VN'));
  };

  const handleAmountChange = (val: string) => {
    const amount = parseMoneyInput(val);
    if (!amount) {
      setDepositAmountStr('');
      return;
    }
    setDepositAmountStr(amount.toLocaleString('vi-VN'));
  };

  const handleStartEditDeposit = (item: Transaction) => {
    if (!item.id) return;
    setEditingDepositId(item.id);
    setEditingDepositAmountStr(item.amount.toLocaleString('vi-VN'));
  };

  const handleEditDepositAmountChange = (val: string) => {
    const amount = parseMoneyInput(val);
    if (!amount) {
      setEditingDepositAmountStr('');
      return;
    }
    setEditingDepositAmountStr(amount.toLocaleString('vi-VN'));
  };

  const handleCancelEditDeposit = () => {
    setEditingDepositId(null);
    setEditingDepositAmountStr('');
  };

  const handleSaveDepositAmount = async (id: string | number) => {
    const amount = parseMoneyInput(editingDepositAmountStr);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền nạp hợp lý!');
      return;
    }

    setSavingDepositId(id);
    try {
      await updateTransactionAmount(id, amount);
      handleCancelEditDeposit();
      await onRefresh();
    } catch (err) {
      console.error('Deposit amount update error:', err);
      alert('Không thể sửa số tiền nạp. Vui lòng thử lại!');
    } finally {
      setSavingDepositId(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Title Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="font-serif italic text-2xl text-slate-700">Quỹ chung Gia đình</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Các khoản đóng góp nạp quỹ & chi trả chung</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`p-2 rounded-full bg-white border border-stone-100 hover:bg-stone-50 text-stone-600 transition-colors shadow-xs ${
            loading ? 'animate-spin text-teal-500' : ''
          }`}
          id="btn-refresh-funds"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Button & Collapsible Deposit Form */}
      <div className="space-y-3">
        <button
          onClick={() => setShowDepositForm(!showDepositForm)}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Coins className="w-4.5 h-4.5 animate-bounce" />
            Nạp tiền vào Quỹ chung (Đóng góp)
          </span>
          <PlusCircle className={`w-4.5 h-4.5 transition-transform duration-300 ${showDepositForm ? 'rotate-45' : ''}`} />
        </button>

        <AnimatePresence>
          {showDepositForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-5 border border-stone-100 shadow-lg overflow-hidden"
            >
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Người nạp</label>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
                      {loggedInSpender}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chọn Quỹ</label>
                    {sharedFunds.length === 0 ? (
                      <div className="text-xs text-red-500 font-bold py-2">Hãy tạo Quỹ chung ở mục Cài đặt</div>
                    ) : (
                      <select
                        value={depositFund}
                        onChange={(e) => setDepositFund(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-400"
                      >
                        {sharedFunds.map(f => (
                          <option key={f.id} value={f.name}>{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Số tiền nạp (VND)</label>
                  <input
                    type="text"
                    required
                    value={depositAmountStr}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="w-full bg-[#F8F9FA] border-none rounded-xl px-4 py-2.5 text-slate-800 font-extrabold text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200"
                  />

                  {/* Preset amounts */}
                  <div className="grid grid-cols-6 gap-1.5 mt-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetSelect(preset.value)}
                        className="py-1 bg-stone-50 hover:bg-stone-100 border border-stone-150/40 text-[9px] font-bold text-stone-600 rounded-lg active:scale-95 transition-all"
                      >
                        +{preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ghi chú đóng góp</label>
                  <input
                    type="text"
                    required
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    placeholder="Ví dụ: Hoàng đóng tiền sinh hoạt tháng 6..."
                    className="w-full bg-[#F8F9FA] border-none rounded-xl px-4 py-2.5 text-slate-700 font-semibold text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200"
                  />
                </div>

                <AnimatePresence>
                  {depositSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center space-x-2 text-emerald-800 text-xs font-bold"
                    >
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>Đã nạp tiền thành công!</span>
                    </motion.div>
                  )}

                  {depositError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-800 text-xs font-semibold"
                    >
                      {depositError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submittingDeposit || sharedFunds.length === 0}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5"
                >
                  {submittingDeposit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Coins className="w-3.5 h-3.5" />
                  )}
                  <span>Xác nhận đóng góp</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid of Joint Funds Cards */}
      <div className="grid grid-cols-1 gap-5">
        {fundsStats.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-100">
            <span className="text-3xl block mb-2">🏘️</span>
            <p className="text-sm text-stone-500 font-semibold">Chưa có quỹ chung nào</p>
            <p className="text-xs text-stone-400 mt-1">Vui lòng sang tab "Cài đặt" để tạo một danh mục với phạm vi là "Chung"!</p>
          </div>
        ) : (
          fundsStats.map((fund, index) => {
            const hasOverdraft = fund.balance < 0;
            return (
              <motion.div
                key={fund.category.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/95 p-5 rounded-[32px] card-shadow border-l-8 relative overflow-hidden transition-all hover:scale-[1.01] ${
                  index % 2 === 0 ? 'border-indigo-300' : 'border-amber-300'
                }`}
              >
                {/* Visual decoration */}
                <div className={`absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full blur-xl pointer-events-none ${
                  index % 2 === 0 ? 'bg-indigo-100/30' : 'bg-amber-100/30'
                }`} />

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${
                      index % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {index % 2 === 0 ? '🏡' : '🍻'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700 text-sm">{fund.category.name}</h3>
                      <span className="text-[9px] text-slate-400 font-medium block">Số dư quỹ hoạt động gia đình</span>
                    </div>
                  </div>
                  
                  {/* Fund Balance (Số dư quỹ) */}
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Số dư quỹ</span>
                    <span className={`font-extrabold text-base block ${hasOverdraft ? 'text-red-500 font-black animate-pulse' : 'text-slate-800'}`}>
                      {formatVND(fund.balance)}
                    </span>
                  </div>
                </div>

                {/* Sub statistics: Deposited & Spent */}
                <div className="grid grid-cols-2 gap-3 mb-4 mt-2">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/40">
                    <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5">
                      <Landmark className="w-2.5 h-2.5" /> Tổng nạp
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800 mt-0.5 block">{formatVND(fund.totalDeposited)}</span>
                  </div>

                  <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/40">
                    <span className="text-[9px] text-rose-700 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> Tổng chi
                    </span>
                    <span className="text-xs font-extrabold text-rose-800 mt-0.5 block">{formatVND(fund.totalSpent)}</span>
                  </div>
                </div>

                {/* Progress bar representing Fund Health (Balance percentage over total deposited) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      💰 Quỹ khả dụng (Số dư / Nạp)
                    </span>
                    <span>{fund.healthPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fund.healthPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        fund.healthPercent < 20
                          ? 'bg-red-500'
                          : fund.healthPercent < 50
                          ? 'bg-amber-400'
                          : 'bg-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Contribution details breakdown */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    👨🏻‍💻 Hoàng nạp: <strong className="text-slate-600">{formatVND(fund.hoangDeposited)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    👩🏻‍🎨 Uyên nạp: <strong className="text-slate-600">{formatVND(fund.uyenDeposited)}</strong>
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* History of Common Expenses & Deposits */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-stone-800 flex items-center space-x-2">
          <span>📝</span>
          <span>Lịch sử giao dịch Quỹ chung</span>
        </h3>

        {jointTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-100">
            <span className="text-2xl block mb-1">🏡</span>
            <p className="text-sm text-stone-500 font-semibold">Chưa có giao dịch quỹ chung nào</p>
            <p className="text-xs text-stone-400 mt-1">Các khoản nạp hoặc chi từ Quỹ chung sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jointTransactions.slice(0, 15).map((item, idx) => {
              const isHoang = item.spender === 'Hoàng';
              const isDeposit = item.transaction_type === 'thu';
              return (
                <div
                  key={item.id || idx}
                  className="bg-white rounded-2xl p-3.5 border border-stone-100 shadow-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isHoang ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'
                      }`}
                    >
                      {isHoang ? 'H' : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                        <span className="font-bold text-stone-800 text-xs truncate max-w-[150px]">{item.notes}</span>
                        <span
                          className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            isDeposit
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          {isDeposit ? 'NẠP' : 'CHI'}
                        </span>
                        <span className="text-[8px] bg-stone-100 px-1.5 py-0.5 rounded-full text-stone-500 font-bold">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-[9px] text-stone-400 block mt-0.5">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('vi-VN', {
                              day: 'numeric',
                              month: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Vừa xong'}
                      </span>
                    </div>
                  </div>
                  {editingDepositId === item.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="text"
                        value={editingDepositAmountStr}
                        onChange={(e) => handleEditDepositAmountChange(e.target.value)}
                        className="w-24 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 text-right text-xs font-extrabold text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-200"
                        inputMode="numeric"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => item.id && handleSaveDepositAmount(item.id)}
                        disabled={savingDepositId === item.id}
                        className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-60"
                        title="Lưu số tiền nạp"
                      >
                        {savingDepositId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditDeposit}
                        className="p-1.5 rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`font-bold text-xs ${isDeposit ? 'text-emerald-600' : 'text-stone-800'}`}>
                        {isDeposit ? '+' : '-'}{formatVND(item.amount)}
                      </span>
                      {isDeposit && item.id && (
                        <button
                          type="button"
                          onClick={() => handleStartEditDeposit(item)}
                          className="p-1.5 rounded-full text-stone-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Sửa số tiền nạp"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
