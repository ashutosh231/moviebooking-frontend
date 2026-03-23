import React, { useState, useEffect } from 'react';
import { moviesStyles } from "../assets/dummyStyles"
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const Movies = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchFeatured() {
      try {
        const res = await axios.get(`${API_BASE}/api/movies`, { params: { limit: 50 } });
        const data = res.data;
        const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];

        // Show featured movies first, then normal — pick first 6
        const sorted = items
          .filter(m => m.type === 'featured' || m.type === 'normal')
          .sort((a, b) => (a.type === 'featured' ? -1 : 1) - (b.type === 'featured' ? -1 : 1));

        const resolveImg = (val) => {
          if (!val) return '';
          if (val.startsWith('http')) return val;
          return `${API_BASE}/uploads/${val}`;
        };

        const mapped = sorted.slice(0, 6).map(m => ({
          id: m._id || m.id,
          title: m.movieName || m.title || m.displayTitle || 'Untitled',
          img: m.thumbnail || resolveImg(m.poster) || '',
          category: (m.categories && m.categories[0]) ? m.categories[0].toLowerCase() : 'action',
        }));

        if (!cancelled) setMovies(mapped);
      } catch (err) {
        console.error('Failed to fetch featured movies:', err);
      }
    }
    fetchFeatured();
    return () => { cancelled = true; };
  }, []);

  const visibleMovies = movies.slice(0, 6);

  return (
    <div>
      <section className={moviesStyles.container}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&display=swap');
        `}</style>
        <h2 style={{ fontFamily: 'Dancing Script, cursive' }} className={moviesStyles.title}>Featured Movies</h2>

        <div className={moviesStyles.grid}>
          {visibleMovies.map((movie) => (
            <article key={movie.id} className={moviesStyles.movieArticle}>
              <Link to={`/movie/${movie.id}`} className={moviesStyles.movieLink}>
                <img src={movie.img} alt={movie.title} loading="lazy" className={moviesStyles.movieImage} />
              </Link>
              <div className={moviesStyles.movieInfo}>
                <div className={moviesStyles.titleContainer}>
                  <Ticket className={moviesStyles.ticketsIcon} />
                  <span id={`movie-title-${movie.id}`} className={moviesStyles.movieTitle} style={{ fontFamily: 'Pacifico, cursive' }}>{movie.title}</span>
                </div>
                <div className={moviesStyles.categoryContainer}>
                  <span className={moviesStyles.categoryText}>{movie.category}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Movies;