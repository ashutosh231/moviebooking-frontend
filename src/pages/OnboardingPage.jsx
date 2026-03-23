import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { 
  Film, Languages, Users, Sparkles, Clock, 
  Target, Ban, ArrowRight, CheckCircle2, ChevronRight 
} from 'lucide-react';
import apiClient from '../config/api';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState({
        genres: [],
        languages: [],
        watchWith: '',
        experience: [],
        showTimings: [],
        priorityFactors: [],
        avoidGenres: []
    });

    const totalSteps = 7;

    const genreOptions = ['Action', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-fi', 'Drama', 'Family'];
    const languageOptions = ['Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Other'];
    const watchWithOptions = ['Solo', 'Friends', 'Family', 'Partner'];
    const experienceOptions = ['Fun', 'Emotional', 'Suspenseful', 'Mind-bending', 'Relaxing', 'Family-friendly'];
    const timingOptions = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const priorityOptions = ['Genre', 'Ratings', 'Cast', 'Reviews', 'Language', 'Ticket Price', 'Show Timing'];
    const avoidOptions = ['Horror', 'Violence-heavy', 'Slow drama', 'Sad endings'];

    const toggleMultiSelect = (field, val) => {
        setPreferences(prev => {
            const current = prev[field];
            if (current.includes(val)) {
                return { ...prev, [field]: current.filter(item => item !== val) };
            } else {
                return { ...prev, [field]: [...current, val] };
            }
        });
    };

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else handleSubmit();
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            await apiClient.put('/api/auth/profile', { onboardingCompleted: true });
            toast.success("Welcome to CineVerse!");
            setTimeout(() => navigate('/'), 1200);
        } catch (err) {
            toast.error("Something went wrong. Let's try again.");
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await apiClient.put('/api/auth/profile', { 
                preferences, 
                onboardingCompleted: true 
            });
            toast.success("Preferences saved! Personalized feed ready.");
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            toast.error("Failed to save preferences. Please try again.");
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                <Film size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Favorite Genres?</h2>
                        </div>
                        <p className="text-gray-400 mb-8">Which genres do you enjoy the most? (Multiple allowed)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {genreOptions.map(g => (
                                <button key={g} onClick={() => toggleMultiSelect('genres', g)}
                                    className={`py-3 px-4 rounded-xl border transition-all duration-200 text-sm font-medium ${
                                        preferences.genres.includes(g) 
                                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/20' 
                                        : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700 hover:text-gray-200'
                                    }`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                <Languages size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Preferred Languages?</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {languageOptions.map(l => (
                                <button key={l} onClick={() => toggleMultiSelect('languages', l)}
                                    className={`py-3 px-4 rounded-xl border transition-all duration-200 text-sm font-medium ${
                                        preferences.languages.includes(l) 
                                        ? 'bg-red-600 border-red-600 text-white' 
                                        : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                                    }`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                <Users size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Movie Logic?</h2>
                        </div>
                        <p className="text-gray-400 mb-8">Who do you usually watch movies with?</p>
                        <div className="space-y-3">
                            {watchWithOptions.map(w => (
                                <button key={w} onClick={() => setPreferences(p => ({...p, watchWith: w}))}
                                    className={`w-full text-left py-4 px-6 rounded-xl border transition-all duration-200 flex justify-between items-center ${
                                        preferences.watchWith === w 
                                        ? 'bg-red-600/10 border-red-600 text-white' 
                                        : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                                    }`}>
                                    <span className="font-medium">{w}</span>
                                    {preferences.watchWith === w && <CheckCircle2 size={20} className="text-red-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                <Sparkles size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Experience?</h2>
                        </div>
                        <p className="text-gray-400 mb-8">What experience do you usually look for?</p>
                        <div className="grid grid-cols-2 gap-3">
                            {experienceOptions.map(e => (
                                <button key={e} onClick={() => toggleMultiSelect('experience', e)}
                                    className={`py-3 px-4 rounded-xl border transition-all duration-200 text-sm font-medium ${
                                        preferences.experience.includes(e) 
                                        ? 'bg-red-600 border-red-600 text-white' 
                                        : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                                    }`}>
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                <Clock size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Best Timings?</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {timingOptions.map(t => (
                                <button key={t} onClick={() => toggleMultiSelect('showTimings', t)}
                                    className={`py-3 px-4 rounded-xl border transition-all duration-200 text-sm font-medium ${
                                        preferences.showTimings.includes(t) 
                                        ? 'bg-red-600 border-red-600 text-white' 
                                        : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                                    }`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                <Target size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Key Factors?</h2>
                        </div>
                        <p className="text-gray-400 mb-8">What matters most when choosing a movie?</p>
                        <div className="flex flex-wrap gap-2">
                            {priorityOptions.map(p => (
                                <button key={p} onClick={() => toggleMultiSelect('priorityFactors', p)}
                                    className={`py-2 px-4 rounded-full border transition-all duration-200 text-xs font-semibold ${
                                        preferences.priorityFactors.includes(p) 
                                        ? 'bg-red-600 border-red-600 text-white' 
                                        : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                                    }`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                <Ban size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Avoid List?</h2>
                        </div>
                        <p className="text-gray-400 mb-8">Any genres you want to avoid?</p>
                        <div className="space-y-3">
                            {avoidOptions.map(a => (
                                <button key={a} onClick={() => toggleMultiSelect('avoidGenres', a)}
                                    className={`w-full text-left py-4 px-6 rounded-xl border transition-all duration-200 flex justify-between items-center ${
                                        preferences.avoidGenres.includes(a) 
                                        ? 'bg-zinc-800 border-red-600/50 text-red-400' 
                                        : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'
                                    }`}>
                                    <span className="font-medium">{a}</span>
                                    {preferences.avoidGenres.includes(a) && <div className="w-2 h-2 rounded-full bg-red-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 sm:p-12 font-sans overflow-hidden">
            <ToastContainer theme="dark" position="top-right" />
            
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/30 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-xl z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-3">
                        Help us <span className="text-red-500">personalize</span>
                    </h1>
                    <p className="text-gray-400">your movie experience on CineVerse</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mb-12 overflow-hidden flex">
                    {[...Array(totalSteps)].map((_, i) => (
                        <div key={i} className={`h-full transition-all duration-500 ${
                            i + 1 <= step ? 'bg-red-600' : 'bg-transparent'
                        }`} style={{ width: `${100/totalSteps}%` }} />
                    ))}
                </div>

                <div className="bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 p-8 sm:p-10 rounded-3xl shadow-2xl min-h-[420px] flex flex-col">
                    <div className="flex-grow">
                        {renderStep()}
                    </div>

                    <div className="mt-12 flex items-center justify-between gap-4">
                        <button onClick={handleSkip} disabled={loading} className="text-gray-400 hover:text-white text-sm font-semibold transition-colors disabled:opacity-50">
                            Skip for now
                        </button>
                        
                        <div className="flex gap-3">
                            {step > 1 && (
                                <button onClick={() => setStep(step - 1)} disabled={loading}
                                    className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-all disabled:opacity-50">
                                    <ArrowRight className="rotate-180" size={20} />
                                </button>
                            )}
                            <button onClick={handleNext} disabled={loading}
                                className="py-4 px-8 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50">
                                {loading ? 'Saving...' : (step === totalSteps ? 'Get Started' : 'Continue')}
                                {!loading && <ChevronRight size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-zinc-600 text-xs mt-8">
                    Step {step} of {totalSteps} • Your choices help us recommend better movies
                </p>
            </div>
        </div>
    );
};

export default OnboardingPage;
