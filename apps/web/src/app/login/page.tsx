'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { me, loading, refresh, setMe } = useAuth();
  const [email, setEmail] = useState('admin@cakrawala.ac.id');
  const [password, setPassword] = useState('Demo123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [oidcNotice, setOidcNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!loading && me) router.replace('/dashboard');
  }, [loading, me, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/login', { email, password });
      await refresh();
      const user = await api.get<any>('/users/me');
      setMe(user);
      router.replace(user.mustChangePassword ? '/settings/security' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post('/auth/request-password-reset', { email: forgotEmail });
      setForgotSuccess('Permintaan reset kata sandi telah dikirim. Hubungi Super Admin atau periksa email institusi Anda.');
    } catch {
      setForgotSuccess('Permintaan reset kata sandi telah dicatat. Hubungi administrator institusi.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white p-2.5 sm:p-3 lg:p-4">
      {/* Left Column: Hero banner matching RISE/TRACK exact 43% width & full height */}
      <div className="relative hidden h-full w-[44%] xl:w-[42%] lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-[24px] xl:rounded-[32px] shadow-sm">
          <img
            src="/login-hero.png"
            alt="Cakrawala University Students"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      </div>

      {/* Right Column: Spacious 56% width, vertically centered matching RISE scale */}
      <div className="flex h-full w-full flex-1 flex-col justify-center overflow-y-auto px-4 py-4 sm:px-8 lg:w-[56%] xl:w-[58%] lg:px-12 xl:px-16">
        <div className="mx-auto flex w-full max-w-[460px] xl:max-w-[480px] flex-col items-center">
          
          {/* Brand Shield Emblem - directly on canvas like RISE (no card container) */}
          <div className="mb-4 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="SYNC Cakrawala Logo"
              className="h-16 w-auto object-contain sm:h-20 drop-shadow-sm"
            />
          </div>

          {/* Title & Subtitle matching RISE typography scale */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2540]">
            SYNC Cakrawala
          </h1>
          <p className="mt-1.5 text-center text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
            Synchronized Network &amp; Coordination (SYNC)
            <br />
            Platform
          </p>

          {/* Google OIDC Button - Full Width, High-Comfort */}
          <div className="mt-6 w-full">
            <button
              type="button"
              onClick={() => setOidcNotice('This feature is in development')}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#EBF3F8] px-4 py-3.5 text-sm sm:text-base font-semibold text-[#0A2540] shadow-sm transition hover:bg-[#e1edf5] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-teal/40"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk Dengan Email Google Cakrawala</span>
            </button>

            {/* Red Notification Below Button */}
            {oidcNotice && (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-600 transition-all">
                <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>This feature is in development</span>
              </div>
            )}
          </div>

          {/* Divider "Atau" */}
          <div className="relative my-5 w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 font-medium text-slate-400">Atau</span>
            </div>
          </div>

          {/* Local Credentials Form - Large, Spacious Inputs matching RISE */}
          <form onSubmit={onSubmit} className="w-full space-y-4 sm:space-y-5">
            <div>
              <label className="mb-2 block text-xs sm:text-sm font-semibold text-[#0A2540]">
                Email/NIM
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="muhammadsand.prayudha@cakrawala.ac.id"
                required
                className="w-full rounded-xl bg-[#E8F0FE] px-4 py-3 sm:py-3.5 text-sm sm:text-base text-[#0A2540] outline-none transition focus:ring-2 focus:ring-[#087EA4]/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs sm:text-sm font-semibold text-[#0A2540]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl bg-[#E8F0FE] px-4 py-3 sm:py-3.5 pr-12 text-sm sm:text-base text-[#0A2540] outline-none transition focus:ring-2 focus:ring-[#087EA4]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Options Row: Ingat Saya & Lupa Password */}
            <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
              <label className="flex cursor-pointer select-none items-center gap-2 font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#087EA4] focus:ring-[#087EA4]"
                />
                <span>Ingat Saya</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSuccess('');
                  setShowForgotModal(true);
                }}
                className="font-semibold text-[#087EA4] hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                {error}
              </div>
            ) : null}

            {/* Orange CTA Button (#F6901E) - Generous Height & Font matching RISE */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#F6901E] py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-sm transition hover:bg-[#e07f15] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          {/* Evaluator Demo Credentials */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-400">
              Demo Evaluator:{' '}
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@cakrawala.ac.id');
                  setPassword('Demo123!');
                }}
                className="font-semibold text-slate-600 hover:text-teal"
              >
                admin@cakrawala.ac.id
              </button>{' '}
              /{' '}
              <span className="font-semibold text-slate-600">Demo123!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-navy">Lupa Kata Sandi?</h3>
            <p className="mt-1 text-xs text-navy/60">
              Masukkan email institusi Cakrawala (@cakrawala.ac.id) Anda untuk meminta instruksi reset kata sandi kepada administrator sistem.
            </p>

            {forgotSuccess ? (
              <div className="mt-4 rounded-lg bg-teal/10 p-3 text-xs text-teal font-medium">
                {forgotSuccess}
              </div>
            ) : (
              <form onSubmit={onForgotSubmit} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@cakrawala.ac.id"
                  required
                  className="w-full rounded-lg bg-[#E8F0FE] px-3 py-2 text-sm text-[#0A2540] outline-none focus:ring-2 focus:ring-teal/40"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-navy/70 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Mengirim…' : 'Kirim Permintaan'}
                  </button>
                </div>
              </form>
            )}

            {forgotSuccess ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-lg bg-navy px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Tutup
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
