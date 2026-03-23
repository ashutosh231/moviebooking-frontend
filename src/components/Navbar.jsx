import React from 'react';
import { useState,useRef,useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {navbarStyles,navbarCSS} from "../assets/dummyStyles"
import { Calendar,LogOut, Clapperboard, Film,X,Menu ,Home, Mail, Ticket,User, Search } from 'lucide-react';
import apiClient from '../config/api';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] =useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [userName, setUserName] = useState("");
    const navigate = useNavigate();
    const menuRef = useRef(null);

    useEffect(()=>{
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        }
        window.addEventListener('scroll', handleScroll,{passive:true});// Adding passive:true for better scroll performance
        return () => {
            window.removeEventListener('scroll', handleScroll);
        }
    },[]);//It helps in optimizing the scroll performance by allowing the browser to handle the scroll event more efficiently, without blocking the main thread.

    //Read Auth state from localStorage
    useEffect(()=>{
        const readAuthFromStorage = () => {
        const json=localStorage.getItem('cine_auth');
        const userJson = localStorage.getItem('cine_user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                setUserAvatar(user?.avatar || "");
                setUserName(user?.fullName || "");
            } catch (e) {}
        }


        if(json){
            try{
                const parsed = JSON.parse(json);
                setIsLoggedIn(Boolean(parsed?.isLoggedIn));
                setUserEmail(parsed?.email || "");
            }
            catch(e){
                console.error("Error parsing auth data:",e);
            }
        }

        const simpleFlag=localStorage.getItem('isLoggedIn');
        const email=localStorage.getItem('email') || localStorage.getItem('cine_user_email');
        if(simpleFlag == "true"){
            setIsLoggedIn(true);
            setUserEmail(email || "");
            return;
        }
        if(email){
            setIsLoggedIn(true);
            setUserEmail(email);
            return;
        }
        setIsLoggedIn(false);
        setUserEmail("");
    };
    readAuthFromStorage();
    const onStorage = (e) => {
        if(["cine_auth","isLoggedIn","userEmail","cine_user_email"].includes(e.key)){
            readAuthFromStorage();
        }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    },[]);// This effect reads the authentication state from localStorage when the component mounts and sets up an event listener for storage events. If any of the relevant keys in localStorage change (like 'cine_auth', 'isLoggedIn', 'userEmail', or 'cine_user_email'), it re-reads the authentication state to keep the UI in sync with the stored data.



    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 768 && isMenuOpen) {
                setIsMenuOpen(false);
            }

        };
        const onKey= (e)=>{
            if(e.key === "Escape") setIsMenuOpen(false);
        };
        window.addEventListener('resize', onResize);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('keydown', onKey);
        };
    }, [isMenuOpen]);// This effect listens for window resize events and the Escape key press. If the window is resized to be wider than 768 pixels while the menu is open, it automatically closes the menu. Additionally, if the Escape key is pressed, it also closes the menu. This ensures that the navigation menu behaves responsively and can be easily dismissed by the user.

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
        setIsLoggedIn(false);
        setUserEmail("");
        window.location.href = '/'; // Redirect to home page after logout
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    const navItems=[
        {id:"home",label:"Home",icon:Home,path:"/"},
        {id:"movies",label:"Movies",icon:Film,path:"/movies"},
        {id:"releases",label:"Releases",icon:Calendar,path:"/releases"},
        {id:"contact",label:"Contact",icon:Mail,path:"/contact"},
        {id:"bookings",label:"Bookings",icon:Ticket,path:"/bookings"},
    ];


  return (
    <nav className={`${navbarStyles.nav.base} ${isScrolled ? navbarStyles.nav.scrolled : navbarStyles.nav.notScrolled}`}>
        <div className={navbarStyles.container}>
            <div className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoIconContainer}>
                    <Clapperboard className={navbarStyles.logoIcon} />
                </div>
                <div className={navbarStyles.logoText}>CineVerse</div>
            </div>
            <div className={`${navbarStyles.desktopNav}`}>
                    <div className={navbarStyles.desktopNavItems}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.id} className={navbarStyles.desktopNavItem}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `${navbarStyles.desktopNavLink.base} ${
                                                isActive ? navbarStyles.desktopNavLink.active
                                                : navbarStyles.desktopNavLink.inactive
                                            }`
                                        }
                                    >
                                        <Icon className={navbarStyles.desktopNavIcon} />
                                        <span>{item.label}</span>
                                        <div className="pill-underline"></div>
                                    </NavLink>
                                    <span className="pill-border"> </span>
                                </div>
                            );
                        })}
                    </div>
            </div>

            <div className={navbarStyles.rightSection}>
                {/* Search Bar Desktop */}
                <form onSubmit={handleSearchSubmit} className={navbarStyles.searchContainer}>
                    <Search className={navbarStyles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search movies..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={navbarStyles.searchInput}
                    />
                </form>

                <div className={navbarStyles.tabletNav}>
                    {navItems.map((item)=>{
                        const Icon = item.icon;

                        return (
                            <NavLink key={item.id} to={item.path} end className={({ isActive }) =>
                                `${navbarStyles.tabletNavLink.base} ${isActive ? navbarStyles.tabletNavLink.active : navbarStyles.tabletNavLink.inactive}`
                            }>
                                <Icon className={navbarStyles.tabletNavIcon} />
                                <span className={navbarStyles.tabletNavText}>{item.label}</span>
                            </NavLink>
                        )
                    })}
                </div>

                {/* Auth Section */}
                <div className={navbarStyles.authSection}>
                    <div className={navbarStyles.desktopAuth}>
                        {isLoggedIn ? (
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-full pl-1 pr-4 py-1 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white scale-90 overflow-hidden">
                                        {userAvatar ? (
                                            <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-200">{userName ? userName.split(' ')[0] : userEmail.split('@')[0]}</span>
                                </button>



                                
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-48 bg-black border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <NavLink to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
                                            <User size={16} className="text-red-500" />
                                            <span>My Profile</span>
                                        </NavLink>
                                        <NavLink to="/bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
                                            <Ticket size={16} className="text-red-500" />
                                            <span>My Bookings</span>
                                        </NavLink>
                                        <div className="h-px bg-zinc-800 my-1 mx-2"></div>
                                        <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <a href="/login" className={navbarStyles.loginButton}>
                                <User className={navbarStyles.authIcon} />
                                <span>Login</span>
                            </a>
                        )}
                    </div>

                    {/*toggle function*/}
                    <div className={navbarStyles.mobileMenuToggle} >
                        <button onClick={() => setIsMenuOpen((s) => !s)} className={navbarStyles.mobileMenuButton}>
                            {isMenuOpen ? (
                                <X className={navbarStyles.mobileMenuIcon} />
                            ) : (
                                <Menu className={navbarStyles.mobileMenuIcon} />
                            )}
                        </button>
                    </div>

                </div>


            </div>

            {isMenuOpen && (
                <div ref={menuRef} className={navbarStyles.mobileMenuPanel}>
                    {/* Search Bar Mobile */}
                    <form onSubmit={handleSearchSubmit} className={navbarStyles.mobileSearchContainer}>
                        <Search className={navbarStyles.mobileSearchIcon} />
                        <input 
                            type="text" 
                            placeholder="Search movies..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={navbarStyles.mobileSearchInput}
                        />
                    </form>

                    <div className={navbarStyles.mobileMenuItems}>
                        {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink key={item.id} to={item.path} end onClick={() => setIsMenuOpen(false)} className={({ isActive }) =>
                                `${navbarStyles.mobileNavLink.base} ${isActive ? navbarStyles.mobileNavLink.active : navbarStyles.mobileNavLink.inactive}`
                            }>
                                <Icon className={navbarStyles.mobileNavIcon} />
                                <span className={navbarStyles.mobileNavText}>{item.label}</span>
                            </NavLink>
                        );
                        })}

                        <div className={navbarStyles.mobileAuthSection}>
                            {isLoggedIn ? (
                                <>
                                    <NavLink to="/profile" onClick={() => setIsMenuOpen(false)} className={({ isActive }) =>
                                        `${navbarStyles.mobileNavLink.base} ${isActive ? navbarStyles.mobileNavLink.active : navbarStyles.mobileNavLink.inactive}`
                                    }>
                                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white overflow-hidden mr-1">
                                            {userAvatar ? (
                                                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={14} />
                                            )}
                                        </div>
                                        <span className={navbarStyles.mobileNavText}>{userName ? userName.split(' ')[0] : "My Profile"}</span>
                                    </NavLink>



                                    <button title={userEmail || 'Logout'} onClick={()=>{setIsMenuOpen(false); handleLogout();}} className={navbarStyles.mobileLogoutButton}>
                                        <LogOut className={navbarStyles.mobileAuthIcon} />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <a href="/login" onClick={() => setIsMenuOpen(false)} className={navbarStyles.mobileLoginButton}>
                                    <User className={navbarStyles.mobileAuthIcon} />
                                    <span>Login</span>
                                </a>
                            )}
                        </div>


                    </div>
                </div>
            )}
        </div>

        <style>{navbarCSS}</style>
    </nav>
  );
};

export default Navbar;