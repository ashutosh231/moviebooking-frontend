import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Clapperboard, X, Menu, User, Search, MapPin, ChevronDown, Calendar, Film, Home, Mail, Ticket } from 'lucide-react';
import apiClient from '../config/api';
import LocationModal from './LocationModal';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [userName, setUserName] = useState("");
    
    // Location state
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    const navigate = useNavigate();
    const userMenuRef = useRef(null);
    const searchFormRef = useRef(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auth state map
    useEffect(() => {
        const readAuthFromStorage = () => {
            const json = localStorage.getItem('cine_auth');
            const userJson = localStorage.getItem('cine_user');
            
            if (userJson) {
                try {
                    const user = JSON.parse(userJson);
                    setUserAvatar(user?.avatar || "");
                    setUserName(user?.fullName || "");
                } catch {
                    setUserAvatar("");
                    setUserName("");
                }
            }

            const simpleFlag = localStorage.getItem('isLoggedIn');
            const email = localStorage.getItem('email') || localStorage.getItem('cine_user_email');
            
            if (simpleFlag === "true" || email || json) {
                setIsLoggedIn(true);
                setUserEmail(email || "");
            } else {
                setIsLoggedIn(false);
                setUserEmail("");
            }
        };

        readAuthFromStorage();

        const onStorage = (e) => {
            if (["cine_auth", "isLoggedIn", "userEmail", "cine_user_email", "cine_user"].includes(e.key)) {
                readAuthFromStorage();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Read Location
    useEffect(() => {
        const loadLoc = () => {
            const locJson = localStorage.getItem('cine_location');
            if (locJson) {
                try {
                    setSelectedLocation(JSON.parse(locJson));
                } catch {
                    setSelectedLocation(null);
                }
            }
        };
        loadLoc();
        window.addEventListener('storage', loadLoc);
        return () => window.removeEventListener('storage', loadLoc);
    }, []);

    // Resize and Click Outside listener for menus
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 1024 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        const onEsc = (e) => {
            if (e.key === "Escape") {
                setIsUserMenuOpen(false);
                setIsMenuOpen(false);
            }
        }
        window.addEventListener('resize', onResize);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', onEsc);
        return () => {
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', onEsc);
        };
    }, [isMenuOpen]);

    const handleLogout = async () => {
        try {
            await apiClient.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        }
        localStorage.removeItem('cine_auth');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('cine_user_email');
        localStorage.removeItem('cine_user');
        setIsLoggedIn(false);
        setUserEmail("");
        setUserName("");
        setUserAvatar("");
        window.location.href = '/'; 
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    const navItems = [
        { id: "home", label: "Home", icon: Home, path: "/" },
        { id: "movies", label: "Movies", icon: Film, path: "/movies" },
        { id: "releases", label: "Releases", icon: Calendar, path: "/releases" },
        { id: "bookings", label: "Bookings", icon: Ticket, path: "/bookings" },
        { id: "contact", label: "Contact", icon: Mail, path: "/contact" },
    ];

    return (
        <nav className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
            isScrolled 
                ? 'py-3 lg:py-3.5 bg-black/85 backdrop-blur-lg border-b border-zinc-800 shadow-2xl' 
                : 'py-5 lg:py-6 bg-gradient-to-b from-black/90 to-transparent'
        }`}>
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex flex-col">
                    {/* TOP ROW: Logo, Desktop Nav, Right Items */}
                    <div className="flex items-center justify-between gap-4 lg:gap-8">
                        
                        {/* LEFT SECTION: Logo & Desktop Location */}
                        <div className="flex items-center gap-6 flex-shrink-0">
                            <NavLink to="/" className="flex items-center gap-2 group outline-none">
                                <div className="p-2 bg-gradient-to-br from-red-600 to-red-800 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-md shadow-red-900/20">
                                    <Clapperboard className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-[pacifico] tracking-wider">CineVerse</span>
                            </NavLink>
                            
                            {/* Location Chip - Hidden on Mobile */}
                            <button 
                                onClick={() => setIsLocationModalOpen(true)}
                                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 transition-colors text-sm group"
                            >
                                <MapPin size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-gray-300 max-w-[120px] truncate">
                                    {selectedLocation?.city || "Select Location"}
                                </span>
                                <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* MIDDLE SECTION: Navigation Links (Desktop/Tablet Large) */}
                        <div className="hidden lg:flex flex-1 justify-center items-center">
                            <div className="flex items-center gap-1.5 bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.id}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `relative px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                                isActive 
                                                    ? 'text-white bg-zinc-800/80 shadow-md shadow-black/20' 
                                                    : 'text-gray-400 hover:text-white hover:bg-zinc-800/40'
                                            }`
                                        }
                                    >
                                        <span className="relative z-10">{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT SECTION: Search & Auth */}
                        <div className="flex items-center justify-end gap-3 flex-shrink-0">
                            
                            {/* Desktop Search */}
                            <form ref={searchFormRef} onSubmit={handleSearchSubmit} className="hidden md:flex relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors z-10" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="peer w-40 lg:w-48 focus:w-64 xl:focus:w-72 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 focus:border-red-500/50 text-white text-sm rounded-full pl-9 pr-4 py-2 outline-none transition-all duration-300 placeholder:text-gray-500 shadow-inner"
                                />
                            </form>

                            {/* Mobile Header Icons: Search + Menu */}
                            <div className="md:hidden flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        setIsMenuOpen(true);
                                        setTimeout(() => document.getElementById('mobile-search')?.focus(), 100);
                                    }} 
                                    className="p-2 text-gray-300 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <Search size={22} />
                                </button>
                            </div>

                            {/* Auth Section - Desktop */}
                            <div className="hidden md:block">
                                {isLoggedIn ? (
                                    <div className="relative" ref={userMenuRef}>
                                        <button 
                                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 transition-all text-sm group"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                                                {userAvatar ? (
                                                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-200">
                                                {userName ? userName.split(' ')[0] : userEmail?.split('@')[0]}
                                            </span>
                                            <ChevronDown size={14} className={`text-gray-500 group-hover:text-white transition-all duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isUserMenuOpen && (
                                            <div className="absolute right-0 mt-3 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.8)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                                                    <p className="text-sm font-semibold text-white truncate">{userName || "My Account"}</p>
                                                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                                </div>
                                                <NavLink to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-zinc-800/50 transition-colors">
                                                    <User size={16} className="text-red-500 flex-shrink-0" />
                                                    My Profile
                                                </NavLink>
                                                <NavLink to="/bookings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-zinc-800/50 transition-colors">
                                                    <Ticket size={16} className="text-red-500 flex-shrink-0" />
                                                    My Bookings
                                                </NavLink>
                                                <div className="h-px bg-zinc-800/50 my-2 mx-4"></div>
                                                <button onClick={() => { setIsUserMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                    <LogOut size={16} className="flex-shrink-0" />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <NavLink to="/login" className="flex items-center gap-2 px-6 py-2 rounded-full bg-white text-black font-semibold hover:bg-red-600 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
                                        <User size={16} />
                                        Login
                                    </NavLink>
                                )}
                            </div>

                            {/* Mobile Hamburger */}
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                className="lg:hidden p-2 rounded-full bg-zinc-900/80 text-gray-300 hover:text-white border border-zinc-800 transition-colors"
                            >
                                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Only: Location Chip row (visible if menu closed or always beneath header) */}
                    <div className={`${isMenuOpen ? 'hidden' : 'flex'} lg:hidden mt-4 justify-center`}>
                        <button 
                            onClick={() => setIsLocationModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 transition-colors max-w-sm"
                        >
                            <MapPin size={16} className="text-red-500" />
                            <span className="text-sm font-medium text-gray-300">
                                {selectedLocation?.city || "Select Your Location"}
                            </span>
                            <ChevronDown size={14} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer Overlay */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Mobile Navigation Menu Panel */}
            <div className={`fixed top-0 right-0 h-full w-[85vw] sm:w-[350px] bg-zinc-950 border-l border-zinc-800 z-50 transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-600 rounded-lg">
                            <Clapperboard className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-[pacifico]">Menu</span>
                    </div>
                    <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 rounded-full bg-zinc-900 text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearchSubmit} className="relative mb-8 md:hidden">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input 
                            id="mobile-search"
                            type="text" 
                            placeholder="Search movies..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-red-500 focus:bg-zinc-800 transition-all text-sm font-medium"
                        />
                    </form>

                    {/* Nav Links */}
                    <div className="flex flex-col gap-2 mb-8">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Navigation</h3>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink 
                                    key={item.id} 
                                    to={item.path} 
                                    onClick={() => setIsMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all ${
                                            isActive 
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                                : 'text-gray-300 hover:bg-zinc-900 hover:text-white border border-transparent'
                                        }`
                                    }
                                >
                                    <Icon size={18} className="opacity-80" />
                                    {item.label}
                                </NavLink>
                            )
                        })}
                    </div>
                </div>

                {/* Mobile Auth Footer */}
                <div className="p-5 border-t border-zinc-800 bg-zinc-950">
                    {isLoggedIn ? (
                        <div className="flex flex-col gap-3">
                            <NavLink 
                                to="/profile" 
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-gray-200 hover:text-white transition-colors font-medium"
                            >
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white overflow-hidden shadow-inner flex-shrink-0">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="truncate text-sm font-bold">{userName || "Profile"}</span>
                                    {userEmail && <span className="truncate text-xs text-zinc-500">{userEmail}</span>}
                                </div>
                            </NavLink>
                            <button 
                                onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-zinc-900 text-red-400 font-semibold hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 transition-all"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <NavLink 
                            to="/login" 
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white text-black font-bold hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <User size={18} />
                            Login to Account
                        </NavLink>
                    )}
                </div>
            </div>

            <LocationModal 
                isOpen={isLocationModalOpen} 
                onClose={() => setIsLocationModalOpen(false)} 
                onLocationSelect={(loc) => setSelectedLocation(loc)} 
            />
        </nav>
    );
};

export default Navbar;