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
            const { token, user } = res.data;
            localStorage.setItem('token', token);
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
            const { token, user } = res.data;

            // Store the token on the current origin too (in case admin panel shares domain)
            localStorage.setItem('admin_token', token);
            localStorage.setItem('cine_admin', JSON.stringify({ isAdmin: true, email: user?.email }));

            toast.success('Admin authenticated! Redirecting to Admin Panel...');
            // Redirect to admin panel — passes token via URL param for auto-login
            setTimeout(() => {
                window.location.href = `${ADMIN_PANEL_URL}?token=${encodeURIComponent(token)}`;
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
                    <button onClick={goBack} className={loginStyles.backButton}>
                        <ArrowLeft className={loginStyles.backButtonIcon} size={20} />
                        <span className={loginStyles.backButtonText}>Back to Home</span>
                    </button>
                </div>

                {/* Mode Toggle */}
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
                                {isAdmin ? 'ADMIN ACCESS' : 'CINEMA ACCESS'}
                            </h2>
                        </div>
                        <p className={loginStyles.headerSubtitle}>
                            {isAdmin
                                ? 'Admin credentials required to enter the control panel'
                                : 'Enter your credentials to continue the experience'}
                        </p>

                        {isAdmin && (
                            <div className="mb-4 flex items-center gap-2 bg-red-950/40 border border-red-700/40 rounded-xl px-4 py-2 text-red-300 text-xs">
                                <Lock size={13} />
                                <span>This login redirects to the <strong>Admin Panel</strong></span>
                            </div>
                        )}

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
                    </div>
                </div>

                {!isAdmin && (
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