import React from 'react';
import MoviesPage from '../components/MoviesPage';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Movie = () => {
  return (
    <div>
        <Navbar />
        <MoviesPage />
        <Footer />
    </div>
  );
};

export default Movie;