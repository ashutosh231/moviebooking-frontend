import React from 'react';
import { useState,useRef,useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {navbarStyles,navbarCSS} from "../assets/dummyStyles"
import { Calendar,LogOut, Clapperboard, Film,X,Menu ,Home, Mail, Ticket,User } from 'lucide-react';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] =useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [userEmail,setUserEmail]=useState("");
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

    const handleLogout = () => {
        localStorage.removeItem('cine_auth');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('cine_user_email');
        setIsLoggedIn(false);
        setUserEmail("");
        window.location.href = '/'; // Redirect to home page after logout
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
                            <button title={userEmail || 'Logout'} onClick={handleLogout} className={navbarStyles.logoutButton}>
                                <LogOut className={navbarStyles.authIcon} />
                                <span>Logout</span>
                            </button>
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
                                <button title={userEmail || 'Logout'} onClick={()=>{setIsMenuOpen(false); handleLogout();}} className={navbarStyles.mobileLogoutButton}>
                                    <LogOut className={navbarStyles.mobileAuthIcon} />
                                    <span>Logout</span>
                                </button>
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

        <style jsx>{navbarCSS}</style>
    </nav>
  );
};

export default Navbar;