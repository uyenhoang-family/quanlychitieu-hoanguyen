import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { addTransaction, getCategories, uploadReceiptImage } from '../supabase';
import { Sparkles, Check, HelpCircle, AlertCircle, PlusCircle, Camera, X, Loader2, Image, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddTransactionTabProps {
  categories: Category[];
  onSuccess: () => Promise<void>;
  setActiveTab: (tab: 'overview' | 'add' | 'funds' | 'settings') => void;
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

export default function AddTransactionTab({ categories, onSuccess, setActiveTab, currentUser }: AddTransactionTabProps) {
  const [spender, setSpender] = useState<'Hoàng' | 'Uyên'>('Hoàng');
  const [category, setCategory] = useState<string>('Quỹ sinh hoạt');
  
  const [amountStr, setAmountStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Image states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Identify current logged-in user to default spender
  useEffect(() => {
    if (currentUser) {
      const displayName = currentUser?.user_metadata?.display_name || 
        (currentUser?.email?.includes('hoang') && !currentUser?.email?.includes('uyenhoang') ? 'Hoàng' : 'Uyên');
      setSpender(displayName);
    }
  }, [currentUser]);

  // Set default category when component loads or categories change
  useEffect(() => {
    const currentSpenderName = currentUser?.user_metadata?.display_name || 
      (currentUser?.email?.includes('hoang') && !currentUser?.email?.includes('uyenhoang') ? 'Hoàng' : 'Uyên');
    const allowed = categories.filter(c => c.type === 'chung' || c.type === (currentSpenderName === 'Hoàng' ? 'hoang' : 'uyen'));
    if (allowed.length > 0 && !allowed.some(c => c.name === category)) {
      setCategory(allowed[0].name);
    }
  }, [categories, currentUser]);

  // Update category selection if current choice becomes invalid on Spender change
  useEffect(() => {
    const allowed = categories.filter(cat => 
      cat.type === 'chung' || cat.type === (spender === 'Hoàng' ? 'hoang' : 'uyen')
    );
    if (allowed.length > 0 && !allowed.some(c => c.name === category)) {
      setCategory(allowed[0].name);
    }
  }, [spender, categories]);

  // Filter categories to only allow general + personal categories for current logged-in user
  const loggedInName = currentUser?.user_metadata?.display_name || 
    (currentUser?.email?.includes('hoang') && !currentUser?.email?.includes('uyenhoang') ? 'Hoàng' : 'Uyên');
  
  const allowedCategories = categories.filter(cat => 
    cat.type === 'chung' || cat.type === (loggedInName === 'Hoàng' ? 'hoang' : 'uyen')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanNum = amountStr.replace(/[^0-9]/g, '');
    const parsedAmount = parseInt(cleanNum, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền hợp lý lớn hơn 0!');
      return;
    }

    if (!notes.trim()) {
      setErrorMsg('Vui lòng nhập ghi chú chi tiết để lưu lại!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setUploadStatus(null);

    try {
      let imageUrl = '';
      
      // Upload file if selected
      if (receiptFile) {
        setUploadStatus('Đang tải ảnh hóa đơn lên hệ thống...');
        imageUrl = await uploadReceiptImage(receiptFile);
      }

      setUploadStatus('Đang lưu thông tin giao dịch...');
      await addTransaction({
        spender,
        category,
        amount: parsedAmount,
        notes: notes.trim(),
        image_url: imageUrl || undefined,
        transaction_type: 'chi'
      });

      setSuccess(true);
      setAmountStr('');
      setNotes('');
      setReceiptFile(null);
      setImagePreviewUrl(null);
      
      // Refresh the root transactions list
      await onSuccess();

      // Clear success alert after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3500);

    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMsg(err.message || 'Lỗi lưu dữ liệu lên Supabase. Vui lòng kiểm tra lại!');
    } finally {
      setSubmitting(false);
      setUploadStatus(null);
    }
  };

  const handlePresetSelect = (val: number) => {
    const cleanNum = amountStr.replace(/[^0-9]/g, '');
    const currentVal = parseFloat(cleanNum) || 0;
    const newVal = currentVal + val;
    setAmountStr(newVal.toLocaleString('vi-VN') + ' đ');
  };

  const handleAmountChange = (val: string) => {
    // Keep only digits and k/K characters
    const clean = val.replace(/[^0-9kK]/g, '');
    if (!clean) {
      setAmountStr('');
      return;
    }

    if (clean.toLowerCase().endsWith('k')) {
      const numericPart = clean.slice(0, -1);
      if (numericPart) {
        const num = parseFloat(numericPart) * 1000;
        setAmountStr(num.toLocaleString('vi-VN') + ' đ');
      }
    } else {
      const num = parseFloat(clean);
      setAmountStr(num.toLocaleString('vi-VN') + ' đ');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title Header */}
      <div className="px-1">
        <h2 className="font-serif italic text-2xl text-slate-700">Nhập chi tiêu mới</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Ghi chép nhanh chóng, lưu trữ lâu dài</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center space-x-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-teal-600 stroke-[3]" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-teal-850 text-sm">✓ Đã lưu thành công!</h4>
              <p className="text-xs text-teal-600 font-medium">
                Khoản chi của <span className="font-semibold">{spender}</span> đã được đồng bộ lên Supabase.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-teal-700 hover:underline px-2.5 py-1.5 bg-teal-100/50 rounded-xl"
            >
              Xem ngay
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3 text-red-700 text-xs font-medium shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="flex-1">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm space-y-5">
        
        {/* 1. Spender Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
            Người chi
          </label>
          <div className="grid grid-cols-2 gap-3.5">
            {/* Hoàng */}
            <button
              type="button"
              onClick={() => setSpender('Hoàng')}
              className={`py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                spender === 'Hoàng'
                  ? 'pastel-mint border-teal-300 text-teal-800 ring-2 ring-teal-100'
                  : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">👨🏻‍💻</span>
              <span className="text-sm">Hoàng (Chồng)</span>
            </button>

            {/* Uyên */}
            <button
              type="button"
              onClick={() => setSpender('Uyên')}
              className={`py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                spender === 'Uyên'
                  ? 'pastel-pink border-pink-300 text-pink-800 ring-2 ring-pink-100'
                  : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">👩🏻‍🎨</span>
              <span className="text-sm">Uyên (Vợ)</span>
            </button>
          </div>
        </div>

        {/* 2. Category Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
            Hạng mục chi
          </label>
          {allowedCategories.length === 0 ? (
            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              Chưa có danh mục phù hợp. Vui lòng thêm trong Cài đặt!
            </div>
          ) : (
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F8F9FA] border-none rounded-2xl px-4 py-4 pr-10 text-slate-700 font-bold text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200 transition-all appearance-none cursor-pointer"
                id="select-transaction-category"
              >
                {allowedCategories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>

        {/* 3. Amount Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
            Số tiền (đ)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-[#F8F9FA] border-none rounded-2xl px-4 py-4 pr-14 text-slate-700 font-bold text-xl focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200 transition-all"
              placeholder="0"
              required
              id="input-transaction-amount"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              đ
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetSelect(p.value)}
                className="py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200/70 text-slate-600 font-bold text-[10px] transition-colors cursor-pointer"
              >
                +{p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Notes Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
            Ghi chú chi tiết
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#F8F9FA] border-none rounded-2xl px-4 py-3.5 text-slate-700 font-semibold text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200 transition-all"
            placeholder="Ví dụ: Mua tã sữa, Đi chợ tối, Cafe họp mặt..."
            required
            id="input-transaction-notes"
          />
        </div>

        {/* 5. Image upload section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
            Ảnh hóa đơn (Không bắt buộc)
          </label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-teal-300 rounded-2xl p-4 bg-[#F8F9FA] transition-all relative overflow-hidden">
            {imagePreviewUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                <img src={imagePreviewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setImagePreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer">
                <Camera className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-500">Chụp hoặc tải ảnh hóa đơn lên</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Chỉ nhận file ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      setReceiptFile(file);
                      setImagePreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 ${
            submitting
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-teal-500 hover:bg-teal-600 shadow-teal-100/50 active:scale-98 cursor-pointer'
          }`}
          id="btn-submit-transaction"
        >
          {submitting ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{uploadStatus || 'Đang xử lý...'}</span>
            </div>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Lưu giao dịch</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
}
