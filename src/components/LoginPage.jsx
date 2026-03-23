import React from 'react';
import { loginStyles } from '../assets/dummyStyles';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { ArrowLeft, Clapperboard, EyeOff, Film, Popcorn, Eye, Shield, Lock } from 'lucide-react';
import apiClient from '../config/api';

// Replace this with your real Netlify admin panel URL once deployed.
// For local development it points to the admin Vite dev server.
const ADMIN_PANEL_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

const LoginPage = () => {
    const [mode, setMode] = useState('user'); // 'user' | 'admin'
    const [step, setStep] = useState('login'); // 'login' | 'forgot-email' | 'forgot-otp'
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const goBack = () => { window.history.back(); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /* ── Normal User Login ─────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.password || formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiClient.post('/api/auth/login', {
                email: formData.email,
                password: formData.password,
            });
            const { user } = res.data;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', user?.email || formData.email);
            localStorage.setItem('cine_user_email', user?.email || formData.email);
            localStorage.setItem('cine_auth', JSON.stringify({ isLoggedIn: true, email: user?.email || formData.email }));
            localStorage.setItem('cine_user', JSON.stringify(user || {}));

            toast.success('Login Successful! Redirecting to Cinema...');
            setTimeout(() => { window.location.href = '/'; }, 1500);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                (err?.response?.status === 401 ? 'Invalid email or password' : 'Login failed. Please try again.');
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Admin Login ───────────────────────────────────────── */
    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        if (!formData.password || formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiClient.post('/api/auth/admin-login', {
                email: formData.email,
                password: formData.password,
            });
            const { user } = res.data;

            // We no longer store admin_token in localStorage.
            // The credentials will be passed via HttpOnly cookies to the admin panel
            // assuming it's on the same domain/subdomain with proper CORS.
            localStorage.setItem('cine_admin', JSON.stringify({ isAdmin: true, email: user?.email }));

            toast.success('Admin authenticated! Redirecting to Admin Panel...');
            // Redirect to admin panel
            setTimeout(() => {
                window.location.href = `${ADMIN_PANEL_URL}`;
            }, 1200);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                (err?.response?.status === 403 ? 'Access denied. Admin privileges required.' : 'Admin login failed.');
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Forgot Password Handlers ──────────────────────────── */
    const handleSendResetOtp = async (e) => {
        e.preventDefault();
        if (!formData.email) { toast.error("Please enter your email."); return; }
        setIsLoading(true);
        try {
            const res = await apiClient.post('/api/auth/forgot-password', { email: formData.email });
            toast.success(res.data.message || "OTP sent!");
            setStep('forgot-otp');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to send OTP.');
        } finally { setIsLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || otp.length < 6) { toast.error("Please enter the 6-digit OTP."); return; }
        if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
        setIsLoading(true);
        try {
            const res = await apiClient.post('/api/auth/reset-password', {
                email: formData.email,
                otp,
                newPassword
            });
            toast.success(res.data.message || "Password reset successfully!");
            setStep('login');
            setOtp('');
            setNewPassword('');
            setFormData(prev => ({ ...prev, password: '' })); // clear old password just in case
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to reset password.');
        } finally { setIsLoading(false); }
    };

    const isAdmin = mode === 'admin';

    return (
        <div className={loginStyles.pageContainer}>
            <ToastContainer
                position="top-right"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            <div className="relative w-full max-w-md z-10">
                <div className={loginStyles.backButtonContainer}>
                    <button onClick={() => { if (step !== 'login') setStep('login'); else goBack(); }} className={loginStyles.backButton}>
                        <ArrowLeft className={loginStyles.backButtonIcon} size={20} />
                        <span className={loginStyles.backButtonText}>{step !== 'login' ? 'Back to Login' : 'Back to Home'}</span>
                    </button>
                </div>

                {/* Mode Toggle */}
                {step === 'login' && (
                <div className="flex mb-4 rounded-full overflow-hidden border border-red-700 w-full max-w-xs mx-auto">
                    <button
                        onClick={() => { setMode('user'); setFormData({ email: '', password: '' }); }}
                        className={`flex-1 py-2 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                            !isAdmin ? 'bg-red-700 text-white' : 'bg-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <Film size={14} /> User Login
                    </button>
                    <button
                        onClick={() => { setMode('admin'); setFormData({ email: '', password: '' }); }}
                        className={`flex-1 py-2 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                            isAdmin ? 'bg-red-700 text-white' : 'bg-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <Shield size={14} /> Admin Login
                    </button>
                </div>
                )}

                <div className={loginStyles.cardContainer}>
                    {/* Red glow border for admin mode */}
                    {isAdmin && (
                        <div className="absolute inset-0 rounded-2xl pointer-events-none"
                            style={{ boxShadow: '0 0 24px 4px rgba(220,38,38,0.35)', borderRadius: 'inherit' }} />
                    )}
                    <div className={loginStyles.cardHeader}></div>
                    <div className={loginStyles.headerContainer}>
                        <div className={loginStyles.headerIconContainer}>
                            {isAdmin ? (
                                <Shield className="text-red-500 mr-2" size={28} />
                            ) : (
                                <Film className={loginStyles.headerIcon} size={28} />
                            )}
                            <h2 className={loginStyles.headerTitle}>
                                {step === 'forgot-email' ? 'RESET PASSWORD' : (step === 'forgot-otp' ? 'VERIFY OTP' : (isAdmin ? 'ADMIN ACCESS' : 'CINEMA ACCESS'))}
                            </h2>
                        </div>
                        <p className={loginStyles.headerSubtitle}>
                            {step === 'forgot-email' ? 'Enter your email to receive a reset code' :
                             step === 'forgot-otp' ? `Enter the 6-digit code sent to ${formData.email}` :
                            (isAdmin ? 'Admin credentials required to enter the control panel' : 'Enter your credentials to continue the experience')}
                        </p>

                        {(isAdmin && step === 'login') && (
                            <div className="mb-4 flex items-center gap-2 bg-red-950/40 border border-red-700/40 rounded-xl px-4 py-2 text-red-300 text-xs">
                                <Lock size={13} />
                                <span>This login redirects to the <strong>Admin Panel</strong></span>
                            </div>
                        )}

                        {/* --- LOGIN FORM --- */}
                        {step === 'login' && (
                        <form onSubmit={isAdmin ? handleAdminSubmit : handleSubmit}>
                            <div className={loginStyles.inputGroup}>
                                <label htmlFor="email" className={loginStyles.label}>EMAIL ADDRESS</label>
                                <div className={loginStyles.inputContainer}>
                                    <input
                                        type="email" id="email" name="email"
                                        value={formData.email} onChange={handleChange}
                                        className={loginStyles.input}
                                        placeholder="Your Email Address" required
                                    />
                                    <div className={loginStyles.inputIcon}>
                                        <Clapperboard className="text-red-500" size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className={loginStyles.inputGroup}>
                                <label htmlFor="password" className={loginStyles.label}>PASSWORD</label>
                                <div className={loginStyles.inputContainer}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password" name="password"
                                        value={formData.password} onChange={handleChange}
                                        className={loginStyles.inputWithIcon}
                                        placeholder="Enter Your Password" required
                                    />
                                    <button type="button" className={loginStyles.passwordToggle}
                                        onClick={() => setShowPassword((prev) => !prev)}>
                                        {showPassword
                                            ? <EyeOff size={18} className={loginStyles.passwordToggleIcon} />
                                            : <Eye size={18} className={loginStyles.passwordToggleIcon} />}
                                    </button>
                                </div>
                            </div>

                            {!isAdmin && (
                                <div className="flex justify-end mb-4">
                                    <button type="button" onClick={() => setStep('forgot-email')} className="text-xs text-red-500 hover:text-red-400 font-medium">
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`${loginStyles.submitButton} ${isLoading ? loginStyles.submitButtonDisabled : ''} ${
                                    isAdmin ? 'from-red-700 to-red-800' : ''
                                }`}
                            >
                                {isLoading ? (
                                    <div className={loginStyles.buttonContent}>
                                        <div className={loginStyles.loadingSpinner}></div>
                                        <span className={loginStyles.buttonText}>
                                            {isAdmin ? 'VERIFYING ADMIN...' : 'SIGNING IN...'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={loginStyles.buttonContent}>
                                        {isAdmin
                                            ? <Shield size={18} className={loginStyles.buttonIcon} />
                                            : <Popcorn size={18} className={loginStyles.buttonIcon} />}
                                        <span className={loginStyles.buttonText}>
                                            {isAdmin ? 'ENTER ADMIN PANEL' : 'ACCESS YOUR ACCOUNT'}
                                        </span>
                                    </div>
                                )}
                            </button>
                        </form>
                        )}

                        {/* --- FORGOT EMAIL FORM --- */}
                        {step === 'forgot-email' && (
                            <form onSubmit={handleSendResetOtp}>
                                <div className={loginStyles.inputGroup}>
                                    <label htmlFor="email" className={loginStyles.label}>EMAIL ADDRESS</label>
                                    <div className={loginStyles.inputContainer}>
                                        <input
                                            type="email" id="email" name="email" autoFocus
                                            value={formData.email} onChange={handleChange}
                                            className={loginStyles.input}
                                            placeholder="Enter registered email" required
                                        />
                                        <div className={loginStyles.inputIcon}>
                                            <Clapperboard className="text-red-500" size={16} />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className={`${loginStyles.submitButton} ${isLoading ? loginStyles.submitButtonDisabled : ''}`}>
                                    {isLoading ? (
                                        <div className={loginStyles.buttonContent}>
                                            <div className={loginStyles.loadingSpinner}></div>
                                            <span className={loginStyles.buttonText}>SENDING CODE...</span>
                                        </div>
                                    ) : (
                                        <div className={loginStyles.buttonContent}>
                                            <span className={loginStyles.buttonText}>SEND RESET CODE</span>
                                        </div>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* --- VERIFY OTP & NEW PASSWORD FORM --- */}
                        {step === 'forgot-otp' && (
                            <form onSubmit={handleResetPassword}>
                                <div className={loginStyles.inputGroup}>
                                    <label htmlFor="otp" className={loginStyles.label}>6-DIGIT OTP</label>
                                    <div className={loginStyles.inputContainer}>
                                        <input
                                            type="text" id="otp" name="otp" maxLength="6"
                                            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className={loginStyles.input}
                                            placeholder="XXXXXX" required autoFocus
                                            style={{ letterSpacing: '8px', fontSize: '18px', fontWeight: 'bold' }}
                                        />
                                        <div className={loginStyles.inputIcon}>
                                            <Lock className="text-red-500" size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className={loginStyles.inputGroup}>
                                    <label htmlFor="newPassword" className={loginStyles.label}>NEW PASSWORD</label>
                                    <div className={loginStyles.inputContainer}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="newPassword" name="newPassword"
                                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                            className={loginStyles.inputWithIcon}
                                            placeholder="Min 6 characters" required
                                        />
                                        <button type="button" className={loginStyles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={18} className={loginStyles.passwordToggleIcon} /> : <Eye size={18} className={loginStyles.passwordToggleIcon} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading || otp.length < 6} className={`${loginStyles.submitButton} ${(isLoading || otp.length < 6) ? loginStyles.submitButtonDisabled : ''}`}>
                                    {isLoading ? (
                                        <div className={loginStyles.buttonContent}>
                                            <div className={loginStyles.loadingSpinner}></div>
                                            <span className={loginStyles.buttonText}>RESETTING...</span>
                                        </div>
                                    ) : (
                                        <div className={loginStyles.buttonContent}>
                                            <span className={loginStyles.buttonText}>CONFIRM NEW PASSWORD</span>
                                        </div>
                                    )}
                                </button>
                                <div className="mt-4 text-center">
                                    <button type="button" onClick={handleSendResetOtp} disabled={isLoading} className="text-xs text-gray-400 hover:text-white transition-colors">
                                        Didn't receive a code? Resend
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>


                {(!isAdmin && step === 'login') && (
                    <div className={loginStyles.footerContainer}>
                        <p className={loginStyles.footerText}>
                            Don't have an account?{" "}
                            <a href="/signup" className={loginStyles.footerLink}>Create one now</a>
                        </p>
                    </div>
                )}
            </div>
            <style>{loginStyles.customCSS}</style>
        </div>
    );
};

export default LoginPage;