import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../config/api';
import { MapPin, Navigation, Info, ArrowRight } from 'lucide-react';
import LocationModal from '../components/LocationModal';

const CinemaSelectionPage = () => {
  const { id, slot } = useParams();
  const navigate = useNavigate();
  
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Force top scroll
    window.scrollTo(0, 0);

    const loadLocationAndCinemas = async () => {
      const locStr = localStorage.getItem('cine_location');
      if (!locStr) {
        setLoading(false);
        setIsLocationModalOpen(true); // Force them to pick location
        return;
      }

      try {
        const loc = JSON.parse(locStr);
        setCurrentLocation(loc);
        if (loc.lat && loc.lng) {
          fetchCinemas(loc.lat, loc.lng);
        }
      } catch (err) {
        console.error("Location parse error", err);
        setLoading(false);
      }
    };

    loadLocationAndCinemas();
    
    // Listen to changes if they update location in navbar
    const handleStorage = (e) => {
      if (e.key === 'cine_location') {
        loadLocationAndCinemas();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchCinemas = async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/cinemas/nearby', {
        params: { lat, lng }
      });
      if (data.success) {
        setCinemas(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch nearby cinemas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setCurrentLocation(loc);
    fetchCinemas(loc.lat, loc.lng);
  };

  const handleSelectCinema = (cinemaId) => {
    navigate(`/movies/${id}/seat-selector/${slot}?cinemaId=${cinemaId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tight mb-2 uppercase">
              Select Cinema
            </h1>
            <p className="text-gray-400">Choose a theater near you for this showtime.</p>
          </div>
          
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 self-start md:self-auto bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-zinc-800 transition-colors px-4 py-2 rounded-xl"
          >
            <MapPin size={16} className="text-red-500" />
            <span className="text-gray-200 text-sm font-medium">
              {currentLocation ? (currentLocation.city || 'Your Location') : 'Select Location'}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Finding nearby cinemas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center">
            <p>{error}</p>
            <button onClick={() => currentLocation && fetchCinemas(currentLocation.lat, currentLocation.lng)} className="mt-4 px-6 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white rounded-lg transition-colors">
              Retry
            </button>
          </div>
        ) : cinemas.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-3xl text-center">
            <MapPin size={48} className="mx-auto text-zinc-600 mb-4" />
            <h3 className="text-xl text-white font-bold mb-2">No Cinemas Found</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">We couldn't find any active cinemas within 50km of your selected location.</p>
            <button 
              onClick={() => setIsLocationModalOpen(true)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-600/20"
            >
              Change Location
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {cinemas.map((cinema) => (
              <div 
                key={cinema._id}
                onClick={() => handleSelectCinema(cinema._id)}
                className="group relative bg-[#141414] border border-[#2a2a2a] hover:border-red-500/50 rounded-2xl p-5 md:p-6 cursor-pointer transition-all hover:bg-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                
                <div className="flex-[2]">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                    {cinema.name}
                  </h3>
                  <div className="flex items-start gap-1.5 text-gray-400 text-sm mt-2">
                    <Navigation size={14} className="mt-0.5 shrink-0" />
                    <span>{cinema.address}, {cinema.city} - {cinema.pincode}</span>
                  </div>
                </div>

                <div className="flex-1">
                  {cinema.facilities && cinema.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cinema.facilities.map((fac, i) => (
                        <span key={i} className="px-2.5 py-1 bg-zinc-900 text-zinc-300 text-xs font-medium rounded-md border border-zinc-800 inline-flex items-center gap-1.5">
                          <Info size={12} className="text-red-500/70" /> {fac}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 md:pt-0 border-t border-zinc-800 md:border-0 mt-2 md:mt-0 flex items-center justify-end">
                  <span className="flex items-center gap-2 text-sm font-bold text-red-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all">
                    SELECT SEATS
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      
      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => {
          setIsLocationModalOpen(false);
          // If they close without a location, and we still have no location, we might just stay empty.
        }} 
        onLocationSelect={handleLocationSelect} 
      />
    </div>
  );
};

export default CinemaSelectionPage;
