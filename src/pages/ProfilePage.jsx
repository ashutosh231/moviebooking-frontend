import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { 
  User, Mail, Phone, Calendar, Shield, Save, 
  ArrowLeft, Edit2, Check, X, Film, Info,
  Settings, UserCircle, LogOut
} from 'lucide-react';
import apiClient from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showMoreDetails, setShowMoreDetails] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        birthDate: '',
        preferences: {}
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/api/auth/profile');
            setUser(res.data.user);
            setFormData({
                fullName: res.data.user.fullName || '',
                phone: res.data.user.phone || '',
                birthDate: res.data.user.birthDate ? new Date(res.data.user.birthDate).toISOString().split('T')[0] : '',
                preferences: res.data.user.preferences || {}
            });
        } catch (err) {
            toast.error("Failed to load profile");
            navigate('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await apiClient.put('/api/auth/profile', formData);
            setUser(res.data.user);
            setIsEditing(false);
            
            // Sync with localStorage for Navbar
            const cineUser = JSON.parse(localStorage.getItem('cine_user') || '{}');
            cineUser.fullName = res.data.user.fullName;
            localStorage.setItem('cine_user', JSON.stringify(cineUser));
            
            toast.success("Profile updated successfully!");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to update profile");
        }
    };


    const handlePreferenceToggle = (field, val) => {
        setFormData(prev => {
            const current = Array.isArray(prev.preferences[field]) ? prev.preferences[field] : [];
            const newValues = current.includes(val)
                ? current.filter(i => i !== val)
                : [...current, val];
            return {
                ...prev,
                preferences: { ...prev.preferences, [field]: newValues }
            };
        });
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await apiClient.post('/api/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(prev => ({ ...prev, avatar: res.data.avatar }));
            // Update localStorage to keep Navbar in sync
            const cineUser = JSON.parse(localStorage.getItem('cine_user') || '{}');
            cineUser.avatar = res.data.avatar;
            localStorage.setItem('cine_user', JSON.stringify(cineUser));
            
            toast.success("Avatar updated!");
        } catch (err) {
            toast.error("Failed to upload avatar");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600"></div>
            </div>
        );
    }

    const sections = [
        { label: 'Genres', key: 'genres', options: ['Action', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-fi', 'Drama', 'Family'] },
        { label: 'Languages', key: 'languages', options: ['Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Other'] },
        { label: 'Experience', key: 'experience', options: ['Fun', 'Emotional', 'Suspenseful', 'Mind-bending', 'Relaxing', 'Family-friendly'] },
        { label: 'Timings', key: 'showTimings', options: ['Morning', 'Afternoon', 'Evening', 'Night'] }
    ];

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Navbar />
            <ToastContainer theme="dark" />
            
            <div className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* Sidebar / Left Column */}
                    <div className="w-full md:w-1/3 flex flex-col gap-6">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
                            <div className="relative w-24 h-24 mx-auto mb-4 group">
                                <div className="w-full h-full bg-red-600/10 rounded-full flex items-center justify-center border-2 border-red-600/20 overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle size={48} className="text-red-600" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-1.5 bg-red-600 rounded-full cursor-pointer hover:bg-red-700 transition-all shadow-lg border-2 border-zinc-950">
                                    <Edit2 size={12} className="text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                            <h2 className="text-xl font-bold mb-1">{user?.fullName}</h2>
                            <p className="text-zinc-500 text-sm mb-6">@{user?.username}</p>

                            
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setIsEditing(!isEditing)}
                                    className="w-full py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all text-sm font-medium flex items-center justify-center gap-2">
                                    {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
                                </button>
                                <button onClick={() => navigate('/bookings')}
                                    className="w-full py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 transition-all text-sm font-medium flex items-center justify-center gap-2">
                                    <Film size={16} /> My Bookings
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info size={14} /> Quick Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                                    <p className="text-2xl font-bold">{user?.preferences?.genres?.length || 0}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Genres</p>
                                </div>
                                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
                                    <p className="text-2xl font-bold">{user?.preferences?.languages?.length || 0}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Langs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content / Right Column */}
                    <div className="w-full md:w-2/3 flex flex-col gap-6">
                        
                        {/* Account Details */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <User size={24} className="text-red-600" /> Account Details
                                </h2>
                                {isEditing && (
                                    <button onClick={handleUpdate} className="text-red-500 hover:text-red-400 font-bold text-sm flex items-center gap-1">
                                        <Save size={16} /> Save
                                    </button>
                                )}
                            </div>

                            <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block">Full Name</label>
                                    {isEditing ? (
                                        <input type="text" value={formData.fullName} 
                                            onChange={(e) => setFormData(p => ({...p, fullName: e.target.value}))}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 transition-all" />
                                    ) : (
                                        <p className="text-sm border border-transparent py-1 font-medium">{user?.fullName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block">Email</label>
                                    <p className="text-sm text-zinc-400 py-1 font-medium">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block">Phone</label>
                                    {isEditing ? (
                                        <input type="text" value={formData.phone} 
                                            onChange={(e) => setFormData(p => ({...p, phone: e.target.value}))}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 transition-all" />
                                    ) : (
                                        <p className="text-sm py-1 font-medium">{user?.phone || 'Not provided'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block">Birth Date</label>
                                    {isEditing ? (
                                        <input type="date" value={formData.birthDate} 
                                            onChange={(e) => setFormData(p => ({...p, birthDate: e.target.value}))}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 transition-all" />
                                    ) : (
                                        <p className="text-sm py-1 font-medium">{user?.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'Not provided'}</p>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Preferences Section */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Settings size={24} className="text-red-600" /> Movie Preferences
                                </h2>
                                <button onClick={() => setShowMoreDetails(!showMoreDetails)} className="text-zinc-500 hover:text-white transition-all">
                                    {showMoreDetails ? <X size={20} /> : <Info size={20} />}
                                </button>
                            </div>

                            <div className="space-y-8">
                                {sections.map(section => (
                                    <div key={section.key}>
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">{section.label}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {isEditing ? (
                                                section.options.map(opt => (
                                                    <button key={opt} 
                                                        onClick={() => handlePreferenceToggle(section.key, opt)}
                                                        className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                                            formData.preferences[section.key]?.includes(opt)
                                                            ? 'bg-red-600 border-red-600 text-white'
                                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                                                        }`}>
                                                        {opt}
                                                    </button>
                                                ))
                                            ) : (
                                                (user?.preferences?.[section.key]?.length > 0) ? (
                                                    user.preferences[section.key].map(opt => (
                                                        <span key={opt} className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-red-500 text-xs font-bold">
                                                            {opt}
                                                        </span>
                                                    ))
                                                ) : <span className="text-zinc-600 text-xs italic">No preferences set</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {showMoreDetails && (
                                <div className="mt-8 pt-8 border-t border-zinc-800 animate-in fade-in duration-300">
                                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">Saved Choices Detail</h4>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/50">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Companions</p>
                                            <p className="text-sm font-medium">{user?.preferences?.watchWith || 'Universal'}</p>
                                        </div>
                                        <div className="bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/50">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Priority Factors</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {user?.preferences?.priorityFactors?.map(f => (
                                                    <span key={f} className="text-zinc-400 text-xs underline decoration-red-600 underline-offset-4">{f}</span>
                                                )) || <span className="text-zinc-600 text-xs">Standard selection</span>}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/50">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">To Avoid</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {user?.preferences?.avoidGenres?.map(g => (
                                                    <span key={g} className="text-red-300/60 text-xs flex items-center gap-1"><X size={10} /> {g}</span>
                                                )) || <span className="text-zinc-600 text-xs">No restrictions</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default ProfilePage;
