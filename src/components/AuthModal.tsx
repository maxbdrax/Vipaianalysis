import React, { useState } from 'react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';
import { 
  Sparkles, 
  X, 
  Mail, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  Copy, 
  Check, 
  ExternalLink,
  Zap,
  HelpCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, loginAsRootAdmin } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showDomainGuide, setShowDomainGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
  const isUnauthorizedDomain = errorMsg?.toLowerCase().includes('unauthorized-domain') || showDomainGuide;

  const handleCopyHostname = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstantAdmin = () => {
    loginAsRootAdmin();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMsg('Firebase: Error (auth/unauthorized-domain). Current domain is not in Authorized Domains list.');
        setShowDomainGuide(true);
      } else {
        setErrorMsg(err.message || 'Google sign-in was cancelled or encountered an error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-vip rounded-2xl max-w-lg w-full p-6 border border-pink-500/40 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white font-['Chakra_Petch']">
              WIN GO AI VIP ACCESS
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Authentication & Admin Authorization
            </p>
          </div>
        </div>

        {/* 1-CLICK INSTANT ROOT ADMIN ACCESS BUTTON (HIGHEST PRIORITY) */}
        <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-pink-950/70 via-purple-950/70 to-slate-900 border border-pink-500/50 shadow-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-pink-300 font-bold text-xs font-mono">
              <Zap className="w-4 h-4 text-pink-400 animate-pulse" />
              <span>১-ক্লিকে ROOT ADMIN লগইন (Instant Access)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
              NO CONFIG REQUIRED
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans mb-3 leading-relaxed">
            ডোমেন ভেরিফিকেশন বা Google OAuth ছাড়াও সরাসরি <span className="text-pink-300 font-mono font-semibold">{BOOTSTRAP_ADMIN_EMAIL}</span> হিসেবে সম্পূর্ণ সিস্টেম আনলক করুন:
          </p>
          <button
            type="button"
            onClick={handleInstantAdmin}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs font-mono shadow-md shadow-pink-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4 text-pink-200" />
            <span>⚡ Enter as Root Admin ({BOOTSTRAP_ADMIN_EMAIL})</span>
          </button>
        </div>

        {/* UNAUTHORIZED DOMAIN RESOLUTION WIDGET */}
        {isUnauthorizedDomain && (
          <div className="mb-5 p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-sans space-y-3 shadow-inner">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm font-mono">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>Firebase (auth/unauthorized-domain) সমাধান</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Google Sign-In চালানোর জন্য এই ক্লাউড ডোমেইনটি Firebase Console-এ একবার যুক্ত (Authorize) করতে হবে:
            </p>

            {/* Current Hostname & Copy button */}
            <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-between gap-2">
              <div className="truncate font-mono text-[11px] text-amber-100 select-all">
                {currentHostname}
              </div>
              <button
                type="button"
                onClick={handleCopyHostname}
                className="shrink-0 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-900" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Domain'}</span>
              </button>
            </div>

            {/* 3 Step Guide */}
            <div className="text-[11px] space-y-1.5 text-amber-200/90">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <span>সহজ ৩টি ধাপ:</span>
              </div>
              <div className="pl-2 space-y-1">
                <p>১. নিচের বাটনে চাপ দিয়ে <strong>Firebase Auth Settings</strong> ওপেন করুন।</p>
                <p>২. <strong>"Authorized domains"</strong> সেকশনে <strong>"Add domain"</strong> ক্লিক করুন।</p>
                <p>৩. উপরের কপি করা ডোমেইনটি পেস্ট করে <strong>"Add"</strong> চাপুন।</p>
              </div>
            </div>

            <a
              href="https://console.firebase.google.com/project/deft-granite-6f6jr/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold transition-colors"
            >
              <span>Open Firebase Auth Settings</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {errorMsg && !isUnauthorizedDomain && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs font-mono shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer mb-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        {!isUnauthorizedDomain && (
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setShowDomainGuide(!showDomainGuide)}
              className="text-[11px] text-slate-400 hover:text-amber-400 font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Having unauthorized domain error?</span>
            </button>
          </div>
        )}

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-2 bg-slate-900 text-[10px] text-slate-500 font-mono uppercase">
            Or with email & password
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs font-mono shadow-md shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{submitting ? 'Authenticating...' : mode === 'login' ? 'Sign In to VIP System' : 'Create Free Account'}</span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1">
          <span>Configured Root Administrator:</span>
          <span className="text-pink-400 font-semibold">{BOOTSTRAP_ADMIN_EMAIL}</span>
        </div>
      </div>
    </div>
  );
};
