import React from 'react';
import { useState,useEffect } from 'react';
import {moviesPageStyles} from "../assets/dummyStyles"
import MOVIES from "../assets/dummymdata"
import { Link } from 'react-router-dom';
const MoviesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const MOVIES_PER_PAGE = 12;
  //const [showAll, setShowAll] = useState(false);
  const movies = MOVIES;
  const filteredMovies = activeCategory === 'all'
    ? movies
    : movies.filter(movie => movie.category === activeCategory);
  //const COLLAPSE_COUNT = 12;

  useEffect(() => {
    //setShowAll(false);
    setCurrentPage(1);
  }, [activeCategory]);

  //const visibleMovies = showAll ? filteredMovies : filteredMovies.slice(0, COLLAPSE_COUNT);

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
      <section className={moviesPageStyles.moviesSection}>
        <div className={moviesPageStyles.moviesContainer}>
          <div className={moviesPageStyles.moviesGrid}>
            {visibleMovies.map(movie=>
              <Link key={movie.id} to={`/movies/${movie.id}`} state={{movie}} className={moviesPageStyles.movieCard}>
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