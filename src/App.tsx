import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import OverviewTab from './components/OverviewTab';
import AddTransactionTab from './components/AddTransactionTab';
import CommonFundsTab from './components/CommonFundsTab';
import SettingsTab from './components/SettingsTab';
import AuthScreen from './components/AuthScreen';
import { Transaction, Budget, Category } from './types';
import { getTransactions, getCategories, supabase } from './supabase';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Info, RefreshCw, Sparkles, Heart, Loader2 } from 'lucide-react';

const BUDGET_LOCAL_KEY = 'hoang_uyen_family_budgets_v1';
const DEFAULT_BUDGET: Budget = {
  hoang: 10000000, // Default 10M VND
  uyen: 10000000,  // Default 10M VND
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'funds' | 'settings'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<Budget>(DEFAULT_BUDGET);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load Budgets from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BUDGET_LOCAL_KEY);
      if (saved) {
        setBudget(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading budgets from localStorage:', e);
    }
  }, []);

  // Save Budget changes to LocalStorage
  const handleSetBudget = (newBudget: Budget) => {
    setBudget(newBudget);
    try {
      localStorage.setItem(BUDGET_LOCAL_KEY, JSON.stringify(newBudget));
    } catch (e) {
      console.error('Error saving budgets to localStorage:', e);
    }
  };

  // Fetch transactions and categories from Supabase
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txs, cats] = await Promise.all([getTransactions(), getCategories()]);
      setTransactions(txs);
      setCategories(cats);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(
        err.message || 'Không thể lấy dữ liệu từ Supabase. Vui lòng kiểm tra lại kết nối mạng hoặc cấu hình bảng!'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F3E6] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen onAuthSuccess={() => {}} />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3E6] flex items-center justify-center p-0 sm:p-4">
      {/* Phone emulator container for absolute desktop polish, full screen on mobile */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:max-h-[900px] bg-[#FDFCF0] sm:rounded-[36px] sm:shadow-2xl overflow-y-auto flex flex-col relative border border-slate-150/40 pb-12">
        
        {/* Top Header */}
        <Header />

        {/* Content Body */}
        <main className="flex-1 px-6 py-5 overflow-y-auto">
          {error && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 text-amber-800 text-xs shadow-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sự cố kết nối Supabase</span>
              </div>
              <p className="font-medium text-stone-600">
                {error}
              </p>
              <div className="pt-1.5 border-t border-amber-200/50 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">
                  Tip: Hãy kiểm tra xem bảng `transactions` đã được tạo trên Supabase chưa.
                </span>
                <button
                  onClick={fetchTransactions}
                  className="px-2.5 py-1 bg-amber-200/50 hover:bg-amber-200 text-amber-800 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Thử lại
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  transactions={transactions}
                  categories={categories}
                  budget={budget}
                  setBudget={handleSetBudget}
                  loading={loading}
                  onRefresh={fetchTransactions}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'add' && (
                <AddTransactionTab
                  categories={categories}
                  onSuccess={fetchTransactions}
                  setActiveTab={setActiveTab}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'funds' && (
                <CommonFundsTab
                  transactions={transactions}
                  categories={categories}
                  loading={loading}
                  onRefresh={fetchTransactions}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  currentUser={currentUser}
                  categories={categories}
                  onRefresh={fetchTransactions}
                  onLogout={() => {
                    setCurrentUser(null);
                    setActiveTab('overview');
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating background decorative banner on the phone mock */}
        <div className="text-center py-2 text-[10px] text-stone-400 font-semibold select-none border-t border-stone-100 bg-white/50 backdrop-blur-xs flex items-center justify-center gap-1">
          <span>Gia đình hạnh phúc</span>
          <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-300" />
          <span>Hoàng & Uyên © 2026</span>
        </div>

        {/* Bottom Tab Navigation Bar */}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
