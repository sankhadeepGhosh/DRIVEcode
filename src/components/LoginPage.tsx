import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onBypassAsGuest?: () => void;
}

type ActiveTab = 'signin' | 'signup' | 'reset';

export const LoginPage: React.FC<LoginPageProps> = ({ onBypassAsGuest }) => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('signin');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInShowPassword, setSignInShowPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up state
  const [signUpDisplayName, setSignUpDisplayName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpShowPassword, setSignUpShowPassword] = useState(false);
  const [signUpShowConfirm, setSignUpShowConfirm] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpNeedsConfirmation, setSignUpNeedsConfirmation] = useState(false);

  // Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Clear all errors and success flags
    setSignInError(null);
    setSignUpError(null);
    setSignUpNeedsConfirmation(false);
    setResetError(null);
    setResetSuccess(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    setSignInLoading(false);
    if (error) {
      setSignInError(error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match.');
      return;
    }

    setSignUpLoading(true);
    const { error, needsConfirmation } = await signUp(
      signUpEmail,
      signUpPassword,
      signUpDisplayName.trim() || undefined
    );
    setSignUpLoading(false);

    if (error) {
      setSignUpError(error);
    } else if (needsConfirmation) {
      setSignUpNeedsConfirmation(true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResetLoading(true);
    const { error } = await resetPassword(resetEmail);
    setResetLoading(false);
    if (error) {
      setResetError(error);
    } else {
      setResetSuccess(true);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-[var(--rose-border,#E5E7EB)] dark:border-[#1E293B] ' +
    'bg-white dark:bg-[#0B1120] text-[var(--rose-text,#1F2937)] dark:text-white ' +
    'focus:outline-none focus:ring-2 focus:ring-[#E11D48]/40 text-sm';

  const ctaButtonClass =
    'w-full h-11 flex items-center justify-center gap-2 px-5 rounded-xl ' +
    'bg-[#E11D48] hover:bg-[#BE123C] text-white font-semibold text-sm ' +
    'transition-all shadow-md shadow-[#E11D48]/20 active:scale-[0.98] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const labelClass = 'block text-xs font-medium text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] mb-1.5';

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'signin', label: 'Sign In' },
    { id: 'signup', label: 'Sign Up' },
    { id: 'reset', label: 'Reset' },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--rose-background,#FAF9F6)] dark:bg-[#0B1120] px-4">
      <div className="relative w-full max-w-lg">
        {/* Ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#E11D48]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Card */}
        <div className="relative w-full bg-[var(--rose-surface,#FFFFFF)] dark:bg-[#131E32] rounded-2xl border border-[var(--rose-border,#E5E7EB)] dark:border-[#1E293B] shadow-xl p-6 sm:p-8 flex flex-col items-center">

          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E11D48] to-[#FB7185] flex items-center justify-center text-white shadow-lg shadow-[#E11D48]/20 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-serif font-bold text-[var(--rose-text,#1F2937)] dark:text-white tracking-wide">
            DRIVEcode
          </h1>
          <p className="text-sm text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] mb-6 mt-1">
            Your personal AI assistant.
          </p>

          {/* Tab switcher */}
          <div className="flex w-full mb-6 rounded-xl bg-gray-100 dark:bg-[#1E293B] p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={
                  'flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ' +
                  (activeTab === tab.id
                    ? 'bg-white dark:bg-[#0B1120] text-[#E11D48] shadow-sm'
                    : 'text-[var(--rose-text-muted,#6B7280)] hover:text-[var(--rose-text,#1F2937)] dark:hover:text-white')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Sign In ── */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="w-full flex flex-col gap-4">
              {signInError && (
                <div className="w-full mb-0 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-left text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{signInError}</span>
                </div>
              )}

              <div>
                <label htmlFor="signin-email" className={labelClass}>Email</label>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="signin-password" className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    id="signin-password"
                    type={signInShowPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className={inputClass + ' pr-10'}
                  />
                  <button
                    type="button"
                    aria-label={signInShowPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setSignInShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[var(--rose-text,#1F2937)] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {signInShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={signInLoading} className={ctaButtonClass}>
                {signInLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {signInLoading ? 'Signing in…' : 'Sign In'}
              </button>

              <div className="flex flex-col items-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className="text-xs text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[#E11D48] dark:hover:text-[#FB7185] transition-colors cursor-pointer"
                >
                  Don't have an account? <span className="font-medium underline underline-offset-2">Sign up</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('reset')}
                  className="text-xs text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[#E11D48] dark:hover:text-[#FB7185] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {/* ── Sign Up ── */}
          {activeTab === 'signup' && (
            <>
              {signUpNeedsConfirmation ? (
                <div className="w-full p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 flex items-start gap-3 text-left text-sm text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
                  <span>Check your email to confirm your account!</span>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="w-full flex flex-col gap-4">
                  {signUpError && (
                    <div className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-left text-xs text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{signUpError}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="signup-displayname" className={labelClass}>Display Name</label>
                    <input
                      id="signup-displayname"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name (optional)"
                      value={signUpDisplayName}
                      onChange={(e) => setSignUpDisplayName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-email" className={labelClass}>Email</label>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-password" className={labelClass}>Password</label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={signUpShowPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Min 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={6}
                        className={inputClass + ' pr-10'}
                      />
                      <button
                        type="button"
                        aria-label={signUpShowPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setSignUpShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[var(--rose-text,#1F2937)] dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {signUpShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-confirm" className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <input
                        id="signup-confirm"
                        type={signUpShowConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        required
                        className={inputClass + ' pr-10'}
                      />
                      <button
                        type="button"
                        aria-label={signUpShowConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        onClick={() => setSignUpShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[var(--rose-text,#1F2937)] dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {signUpShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={signUpLoading} className={ctaButtonClass}>
                    {signUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {signUpLoading ? 'Creating account…' : 'Create Account'}
                  </button>

                  <div className="flex justify-center mt-1">
                    <button
                      type="button"
                      onClick={() => handleTabChange('signin')}
                      className="text-xs text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[#E11D48] dark:hover:text-[#FB7185] transition-colors cursor-pointer"
                    >
                      Already have an account? <span className="font-medium underline underline-offset-2">Sign in</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ── Reset Password ── */}
          {activeTab === 'reset' && (
            <div className="w-full flex flex-col gap-4">
              {resetSuccess ? (
                <div className="w-full p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 flex items-start gap-3 text-left text-sm text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
                  <span>Password reset email sent! Check your inbox.</span>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-4">
                  {resetError && (
                    <div className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-left text-xs text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="reset-email" className={labelClass}>Email</label>
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <button type="submit" disabled={resetLoading} className={ctaButtonClass}>
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {resetLoading ? 'Sending…' : 'Send Reset Email'}
                  </button>
                </form>
              )}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className="text-xs text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[#E11D48] dark:hover:text-[#FB7185] transition-colors cursor-pointer"
                >
                  ← Back to Sign in
                </button>
              </div>
            </div>
          )}

          {/* Guest link */}
          {onBypassAsGuest && (
            <button
              type="button"
              onClick={onBypassAsGuest}
              className="mt-3 text-xs text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8] hover:text-[var(--rose-text,#1F2937)] dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-1 font-medium"
            >
              <span>Or continue as guest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[var(--rose-border,#E5E7EB)] dark:border-[#1E293B] w-full flex items-center justify-center gap-1.5 text-[11px] text-[var(--rose-text-muted,#6B7280)] dark:text-[#94A3B8]">
            <span>Secure authentication powered by Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
