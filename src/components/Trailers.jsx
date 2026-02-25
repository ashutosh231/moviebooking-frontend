import React from 'react';
import {trailersStyles,trailersCSS} from "../assets/dummyStyles"
import {trailersData} from "../assets/trailerdata"
import { Calendar, ChevronLeft, ChevronRight, Clapperboard } from 'lucide-react';
import { useState,useEffect, useRef } from 'react';
import { Play, X ,Clock} from 'lucide-react';
const Trailers = () => {
    const [featuredTrailer, setFeaturedTrailer] = useState(trailersData[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef(null);
    const carouselRef = useRef(null);

    useEffect(() => {
    // no-op kept for parity
    const handleScroll = () => {};
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    }, []);//for smooth scroll behavior

    const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
    };

    const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
    };
// when a trailer is selected, reset play state and center it in the carousel
    const selectTrailer = (trailer) => {
    setFeaturedTrailer(trailer);
    setIsPlaying(false);
    try {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } catch (e) {
      // ignore
    }

    // center selected item in carousel
    try {
      if (carouselRef.current) {
        const el = carouselRef.current.querySelector(`[data-id='${trailer.id}']`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const parentRect = carouselRef.current.getBoundingClientRect();
          const offset = rect.left - parentRect.left - parentRect.width / 2 + rect.width / 2;
          carouselRef.current.scrollBy({ left: offset, behavior: "smooth" });
        }
      }
    } catch (e) {
      // ignore
    }
  };
// toggle play/pause state
  const togglePlay = () => {
    setIsPlaying((s) => !s);
  };

  // helper to build embed URL for common providers (YouTube / youtu.be / Vimeo)
  const getEmbedBaseUrl = (videoUrl) => {
    if (!videoUrl) return "";
    try {
      const url = new URL(videoUrl);
      const host = url.hostname.replace("www.", "").toLowerCase();

      // YouTube standard watch URL: youtube.com/watch?v=ID
      if (host.includes("youtube.com")) {
        const vid = url.searchParams.get("v");
        if (vid) return `https://www.youtube.com/embed/${vid}`;
        // If already embed path, return that
        if (url.pathname.includes("/embed/")) return `https://www.youtube.com${url.pathname}`;
      }

      // short youtu.be links
      if (host === "youtu.be") {
        const vid = url.pathname.replace("/", "");
        if (vid) return `https://www.youtube.com/embed/${vid}`;
      }

      // Vimeo
      if (host.includes("vimeo.com")) {
        // path like /12345678 or /channels/.../12345678
        const parts = url.pathname.split("/").filter(Boolean);
        const id = parts.pop();
        if (id) return `https://player.vimeo.com/video/${id}`;
      }

      // fallback: return original (could already be an embed URL)
      return videoUrl;
    } catch (e) {
      // if URL constructor fails, return as-is
      return videoUrl || "";
    }
  };

  // build final iframe src with autoplay/mute parameters
  const buildIframeSrc = (videoUrl) => {
    const base = getEmbedBaseUrl(videoUrl);
    if (!base) return "";
    const sep = base.includes("?") ? "&" : "?";
    // add autoplay / mute / rel
    return `${base}${sep}autoplay=1&mute=${isMuted ? 1 : 0}&rel=0`;
  };

  return (
    <div className={trailersStyles.container}>
        <main className={trailersStyles.main}>
            <div className={trailersStyles.layout}>
                {/*Left side*/}
                <div className={trailersStyles.leftSide}>
                    <div className={trailersStyles.leftCard}>
                        <h2 className={trailersStyles.leftTitle} style={{fontFamily:"'Monoton, cursive"}}>
                            <Clapperboard className={trailersStyles.titleIcon} />
                            Latest Trailers

                        </h2>

                        <div className={trailersStyles.carouselControls}>
                            <div className={trailersStyles.controlButtons}>
                                <button onClick={scrollLeft} className={trailersStyles.controlButton} >
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={scrollRight} className={trailersStyles.controlButton} >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <span className={trailersStyles.trailerCount}>{trailersData.length} trailers</span>

                        </div>
                        <div ref={carouselRef} className={trailersStyles.carousel} style={{scrollbarWidth:"none",msOverflowStyle:"none"}}>
                            {trailersData.map((trailer) => (
                                <div key={trailer.id}
                    data-id={trailer.id}
                    className={`${trailersStyles.carouselItem.base} ${
                      featuredTrailer.id === trailer.id ? trailersStyles.carouselItem.active : trailersStyles.carouselItem.inactive
                    }`}
                    style={{ width: "220px", height: "124px", minWidth: "220px" }}
                    onClick={() => selectTrailer(trailer)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") selectTrailer(trailer);
                    }}
                    aria-pressed={featuredTrailer.id === trailer.id}
                  >
                    <img src={trailer.thumbnail} alt={trailer.title} className={trailersStyles.carouselImage} loading="lazy" />
                    <div className={trailersStyles.carouselOverlay}>
                      <h3 className={trailersStyles.carouselTitle}>{trailer.title}</h3>
                      <p className={trailersStyles.carouselGenre}>{trailer.genre}</p>
                    </div>
                  </div>
                            ))}

                        </div>

                    <div className={trailersStyles.trendingSection}>
                        <h3 className={trailersStyles.trendingTitle}>Now Trending</h3>
                        {trailersData.slice(0,3).map((trailer) => (
                            <div key={trailer.id} className={trailersStyles.trendingItem}  
                            onClick={() => selectTrailer(trailer)} role="button" tabIndex={0} onKeyDown={(e)=>{
                                if(e.key === "Enter" || e.key===" ")
                                    selectTrailer(trailer);
                            }}>
                                <div className={trailersStyles.trendingImage}>
                                    <img src={trailer.thumbnail} alt={trailer.title} className={trailersStyles.trendingImageSrc} loading="lazy" />
                                </div>
                                <div className={trailersStyles.trendingContent}>
                                    <h4 className={trailersStyles.trendingItemTitle}>{trailer.title}</h4>
                                    <p className={trailersStyles.trendingItemGenre}>{trailer.genre}</p>
                                </div>
                                </div>
                        ))}
                    </div>    
                                
                  

                        
                    </div>
                </div>

                {/*Right side*/}
                <div className={trailersStyles.rightSide}>
                    <div className={trailersStyles.rightCard}>
                        <div className={trailersStyles.videoContainer}>
                            {isPlaying ? (
                                <div className={trailersStyles.videoWrapper}>
                                     <iframe
                                        className={trailersStyles.videoIframe}
                                        src={buildIframeSrc(featuredTrailer.videoUrl)}
                                        title={featuredTrailer.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        ref={videoRef}
                                    />  
                                    <div className={trailersStyles.closeButton}>
                                        <button title="Close" onClick={()=>setIsPlaying(false)} className={trailersStyles.closeButtonInner}>
                                            <X size={28} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={trailersStyles.thumbnailContainer} >
                                    <img src={featuredTrailer.thumbnail} alt={featuredTrailer.title} className={trailersStyles.thumbnailImage} loading="eager" />
                                    <div className={trailersStyles.playButtonContainer}>
                                        <button onClick={togglePlay} className={trailersStyles.playButton}>
                                            <Play size={32} fill="white"/>
                                        </button>

                                    </div>
    

                                </div>
                            )}        
                        </div>
                            <div className={trailersStyles.trailerInfo}>
                                <div className={trailersStyles.infoHeader}>
                                    <h2 className={trailersStyles.trailerTitle}>
                                        {featuredTrailer.title}
                                    </h2>
                                    <div className={trailersStyles.trailerMeta}>
                                        <span className={trailersStyles.metaItem}>
                                            <Clock size={16} className={trailersStyles.metaIcon}/>
                                            {featuredTrailer.duration}
                                        </span>
                                        <span className={trailersStyles.metaItem}>
                                            <Calendar size={16} className={trailersStyles.metaIcon}/>
                                            {featuredTrailer.year}
                                        </span>
                                    </div>
                                </div>
                                <div className={trailersStyles.genreContainer}>
                                    {featuredTrailer.genre.split(",").map((genre,index)=>(
                                        <span key={index} className={trailersStyles.genreTag}>
                                            {genre.trim()}
                                        </span>
                                    ))}

                                </div>
                                <p className={trailersStyles.description}>
                                    {featuredTrailer.description}
                                </p>

                                <div className={trailersStyles.credits}>
                                    <h3 className={trailersStyles.creditsTitle}>Credits</h3>
                                    <div className={trailersStyles.creditsGrid}>
                                    {featuredTrailer.credits &&
                                        Object.entries(featuredTrailer.credits).map(([role, person]) => (
                                            <div key={role} className={trailersStyles.creditItem}>
                                            <div className={trailersStyles.creditImage}>
                                                <img src={person.image} alt={person.name} className={trailersStyles.creditImageSrc} loading="lazy" />
                                            </div>
                                            <div className={trailersStyles.creditName}>{person.name}</div>
                                            <div className={trailersStyles.creditRole}>{role}</div>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>


                    </div>
                </div>

            </div>

        </main>
        <style jsx>{trailersCSS}</style>
   
    </div>
  );
};

export default Trailers;