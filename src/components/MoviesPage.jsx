import React from 'react';
import { useState, useEffect } from 'react';
import { moviesPageStyles } from "../assets/dummyStyles"
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const MoviesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const MOVIES_PER_PAGE = 12;
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch movies from API
  useEffect(() => {
    let cancelled = false;
    async function fetchMovies() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/movies`, { params: { limit: 200 } });
        const data = res.data;
        const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];

        // Map API shape -> component shape
        const mapped = items
          .filter(m => m.type === 'normal' || m.type === 'featured')
          .map(m => {
            // Resolve poster URL: thumbnail is pre-resolved by backend, poster may be just a filename
            const resolveImg = (val) => {
              if (!val) return '';
              if (val.startsWith('http')) return val;
              return `${API_BASE}/uploads/${val}`;
            };
            const image = m.thumbnail || resolveImg(m.poster) || '';
            return {
              id: m._id || m.id,
              title: m.movieName || m.title || m.displayTitle || 'Untitled',
              image,
              category: (m.categories && m.categories[0]) ? m.categories[0].toLowerCase() : 'action',
              duration: m.duration ? `${Math.floor(m.duration / 60)}h ${m.duration % 60}m` : '',
              rating: m.rating || 0,
              genre: (m.categories || []).join(' / '),
              price: m.seatPrices?.standard || 250,
              synopsis: m.story || m.description || '',
              director: (m.directors || []).map(d => ({ name: d.name || '', img: d.preview || d.file || '' })),
              producer: (m.producers || [])[0] ? { name: m.producers[0].name || '', img: m.producers[0].preview || m.producers[0].file || '' } : { name: '', img: '' },
              cast: (m.cast || []).map(c => ({ name: c.name || '', role: c.role || '', img: c.preview || c.file || '' })),
              slots: (m.slots || []).map(s => ({
                time: s.date && s.time ? `${s.date}T${s.time}:00+05:30` : '',
                audi: m.auditorium || 'Audi 1',
              })),
              trailer: m.trailerUrl || '',
              _raw: m,
            };
          });

        if (!cancelled) setMovies(mapped);
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMovies();
    return () => { cancelled = true; };
  }, []);

  const filteredMovies = movies.filter(movie => {
    const matchesCategory = activeCategory === 'all' || movie.category === activeCategory;
    const matchesSearch = searchQuery === '' || movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const categories = [
    { id: 'all', name: 'All Movies' },
    { id: 'action', name: 'Action' },
    { id: 'horror', name: 'Horror' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'adventure', name: 'Adventure' }
  ];
  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);

  const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
  const endIndex = startIndex + MOVIES_PER_PAGE;

  const visibleMovies = filteredMovies.slice(startIndex, endIndex);

  return (
    <div className={moviesPageStyles.container}>
      <section className={moviesPageStyles.categoriesSection}>
        <div className={moviesPageStyles.categoriesContainer}>
          <div className={moviesPageStyles.categoriesFlex}>
            {categories.map(category => (
              <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`${moviesPageStyles.categoryButton.base} ${activeCategory === category.id ? moviesPageStyles.categoryButton.active : moviesPageStyles.categoryButton.inactive}`}>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {searchQuery && (
        <div className="flex justify-center mt-4 px-4">
          <h2 className="text-xl md:text-2xl text-white font-semibold flex items-center gap-2">
            Search Results for <span className="text-red-500 font-[pacifico]">"{searchQuery}"</span>
          </h2>
        </div>
      )}

      <section className={moviesPageStyles.moviesSection}>
        <div className={moviesPageStyles.moviesContainer}>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-gray-400 text-lg">Loading movies...</div>
            </div>
          ) : (
            <div className={moviesPageStyles.moviesGrid}>
              {visibleMovies.map(movie =>
                <Link key={movie.id} to={`/movies/${movie.id}`} state={{ movie }} className={moviesPageStyles.movieCard}>
                  <div className={moviesPageStyles.movieImageContainer}>
                    <img src={movie.image} alt={movie.title} className={moviesPageStyles.movieImage} />
                  </div>
                  <div className={moviesPageStyles.movieInfo}>
                    <h3 className={moviesPageStyles.movieTitle}>{movie.title}</h3>
                    <div className={moviesPageStyles.movieCategory}>
                      <span className={moviesPageStyles.movieCategoryText}>{movie.category}</span>
                    </div>
                  </div>
                </Link>
              )}
              {filteredMovies.length === 0 && (
                <div className={moviesPageStyles.emptyState}>
                  No movies found in this category.
                </div>
              )}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button
                onClick={() =>
                  setCurrentPage(prev => (prev === 1 ? totalPages : prev - 1))
                }
                className="px-5 py-2 rounded bg-gray-800"
              >
                Prev
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(prev => (prev === totalPages ? 1 : prev + 1))
                }
                className="px-5 py-2 rounded bg-red-600"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MoviesPage;