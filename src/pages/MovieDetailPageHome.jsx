import React from 'react';
import {movieDetailHStyles} from '../assets/dummyStyles';
import movies from '../assets/dummymoviedata';
import { useMemo, useState,useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, Clock, Star, Users, Play, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';
const ROWS = [
  { id: "A", type: "standard", count: 8 },
  { id: "B", type: "standard", count: 8 },
  { id: "C", type: "standard", count: 8 },
  { id: "D", type: "recliner", count: 8 },
  { id: "E", type: "recliner", count: 8 },
];

const TOTAL_SEATS = ROWS.reduce((s, r) => s + r.count, 0);

const FallbackAvatar = ({ className = "w-12 h-12", alt= "avatar" }) => (
  <div
    className={`${className} bg-gray-700 rounded-full flex items-center justify-center text-sm text-gray-300`}
    aria-hidden="true"
  >
    ?
  </div>
);

/** Utility: extract a YouTube ID from either an ID or a full URL */
function extractYouTubeId(urlOrId) {
  if (!urlOrId) return null;
  if (/^[A-Za-z0-9_-]{6,}$/.test(urlOrId)) return urlOrId;

  const re =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;
  const m = urlOrId.match(re);
  return m ? m[1] : null;
}

/** Builds embed URL with autoplay and minimal related-video noise */
const getEmbedUrl = (id) =>
  id
    ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
    : null;

/**
 * Helpers to format dates/times in a target timezone using Intl.formatToParts.
 */
const getParts = (dateLike, timeZone) => {
  const dt = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(dt);

  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  map.dayPeriod = map.dayPeriod || map.ampm || map.AMPM || map.ampm;
  return map;
};

/** Returns date key 'YYYY-MM-DD' for the given date/ISO in given timezone */
const formatDateKey = (dateLike, timeZone = "Asia/Kolkata") => {
  const p = getParts(dateLike, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
};

/** Returns a human time string like "1:30 PM" (12-hour) for the given ISO in timezone */
const formatTimeInTZ = (dateLike, timeZone = "Asia/Kolkata") => {
  const p = getParts(dateLike, timeZone);
  const hour = String(Number(p.hour));
  return `${hour}:${p.minute} ${String(
    p.dayPeriod ?? p.ampm ?? ""
  ).toUpperCase()}`;
};



const MovieDetailPageHome = () => {
  const { id } = useParams();
    const movieId = Number(id);
    const movie = useMemo(() => movies.find((m) => m.id === movieId), [movieId]);
    const navigate = useNavigate();
    const location = useLocation();

    // Trailer-related state
    const [showTrailer, setShowTrailer] = useState(false);
    const [selectedTrailerId, setSelectedTrailerId] = useState(null);
    const [selectedMovie, setSelectedMovie] = useState(null);

    const [selectedDay, setSelectedDay] = useState(0);
    const [selectedTime, setSelectedTime] = useState(null);

    useEffect(() => {// Redirect to home if movie not found
            if (!movie) {
                toast.error('Movie not found.');
            }
        }, [movie]);

    const showtimeDays = useMemo(() => {
    if (!movie) return [];

    const TZ = "Asia/Kolkata";
    const slotsByDate = {};

    (movie.slots || []).forEach((raw) => {
      let iso = null;
      let audi = "Audi 1";

      if (!raw) return;

      if (typeof raw === "string") {
        iso = raw;
        audi = "Audi 1";
      } else if (typeof raw === "object" && raw.time) {
        iso = raw.time;
        audi = raw.audi ?? "Audi 1";
      } else {
        return;
      }

      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return;

      const dateKey = formatDateKey(d, TZ);
      if (!slotsByDate[dateKey]) slotsByDate[dateKey] = [];
      slotsByDate[dateKey].push({ iso, audi });
    });

      const dateKeys = Object.keys(slotsByDate).sort();

    const days = dateKeys.map((key) => {
      const [yy, mm, dd] = key.split("-").map(Number);
      const asDate = new Date(Date.UTC(yy, mm - 1, dd));
      const dayName = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: TZ,
      }).format(asDate);
      const shortDay = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: TZ,
      }).format(asDate);
      const dateStr = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: TZ,
      }).format(asDate);

      const rawSlots = slotsByDate[key] || [];

      const showtimes = rawSlots
        .map(({ iso, audi }) => {
          const d = new Date(iso);
          if (Number.isNaN(d.getTime())) return null;
          const timeLabel = formatTimeInTZ(iso, TZ);
          return {
            time: timeLabel,
            datetime: iso,
            timestamp: d.getTime(),
            audi: audi,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ time, datetime, audi }) => ({ time, datetime, audi }));

      return {
        date: key,
        dayName,
        shortDay,
        dateStr,
        showtimes,
      };
    });

    return days;
  }, [movie]);

  //Ensure selectedDay is valid whenever showtimeDays changes
      useEffect(() => {
          if (showtimeDays.length === 0) {
              setSelectedDay(0);
              setSelectedTime(null);
              return;
          }
          setSelectedDay((curr) => {
              const newIndex=curr >= 0 && curr < showtimeDays.length ? curr : 0;
              return newIndex;
          });
          setSelectedTime(null);
      }, [showtimeDays]);

        // Trailer open/close handlers
        const openTrailer = (movieObj) => {
          const idFromField = movieObj?.trailerId ?? null;
          const id = idFromField || extractYouTubeId(movieObj?.trailer || "");
          if (!id) {
            toast.info("Trailer not available for this movie.");
            return;
          }
          setSelectedMovie(movieObj);
          setSelectedTrailerId(id);
          setShowTrailer(true);
        };
      
        const closeTrailer = () => {
          setShowTrailer(false);
          setSelectedTrailerId(null);
          setSelectedMovie(null);
        };

        if(!movie){
        return (
          <div className={movieDetailHStyles.notFoundContainer}>
            <div className={movieDetailHStyles.notFoundContent}>
                <h2 className={movieDetailHStyles.notFoundTitle}>Movie not found.</h2>
                <Link to="/movies" className={movieDetailHStyles.notFoundLink}>Back to Movies</Link>
            </div>
          </div>
        );
      }

      //SEAT SELECTOR
      const buildSeatSelectorPath = (movieIdParam, datetime) => {
        const key=encodeURIComponent(datetime);
        const pathLower=(location.pathname || "").toLowerCase();
        const usesSingular=pathLower.includes('/movie/');
        if(usesSingular){
          return `/movie/${movieIdParam}/seat-selector/${key}`;
        }
        return `/movies/${movieIdParam}/seat-selector/${key}`;
      }

      const handleTimeSelect = (datetime) => {
      setSelectedTime(datetime);
      const path=buildSeatSelectorPath(movie.id, datetime);
      navigate(path);
     };

     const handleBookNow = () => {
         if (selectedTime) {
           const path=buildSeatSelectorPath(movie.id, selectedTime);
           navigate(path);
         } else {
           toast.error("Please select a showtime first");
         }
       };

            /**
       * Get booked count for specific datetime and audi (if available).
       * - First tries per-audi key: bookings_{movieId}_{datetime}_{audi}
       * - Falls back to legacy key without audi: bookings_{movieId}_{datetime}
       */
      const getBookedCountFor = (datetime, audi = "Audi 1") => {
        try {
          const keyWithAudi = `bookings_${movie.id}_${datetime}_${audi}`;
          const rawWith = localStorage.getItem(keyWithAudi);
          if (rawWith) {
            const arr = JSON.parse(rawWith);
            if (Array.isArray(arr)) return arr.length;
          }
          const legacyKey = `bookings_${movie.id}_${datetime}`;
          const rawLegacy = localStorage.getItem(legacyKey);
          if (rawLegacy) {
            const arrLegacy = JSON.parse(rawLegacy);
            if (Array.isArray(arrLegacy)) return arrLegacy.length;
          }
          return 0;
        } catch (err) {
          return 0;
        }
      };

       const firstShowtime=useMemo(() =>{
        if(!showtimeDays.length) return null;
        for(const day of showtimeDays){
          if(day.showtimes && day.showtimes.length) return day.showtimes[0].datetime;
        }
        return null;
       },[showtimeDays]);


  return (
    <div className={movieDetailHStyles.pageContainer}>
      {/* Trailer Modal */}
      {showTrailer && selectedTrailerId && (
        <div className={movieDetailHStyles.trailerModal}>
          <div className={movieDetailHStyles.trailerContainer}>
            <button onClick={closeTrailer} className={movieDetailHStyles.closeButton} aria-label="Close trailer">
              <X size={36} />
            </button>
            <div className={movieDetailHStyles.trailerIframe}>
              <iframe
                key={selectedTrailerId}
                width="100%"
                height="100%"
                src={getEmbedUrl(selectedTrailerId)}
                title={`${selectedMovie?.title || "Trailer"} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={movieDetailHStyles.iframe}
              />
            </div>
          </div>
        </div>
      )}

      <div className={movieDetailHStyles.mainContainer}>
        {/* Header */}
        <div className={movieDetailHStyles.headerContainer}>
          <Link to="/movies" className={movieDetailHStyles.backButton}>
            <ArrowLeft size={18} /> <span className={movieDetailHStyles.backButtonText}>Back</span>
          </Link>
        </div>

        {/* Title */}
        <div className={movieDetailHStyles.titleContainer}>
          <h1
            className={movieDetailHStyles.movieTitle}
            style={{
              fontFamily: "'Cinzel', 'Times New Roman', serif",
              textShadow: "0 4px 20px rgba(220, 38, 38, 0.6)",
              letterSpacing: "0.08em",
            }}
          >
            {movie.title}
          </h1>
          <div className={movieDetailHStyles.movieInfoContainer}>
            <span className={movieDetailHStyles.rating}>
              <Star className={movieDetailHStyles.ratingIcon} />
              {movie.rating}/10
            </span>
            <span className={movieDetailHStyles.duration}>
              <Clock className={movieDetailHStyles.durationIcon} />
              {movie.duration}
            </span>
            <span className={movieDetailHStyles.genre}>{movie.genre}</span>
          </div>
        </div>

        {/* Layout */}
        <div className={movieDetailHStyles.mainGrid}>
          {/* Poster */}
          <div className={movieDetailHStyles.posterContainer}>
            <div className={movieDetailHStyles.posterCard}>
              <div className={movieDetailHStyles.posterImageContainer} style={{ maxWidth: "320px" }}>
                <img
                  src={movie.img}
                  alt={movie.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://via.placeholder.com/320x480?text=No+Image";
                  }}
                  className={movieDetailHStyles.posterImage}
                />
              </div>

              <button onClick={() => openTrailer(movie)} className={movieDetailHStyles.trailerButton} aria-label="Watch trailer">
                <Play size={18} />
                <span>Watch Trailer</span>
              </button>
            </div>
          </div>

          {/* Showtimes + Cast */}
          <div className={movieDetailHStyles.showtimesContainer}>
            <div className={movieDetailHStyles.showtimesCard}>
              <h3 className={movieDetailHStyles.showtimesTitle} style={{ fontFamily: "'Cinzel', serif" }}>
                <Calendar className={movieDetailHStyles.showtimesTitleIcon} />
                <span>Showtimes</span>
              </h3>

              {/* Day selection */}
              <div className={movieDetailHStyles.daySelection}>
                {showtimeDays.length ? (
                  showtimeDays.map((day, index) => (
                    <button
                      key={day.date}
                      onClick={() => {
                        setSelectedDay(index);
                        setSelectedTime(null);
                      }}
                      className={`${movieDetailHStyles.dayButton} ${
                        selectedDay === index ? movieDetailHStyles.dayButtonSelected : movieDetailHStyles.dayButtonDefault
                      }`}
                      aria-pressed={selectedDay === index}
                      aria-label={`Select ${day.dayName} ${day.dateStr}`}
                    >
                      <div className={movieDetailHStyles.dayName}>{day.shortDay}</div>
                      <div className={movieDetailHStyles.dayDate}>{day.dateStr}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm px-2">No showtime dates available</div>
                )}
              </div>

              {/* Showtimes grid */}
              <div className={movieDetailHStyles.showtimesGrid}>
                {showtimeDays[selectedDay]?.showtimes && showtimeDays[selectedDay].showtimes.length ? (
                  showtimeDays[selectedDay].showtimes.map((showtime, index) => {
                    // We do not display audi on this page; bookedCount still checks audi (fallbacks to legacy)
                    const bookedCount = getBookedCountFor(showtime.datetime, showtime.audi);
                    const isSoldOut = bookedCount >= TOTAL_SEATS;

                    return (
                      <button
                        key={index}
                        onClick={() => handleTimeSelect(showtime.datetime)}
                        className={`${movieDetailHStyles.showtimeButton} ${
                          selectedTime === showtime.datetime
                            ? movieDetailHStyles.showtimeButtonSelected
                            : movieDetailHStyles.showtimeButtonDefault
                        }`}
                        title={isSoldOut ? "All seats booked for this showtime" : `Seats available: ${Math.max(0, TOTAL_SEATS - bookedCount)}`}
                        aria-disabled={isSoldOut}
                      >
                        <span>{showtime.time}</span>
                        {isSoldOut && <span className={movieDetailHStyles.soldOutBadge}>Sold Out</span>}
                      </button>
                    );
                  })
                ) : (
                  <div className={movieDetailHStyles.noShowtimes}>No showtimes available for the selected date</div>
                )}
              </div>

              {selectedTime && (
                <div className={movieDetailHStyles.bookNowContainer}>
                  <button onClick={handleBookNow} className={movieDetailHStyles.bookNowButton} aria-label="Proceed to seat selection">
                    Proceed to Seat Selection
                  </button>
                </div>
              )}
            </div>

            {/* Cast */}
            <div className={movieDetailHStyles.castCard}>
              <h3 className={movieDetailHStyles.castTitle} style={{ fontFamily: "'Cinzel', serif" }}>
                <Users className={movieDetailHStyles.castTitleIcon} />
                <span>Cast</span>
              </h3>

              <div className={movieDetailHStyles.castGrid}>
                {movie.cast && movie.cast.length ? (
                  movie.cast.map((c, idx) => (
                    <div key={idx} className={movieDetailHStyles.castMember}>
                      <div className={movieDetailHStyles.castImageContainer}>
                        {c.img ? (
                          <img
                            src={c.img}
                            alt={c.name}
                            loading="lazy"
                            className={movieDetailHStyles.castImage}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://via.placeholder.com/80?text=A";
                            }}
                          />
                        ) : (
                          <FallbackAvatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                        )}
                      </div>
                      <div className={movieDetailHStyles.castName}>{c.name}</div>
                      <div className={movieDetailHStyles.castRole}>{c.role}</div>
                    </div>
                  ))
                ) : (
                  <div className={movieDetailHStyles.noCastMessage}>No cast data available</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Story */}
        <div className={movieDetailHStyles.storyCard}>
          <h2 className={movieDetailHStyles.storyTitle} style={{ fontFamily: "'Cinzel', serif" }}>
            Story
          </h2>
          <p className={movieDetailHStyles.storyText}>{movie.synopsis}</p>
        </div>

        {/* Director & Producer */}
        <div className={movieDetailHStyles.crewGrid}>
          <div className={movieDetailHStyles.crewCard}>
            <div className={movieDetailHStyles.crewTitle}>
              <User className={movieDetailHStyles.crewIcon} />
              <h3 style={{ fontFamily: "'Cinzel', serif" }}>Director</h3>
            </div>
            <div className={movieDetailHStyles.crewContent}>
              {(() => {
                const directors = Array.isArray(movie.director) ? movie.director : movie.director ? [movie.director] : [];
                return (
                  <div className={movieDetailHStyles.crewGridInner}>
                    {directors.length ? (
                      directors.slice(0, 2).map((d, i) => (
                        <div key={i} className="flex flex-col items-center">
                          {d?.img ? (
                            <img
                              src={d.img}
                              alt={d.name || `Director ${i + 1}`}
                              loading="lazy"
                              className={movieDetailHStyles.crewImage}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://via.placeholder.com/96?text=D";
                              }}
                            />
                          ) : (
                            <div className={movieDetailHStyles.fallbackAvatar}>?</div>
                          )}
                          <div className={movieDetailHStyles.crewName}>{d?.name ?? "N/A"}</div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className={movieDetailHStyles.fallbackAvatar}>?</div>
                        <div className={movieDetailHStyles.crewName}>N/A</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className={movieDetailHStyles.crewCard}>
            <div className={movieDetailHStyles.crewTitle}>
              <User className={movieDetailHStyles.crewIcon} />
              <h3 style={{ fontFamily: "'Cinzel', serif" }}>Producer</h3>
            </div>
            <div className={movieDetailHStyles.crewContent}>
              {movie.producer?.img ? (
                <img
                  src={movie.producer.img}
                  alt={movie.producer.name}
                  loading="lazy"
                  className={movieDetailHStyles.crewImage}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://via.placeholder.com/96?text=P";
                  }}
                />
              ) : (
                <FallbackAvatar className="w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4" />
              )}
              <div className={movieDetailHStyles.crewName}>{movie.producer?.name ?? "N/A"}</div>
            </div>
          </div>
        </div>
      </div> 
      <style>{movieDetailHStyles.customCSS}</style>
      
    </div>
  );
};

export default MovieDetailPageHome;