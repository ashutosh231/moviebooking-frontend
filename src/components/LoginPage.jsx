import React from 'react';
import { loginStyles } from '../assets/dummyStyles';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { ArrowLeft,Clapperboard,EyeOff,Film, Popcorn,Eye, } from 'lucide-react';
import apiClient from '../config/api';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const goBack = () => {
        window.history.back();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

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

            // Save JWT token so authenticated API calls work
            localStorage.setItem('token', token);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', user?.email || formData.email);
            localStorage.setItem('cine_user_email', user?.email || formData.email);
            localStorage.setItem('cine_auth', JSON.stringify({ isLoggedIn: true, email: user?.email || formData.email }));
            localStorage.setItem('cine_user', JSON.stringify(user || {}));

            toast.success('Login Successful! Redirecting to Cinema...');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                (err?.response?.status === 401 ? 'Invalid email or password' : 'Login failed. Please try again.');
            toast.error(msg);
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };
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

        <div className={loginStyles.cardContainer}>
            <div className={loginStyles.cardHeader}></div>
            <div className={loginStyles.headerContainer}>
                <div className={loginStyles.headerIconContainer}>
                    <Film className={loginStyles.headerIcon} size={28}/>
                    <h2 className={loginStyles.headerTitle}>CINEMA ACCESS</h2>

                </div>
                <p className={loginStyles.headerSubtitle}>Enter your credentials to continue the experience</p>
                <form onSubmit={handleSubmit}>
                    <div className={loginStyles.inputGroup}>
                        <label htmlFor="email" className={loginStyles.label}>EMAIL ADDRESS</label>
                        <div className={loginStyles.inputContainer}>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={loginStyles.input} placeholder='Your Email Address'  required />
                            <div className={loginStyles.inputIcon}>
                                <Clapperboard className='text-red-500' size={16} />
                            </div>
                        </div>
                    </div>

                    <div className={loginStyles.inputGroup}>
                        <label htmlFor="password" className={loginStyles.label}>PASSWORD</label>
                        <div className={loginStyles.inputContainer}>
                            <input type={showPassword ? "text" : "password"} id="password"  name="password" value={formData.password} onChange={handleChange} className={loginStyles.inputWithIcon} placeholder='Enter Your Password'  required />
                            <button type="button" className={loginStyles.passwordToggle} onClick={() => setShowPassword((prev) => !prev)}>
                                {showPassword ? (
                                    <EyeOff size={18} className={loginStyles.passwordToggleIcon} />
                                )
                                
                                : <Eye size={18} className={loginStyles.passwordToggleIcon} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className={`${loginStyles.submitButton} ${
                        isLoading ? loginStyles.submitButtonDisabled : ''
                    }`}>
                        {isLoading ? (
                            <div className={loginStyles.buttonContent}>
                                <div className={loginStyles.loadingSpinner}></div>
                                <span className={loginStyles.buttonText}>SIGNING IN...</span>
                            </div>
                        ) : (
                            <div className={loginStyles.buttonContent}>
                                <Popcorn size={18} className={loginStyles.buttonIcon} />
                                <span className={loginStyles.buttonText}>ACCESS YOUR ACCOUNT</span>
                            </div>
                        )}
                    </button>
                </form>
            </div>

        </div>
        <div className={loginStyles.footerContainer}>
            <p className={loginStyles.footerText}>
                Don't have an account?{" "}
                <a href="/signup" className={loginStyles.footerLink}>Create one now</a>
            </p>

        </div>
      </div>
      <style >{loginStyles.customCSS}</style>
    </div>
  );
};

export default LoginPage;