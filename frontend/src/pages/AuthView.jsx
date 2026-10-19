import React, { useState } from 'react';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { login, register } from '../api/services';

const DEMO = [
  { label: 'Customer', email: 'priya@staysafe.com', password: 'Customer@123', color: 'bg-teal-600' },
  { label: 'Room Owner', email: 'rahul@staysafe.com', password: 'Owner@123', color: 'bg-blue-600' },
  { label: 'Admin', email: 'admin@staysafe.com', password: 'Admin@123', color: 'bg-purple-600' }
];

export default function AuthView({ onAuth, showToast }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      onAuth(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-500';

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-xs text-slate-500 mt-1">Safe Stays. Better Tomorrows.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <>
              <input className={input} placeholder="Full name" value={form.name} onChange={set('name')} required />
              <input className={input} placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} />
              <select className={input} value={form.role} onChange={set('role')}>
                <option value="CUSTOMER">I'm looking for a stay (Customer)</option>
                <option value="OWNER">I want to list properties (Room Owner)</option>
              </select>
            </>
          )}
          <input className={input} type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input className={input} type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={set('password')} required minLength={6} />

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">{error}</p>}

          <button disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 disabled:opacity-60">
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {mode === 'login' ? "New to StaySafe? " : 'Already registered? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-teal-600 font-bold hover:underline">
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>

        {mode === 'login' && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 text-center">Demo accounts (seeded data)</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map(d => (
                <button key={d.label} type="button" onClick={() => { setForm({ ...form, email: d.email, password: d.password }); showToast(`Filled ${d.label} credentials`); }}
                  className={`${d.color} text-white text-[11px] font-bold py-2 rounded-lg`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
