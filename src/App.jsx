import React from 'react'
import { Routes,Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Movie from './pages/Movie'
import Release from './pages/Release'
import Booking from './pages/Booking'
import Contact from './pages/Contact'
import MovieDetailPage from './pages/MovieDetailPage'
import MovieDetailPageHome from './pages/MovieDetailPageHome'
import SeatSelector from './pages/SeatSelector'
import SeatSelectorPageHome from './components/SeatSelectorPageHome'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/ProfilePage'
import CinemaSelectionPage from './pages/CinemaSelectionPage'
import AIChatPopup from './components/AIChatPopup'
import ProtectedRoute from './components/ProtectedRoute'
import { useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from './config/api';


/**
 * ScrollToTop component:
 * - Forces an immediate jump to the very top on every navigation.
 * - If URL has a hash, it will try to jump to that element (also immediately).
 * - Disables browser's automatic scroll restoration to avoid the browser restoring previous positions.
 */
function ScrollToTop() {
  const location = useLocation();

  // Disable browser auto scroll restoration (do once)
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // If there's a hash (e.g. /page#section), try to jump to that element
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id) || document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start", inline: "nearest" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        return;
      }
    }

    // Force immediate top-of-page
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function App() {
  // Ensure no horizontal overflow on the root document (defensive)
  useEffect(() => {
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    const prevBodyOverflowX = document.body.style.overflowX;

    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";

    return () => {
      // restore previous values just in case other scripts rely on them
      document.documentElement.style.overflowX = prevHtmlOverflowX;
      document.body.style.overflowX = prevBodyOverflowX;
    };
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  // Onboarding Check
  useEffect(() => {
    const checkOnboarding = async () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn && !['/onboarding', '/login', '/signup'].includes(location.pathname)) {
        try {
          const res = await apiClient.get('/api/auth/profile');
          if (res.data.user && res.data.user.onboardingCompleted === false) {
            navigate('/onboarding');
          }
        } catch (err) {
          console.error("Onboarding check failed:", err);
        }
      }
    };
    checkOnboarding();
  }, [location.pathname, navigate]);

  return (
    <>
      <ScrollToTop />
      
      <div className="min-h-screen w-full overflow-x-hidden">
        <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/onboarding' element={<OnboardingPage />} />
        <Route path='/profile' element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path='/movies' element={<Movie />} />
        <Route path='/releases' element={<Release />} />
        <Route path='/bookings' element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/movies/:id' element={<MovieDetailPage />} />
        <Route path='/movie/:id' element={<MovieDetailPageHome />} />
        <Route path='/movies/:id/cinemas/:slot' element={<CinemaSelectionPage />} />
        <Route path='/movie/:id/cinemas/:slot' element={<CinemaSelectionPage />} />
        <Route path='/movies/:id/seat/:slot' element={<SeatSelector />} />
        <Route path='/movies/:id/seat-selector/:slot' element={<SeatSelector />} />


        <Route path='/movie/:id/seat/:slot' element={<SeatSelectorPageHome />} />
        <Route path='/movie/:id/seat-selector/:slot' element={<SeatSelectorPageHome />} />
      </Routes>
      <AIChatPopup />
      </div>
    </>
  )
}



export default App
