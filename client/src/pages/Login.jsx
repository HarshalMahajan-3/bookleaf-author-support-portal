
import { useState } from 'react';
import { ArrowRight, BookOpen, Check, Eye, EyeOff, Leaf, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api';
import { PrimaryButton } from '../components/UI';

const AUTHORS = [
  ['Priya Sharma', 'priya.sharma@email.com'],
  ['Rohit Kapoor', 'rohit.kapoor@email.com'],
  ['Ananya Reddy', 'ananya.reddy@email.com'],
  ['Vikram Joshi', 'vikram.joshi@email.com'],
  ['Meera Nair', 'meera.nair@email.com'],
  ['Arjun Malhotra', 'arjun.malhotra@email.com'],
  ['Sneha Kulkarni', 'sneha.kulkarni@email.com'],
  ['Farhan Sheikh', 'farhan.sheikh@email.com'],
  ['Kavita Deshmukh', 'kavita.deshmukh@email.com'],
  ['Diya Chatterjee', 'diya.chatterjee@email.com'],
];

export default function Login() {
  const [selectedAuthor, setSelectedAuthor] = useState('priya.sharma@email.com');
  const [email, setEmail] = useState('priya.sharma@email.com');
  const [password, setPassword] = useState('author@1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin/overview' : '/author/overview');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  const useDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@bookleaf.com');
      setPassword('admin@1234');
    } else {
      setEmail(selectedAuthor);
      setPassword('author@1234');
    }
    setError('');
  };

  return <div className="min-h-screen bg-[#f5f7f1] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
    <section className="relative hidden min-h-screen overflow-hidden bg-[#17382f] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
      <div className="absolute -right-36 -top-28 h-[520px] w-[520px] rounded-full border border-white/[0.08]" />
      <div className="absolute -right-16 -top-8 h-[360px] w-[360px] rounded-full border border-white/[0.08]" />
      <div className="absolute -bottom-44 -left-28 h-[520px] w-[520px] rounded-full bg-[#244c3e]/70" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-[15px] bg-leaf text-forest">
          <BookOpen size={22} />
        </div>
        <div>
          <p className="font-display text-[22px] font-bold tracking-tight">bookleaf<span className="text-leaf">.</span></p>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">Publishing, thoughtfully</p>
        </div>
      </div>

      <div className="relative z-10 max-w-[570px] pb-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-leaf">
          <Sparkles size={13} /> Your publishing journey, in one place
        </div>
        <h1 className="font-display text-[48px] font-semibold leading-[1.12] tracking-[-0.04em] xl:text-[60px]">
          A better way to bring your <span className="text-leaf">words</span> to the world.
        </h1>
        <p className="mt-6 max-w-[440px] text-[15px] leading-7 text-white/60">
          Keep track of your books, understand your royalties and stay connected with the people who help your stories reach readers.
        </p>
        <div className="mt-12 grid max-w-[480px] grid-cols-3 gap-4 border-t border-white/15 pt-6">
          {[['10', 'authors in demo'], ['18', 'books in catalogue'], ['1', 'connected workspace']].map(([n, label]) => (
            <div key={label}>
              <p className="font-display text-2xl font-bold text-white">{n}</p>
              <p className="mt-1 text-[10px] text-white/45">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="relative z-10 text-[10px] text-white/35">© 2026 BookLeaf Publishing · Author support portal</p>
    </section>

    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
      <div className="w-full max-w-[430px]">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-forest text-leaf">
            <BookOpen size={20} />
          </div>
          <span className="font-display text-xl font-bold text-ink">bookleaf.</span>
        </div>

        <div className="mb-8">
          <p className="eyebrow">WELCOME BACK</p>
          <h2 className="mt-2 font-display text-[32px] font-bold tracking-tight text-ink">Sign in to your space.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Access your books, support requests and publishing updates.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="field-label" htmlFor="email">Email address</label>
            <div className="relative mt-2">
              <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input pl-11"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="field-label" htmlFor="password">Password</label>
              <span className="text-[11px] font-medium text-muted">Demo access</span>
            </div>
            <div className="relative mt-2">
              <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input pl-11 pr-12"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-cream"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
              {error}
            </div>
          )}

          <PrimaryButton loading={loading} type="submit" className="mt-2 w-full py-3">
            Continue to workspace <ArrowRight size={16} />
          </PrimaryButton>
        </form>

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Quick demo sign in</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Author demo accounts</span>
              <Check size={14} className="text-forest" />
            </div>

            <select
              value={selectedAuthor}
              onChange={(e) => {
                setSelectedAuthor(e.target.value);
                setEmail(e.target.value);
                setPassword('author@1234');
                setError('');
              }}
              className="field-input mt-3"
            >
              {AUTHORS.map(([name, authorEmail]) => (
                <option key={authorEmail} value={authorEmail}>
                  {name} - {authorEmail}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => useDemo('author')}
              className="mt-3 w-full rounded-xl bg-forest p-3 text-xs font-semibold text-white hover:bg-[#244c3e]"
            >
              Continue as Author <ArrowRight size={15} className="inline ml-1" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => useDemo('admin')}
            className={`w-full rounded-xl border p-3 text-left transition ${
              email === 'admin@bookleaf.com'
                ? 'border-[#9bb86e] bg-[#f1f6e8]'
                : 'border-line bg-white hover:border-[#cbd5c9]'
            }`}
          >
            <span className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Admin demo</span>
              {email === 'admin@bookleaf.com' && <Check size={14} className="text-forest" />}
            </span>
            <span className="mt-1 block text-[10px] text-muted">Operations team</span>
          </button>
        </div>

        <p className="mt-7 text-center text-[10px] leading-5 text-muted">
          <Leaf size={11} className="mr-1 inline text-forest" />
          Your information is protected with account-based access.
        </p>
      </div>
    </section>
  </div>;
}
