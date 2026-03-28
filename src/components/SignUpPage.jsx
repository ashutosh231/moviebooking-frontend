import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { ArrowLeft, Clapperboard, Calendar, Film, Ticket, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, RotateCcw } from 'lucide-react';
import apiClient from '../config/api';
import { useNavigate } from 'react-router-dom';

/* ─── All styles self-contained ───────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .sv-page {
    min-height: 100vh;
    background: #0a0a0a;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .sv-blob1 {
    position: fixed; top: -120px; right: -120px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(229,9,20,.18) 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }
  .sv-blob2 {
    position: fixed; bottom: -100px; left: -100px;
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(229,9,20,.1) 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }

  .sv-back {
    position: fixed; top: 20px; left: 20px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    color: #aaa;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    font-size: 13px;
    transition: background .2s, color .2s;
    z-index: 10;
  }
  .sv-back:hover { background: rgba(255,255,255,.1); color: #fff; }

  /* ── CARD */
  .sv-card {
    width: 100%; max-width: 640px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px;
    padding: 36px 32px 28px;
    backdrop-filter: blur(20px);
    position: relative;
    z-index: 1;
  }

  /* ── HEADER */
  .sv-logo {
    text-align: center; margin-bottom: 6px;
    display: flex; align-items: center;
    justify-content: center; gap: 10px;
  }
  .sv-logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg,#e50914,#c00);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(229,9,20,.35);
  }
  .sv-logo-text {
    font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -.5px;
  }
  .sv-subtitle {
    text-align: center; color: #666; font-size: 13px; margin-bottom: 24px;
  }

  /* ── FORM GRID (2 columns for name+username) */
  .sv-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  @media (max-width: 520px) { .sv-row { grid-template-columns: 1fr; } }

  .sv-field { margin-bottom: 14px; }
  .sv-label {
    display: block; font-size: 12px; font-weight: 600;
    color: #888; margin-bottom: 6px; letter-spacing: .3px;
    text-transform: uppercase;
  }
  .sv-input-wrap { position: relative; }
  .sv-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: #555; pointer-events: none;
  }
  .sv-input {
    width: 100%; padding: 11px 12px 11px 38px;
    background: rgba(255,255,255,.05);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 10px; color: #fff; font-size: 14px;
    outline: none; transition: border-color .2s, box-shadow .2s;
    box-sizing: border-box; font-family: inherit;
  }
  .sv-input::placeholder { color: #444; }
  .sv-input:focus {
    border-color: rgba(229,9,20,.5);
    box-shadow: 0 0 0 3px rgba(229,9,20,.12);
  }
  .sv-input.err { border-color: #e50914; }
  .sv-err { color: #e50914; font-size: 11px; margin-top: 4px; padding-left: 2px; }

  .sv-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #555; cursor: pointer; padding: 0;
    display: flex; align-items: center;
  }
  .sv-eye:hover { color: #aaa; }

  /* date input fix */
  .sv-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.4); }

  /* ── SUBMIT BTN */
  .sv-btn {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg,#e50914,#c00);
    border: none; border-radius: 10px;
    color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; letter-spacing: .3px;
    margin-top: 6px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .2s, transform .15s;
  }
  .sv-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
  .sv-btn:disabled { opacity: .55; cursor: not-allowed; }

  .sv-footer {
    text-align: center; margin-top: 20px;
    font-size: 13px; color: #555;
  }
  .sv-footer a { color: #e50914; text-decoration: none; font-weight: 600; }
  .sv-footer a:hover { text-decoration: underline; }

  /* ── SPINNER */
  @keyframes spin { to { transform: rotate(360deg); } }
  .sv-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    display: inline-block;
  }

  /* ── OTP STEP */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sv-otp-card {
    width: 100%; max-width: 400px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px;
    padding: 36px 28px 28px;
    text-align: center;
    position: relative; z-index: 1;
    animation: slideUp .35s ease;
  }
  .sv-otp-icon {
    width: 60px; height: 60px;
    background: linear-gradient(135deg,#e50914,#c00);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px;
    box-shadow: 0 0 28px rgba(229,9,20,.35);
  }
  .sv-otp-title { color:#fff;font-size:20px;font-weight:800;margin:0 0 6px; }
  .sv-otp-sub   { color:#666;font-size:13px;line-height:1.6;margin:0 0 28px; }
  .sv-otp-row   { display:flex;justify-content:center;gap:10px;margin-bottom:26px; }
  .sv-digit {
    width: 46px; height: 54px;
    background: rgba(255,255,255,.05);
    border: 2px solid rgba(255,255,255,.1);
    border-radius: 10px;
    color: #fff; font-size: 22px; font-weight: 700;
    text-align: center; font-family: 'Courier New', monospace;
    outline: none; transition: border-color .2s, box-shadow .2s;
  }
  .sv-digit:focus { border-color: #e50914; box-shadow: 0 0 0 3px rgba(229,9,20,.2); }
  .sv-resend {
    background: none; border: none; color: #e50914; font-size: 13px;
    cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
    font-family: inherit;
  }
  .sv-resend:disabled { color: #444; cursor: not-allowed; }
  .sv-otp-hint { color:#555;font-size:12px;margin-top:10px; }
  .sv-otp-back {
    background:none;border:none;color:#666;font-size:13px;
    cursor:pointer;display:inline-flex;align-items:center;gap:5px;
    margin-bottom:20px; font-family:inherit;
  }
  .sv-otp-back:hover { color:#fff; }
`;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ fullName:'', username:'', email:'', phone:'', birthDate:'', password:'' });
  const [otp, setOtp] = useState(['','','','','','']);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(0);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.length < 2) e.fullName = 'At least 2 characters';
    if (!form.username.trim() || form.username.length < 3) e.username = 'At least 3 characters';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = '10 digits required';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.birthDate) e.birthDate = 'Required';
    else if (new Date().getFullYear() - new Date(form.birthDate).getFullYear() < 13)
      e.birthDate = 'Must be 13+';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const startTimer = (n = 60) => {
    setResendTimer(n);
    const id = setInterval(() => setResendTimer(t => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; }), 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await apiClient.post('/api/auth/send-otp', { ...form });
      toast.success(`OTP sent to ${form.email}`);
      setStep('otp');
      startTimer(60);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (v, i) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
    if (v && i < 5) document.getElementById(`d${i+1}`)?.focus();
  };
  const handleOtpKey = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`d${i-1}`)?.focus();
  };
  const handlePaste = (e) => {
    const txt = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (!txt) return;
    setOtp(txt.split('').concat(Array(6).fill('')).slice(0,6));
    document.getElementById(`d${Math.min(txt.length,5)}`)?.focus();
    e.preventDefault();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/verify-otp', { ...form, otp: code });
      const { user } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      toast.success('🎉 Welcome to CineVerse!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Incorrect OTP');
      setOtp(['','','','','','']);
      document.getElementById('d0')?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await apiClient.post('/api/auth/send-otp', { name: form.fullName, email: form.email });
      toast.success('New OTP sent!');
      setOtp(['','','','','','']);
      startTimer(60);
    } catch { toast.error('Resend failed'); }
  };

  // ⚠ Defined as a plain function (not React component) so React never
  //   unmounts the input on re-render → fixes the focus-loss bug.
  const field = ({ name, label, type = 'text', placeholder, Icon, pw }) => (
    <div className="sv-field" key={name}>
      <label className="sv-label">{label}</label>
      <div className="sv-input-wrap">
        <Icon size={15} className="sv-icon" />
        <input
          type={pw ? (showPw ? 'text' : 'password') : type}
          name={name}
          value={form[name]}
          onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          className={`sv-input${errors[name] ? ' err' : ''}`}
          autoComplete={pw ? 'new-password' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
        />
        {pw && (
          <button type="button" className="sv-eye" onClick={() => setShowPw(p => !p)}>
            {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        )}
      </div>
      {errors[name] && <p className="sv-err">{errors[name]}</p>}
    </div>
  );


  return (
    <>
      <style>{css}</style>
      <ToastContainer position="top-right" theme="dark" />

      <div className="sv-page">
        <div className="sv-blob1"/><div className="sv-blob2"/>

        <button className="sv-back" onClick={() => window.history.back()}>
          <ArrowLeft size={14}/> Back
        </button>

        {/* ── OTP step ── */}
        {step === 'otp' && (
          <div className="sv-otp-card">
            <button className="sv-otp-back" onClick={() => { setStep('form'); setOtp(['','','','','','']); }}>
              <ArrowLeft size={13}/> Edit details
            </button>
            <div className="sv-otp-icon"><ShieldCheck size={26} color="#fff"/></div>
            <h2 className="sv-otp-title">Check your inbox</h2>
            <p className="sv-otp-sub">
              We sent a 6-digit code to<br/>
              <strong style={{color:'#e50914'}}>{form.email}</strong>
            </p>
            <form onSubmit={handleVerify}>
              <div className="sv-otp-row" onPaste={handlePaste}>
                {otp.map((d,i) => (
                  <input
                    key={i} id={`d${i}`}
                    type="text" inputMode="numeric"
                    maxLength={1} value={d}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKey(e, i)}
                    className="sv-digit"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button type="submit" className="sv-btn" disabled={loading || otp.some(d=>!d)}>
                {loading ? <><span className="sv-spinner"/> Verifying…</> : <><ShieldCheck size={15}/> Verify & Create Account</>}
              </button>
            </form>
            <div style={{marginTop:16}}>
              <button className="sv-resend" onClick={handleResend} disabled={resendTimer>0}>
                <RotateCcw size={12}/> {resendTimer>0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
              {resendTimer===0 && <p className="sv-otp-hint">Didn't receive it? Check spam.</p>}
            </div>
          </div>
        )}

        {/* ── Form step ── */}
        {step === 'form' && (
          <div className="sv-card">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-2 group">
                <div className="p-1.5 bg-gradient-to-br from-red-600 to-red-800 rounded-lg shadow-sm shadow-red-900/20">
                    <Clapperboard className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 font-[pacifico] tracking-wider">CineVerse</span>
            </div>
            <p className="sv-subtitle">Create your account</p>

            <form onSubmit={handleSendOtp}>
              {/* Row 1: Name + Username */}
              <div className="sv-row">
                {field({ name:'fullName',  label:'Full Name',     placeholder:'Your name',     Icon:User                    })}
                {field({ name:'username',  label:'Username',      placeholder:'@username',     Icon:User                    })}
              </div>

              {/* Row 2: Email + Phone */}
              <div className="sv-row">
                {field({ name:'email', label:'Email', type:'email', placeholder:'you@mail.com', Icon:Mail  })}
                {field({ name:'phone', label:'Phone', type:'tel',   placeholder:'10 digits',    Icon:Phone })}
              </div>

              {/* Row 3: DOB + Password */}
              <div className="sv-row">
                {field({ name:'birthDate', label:'Date of Birth', type:'date', placeholder:'', Icon:Calendar      })}
                {field({ name:'password',  label:'Password',                   placeholder:'Min 6 chars', Icon:Lock, pw:true })}
              </div>

              <button type="submit" className="sv-btn" disabled={loading}>
                {loading
                  ? <><span className="sv-spinner"/> Sending OTP…</>
                  : <><ShieldCheck size={15}/> Send Verification Code</>}
              </button>
            </form>

            <div className="sv-footer">
              Already have an account? <a href="/login">Sign in</a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}