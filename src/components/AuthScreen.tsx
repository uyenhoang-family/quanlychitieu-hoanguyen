import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Heart, Mail, Lock, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [spenderName, setSpenderName] = useState<'Hoàng' | 'Uyên'>('Hoàng');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Log in
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw loginError;
        }

        onAuthSuccess();
      } else {
        // Register (Sign up)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: spenderName,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        // If the user needs to confirm email, show message, otherwise log them in
        const session = data?.session;
        if (!session) {
          setSuccessMsg('Đăng ký thành công! Hãy kiểm tra hòm thư của bạn để xác nhận email (nếu có yêu cầu).');
          setIsLogin(true);
        } else {
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Translate common error messages to Vietnamese
      let message = err.message || 'Đã xảy ra lỗi không mong muốn.';
      if (message.includes('Invalid login credentials')) {
        message = 'Email hoặc mật khẩu không chính xác.';
      } else if (message.includes('Email already in use') || message.includes('User already exists')) {
        message = 'Email này đã được sử dụng bởi tài khoản khác.';
      } else if (message.includes('Password should be at least')) {
        message = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
      } else if (message.includes('signup is disabled')) {
        message = 'Đăng ký hiện đang bị tắt bởi quản trị viên.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3E6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#FDFCF0] rounded-[36px] border border-slate-150/40 p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-full bg-pink-100 items-center justify-center shadow-xs mx-auto">
            <Heart className="w-7 h-7 text-pink-400 fill-pink-300 animate-pulse" />
          </div>
          <h1 className="font-serif italic text-3xl text-slate-700 leading-none">Gia đình Hoàng Uyên</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Tổ ấm & Quản lý chi tiêu</p>
        </div>

        {/* Switch tabs */}
        <div className="flex bg-[#F8F9FA] rounded-2xl p-1">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
              isLogin
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
              !isLogin
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Tạo tài khoản
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 text-xs flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-teal-50 border border-teal-100 text-teal-800 rounded-2xl p-4 text-xs flex items-start space-x-2"
          >
            <Sparkles className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
            <span className="font-medium">{successMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Spender selector during registration */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Bạn là ai?
              </label>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setSpenderName('Hoàng')}
                  className={`py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                    spenderName === 'Hoàng'
                      ? 'pastel-mint border-teal-300 text-teal-800 ring-2 ring-teal-100'
                      : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">👨🏻‍💻</span>
                  <span className="text-xs">Hoàng (Chồng)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSpenderName('Uyên')}
                  className={`py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                    spenderName === 'Uyên'
                      ? 'pastel-pink border-pink-300 text-pink-800 ring-2 ring-pink-100'
                      : 'bg-[#F8F9FA] border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">👩🏻‍🎨</span>
                  <span className="text-xs">Uyên (Vợ)</span>
                </button>
              </div>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vd: uyenhoang19851986@gmail.com"
                className="w-full bg-[#F8F9FA] border-none rounded-2xl pl-11 pr-4 py-3.5 text-slate-700 font-semibold text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200 transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-[#F8F9FA] border-none rounded-2xl pl-11 pr-4 py-3.5 text-slate-700 font-semibold text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-teal-200 transition-all"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-teal-500 text-white font-bold text-sm shadow-lg hover:bg-teal-600 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isLogin ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản gia đình'}</span>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 mt-2">
          <span>Hệ thống bảo mật bởi Supabase Authentication</span>
        </div>
      </motion.div>
    </div>
  );
}
