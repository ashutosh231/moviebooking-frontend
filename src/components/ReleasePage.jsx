import React, { useState } from 'react';
import { releasesStyles } from '../assets/dummyStyles';
import movies from '../assets/dummyrdata';

const ReleasePage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const MOVIES_PER_PAGE = 10;

  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);

  const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
  const endIndex = startIndex + MOVIES_PER_PAGE;

  const visibleMovies = movies.slice(startIndex, endIndex);

  return (
    <div className={releasesStyles.pageContainer}>
      <div className={releasesStyles.headerContainer}>
        <h1 className={releasesStyles.headerTitle}>RELEASES SOON</h1>
        <p className={releasesStyles.headerSubtitle}>
          Latest Movies • Now Showing
        </p>
      </div>

      <div className={releasesStyles.movieGrid}>
        {visibleMovies.map((movie) => (
          <div key={movie.id} className={releasesStyles.movieCard}>
            <div className={releasesStyles.imageContainer}>
              <img
                src={movie.image}
                alt={movie.title}
                className={releasesStyles.movieImage}
              />
            </div>
            <div className={releasesStyles.movieInfo}>
              <h3 className={releasesStyles.movieTitle}>{movie.title}</h3>
              <p className={releasesStyles.movieCategory}>
                {movie.category}
              </p>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2 rounded bg-gray-800 disabled:opacity-40"
          >
            Prev
          </button>

          <span className="text-gray-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages}
            className="px-5 py-2 rounded bg-red-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReleasePage;