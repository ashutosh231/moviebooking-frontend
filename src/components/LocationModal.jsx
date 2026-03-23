import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, MapPin, Search, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default Leaflet icon not showing up properly in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationModal = ({ isOpen, onClose, onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Map click handler component
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        handleMapClick(e.latlng);
      },
    });
    return null;
  };

  // Center update component
  const UpdateCenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, 13);
    }, [center, map]);
    return null;
  };

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data } = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { format: 'json', q: searchQuery, addressdetails: 1, limit: 5 }
      });
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    const locationObj = {
      lat,
      lng: lon,
      city: result.address?.city || result.address?.town || result.address?.village || result.name,
      address: result.display_name,
      display_name: result.name || result.address?.city || 'Selected Location'
    };

    saveLocation(locationObj);
  };

  const saveLocation = (loc) => {
    localStorage.setItem('cine_location', JSON.stringify(loc));
    if (onLocationSelect) onLocationSelect(loc);
    onClose();
  };

  const handleMapClick = async (latlng) => {
    const lat = latlng.lat;
    const lng = latlng.lng;
    setSelectedCoord([lat, lng]);
    // Reverse Geocode
    try {
      const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: { format: 'json', lat, lon: lng, addressdetails: 1 }
      });
      if (data) {
        const locationObj = {
          lat,
          lng,
          city: data.address?.city || data.address?.town || data.address?.village || data.address?.state_district,
          address: data.display_name,
          display_name: data.address?.city || data.address?.town || 'Pinned Location'
        };
        saveLocation(locationObj);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const useCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setSelectedCoord([latitude, longitude]);
        handleMapClick({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Could not get your location. Please check browser permissions.");
        setIsLocating(false);
      }
    );
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#141414] w-full max-w-3xl rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col md:flex-row shadow-2xl h-[80vh] md:h-[600px]">
        
        {/* Left Side: Search & List */}
        <div className="w-full md:w-[40%] flex flex-col border-r border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="text-[#e50914]" size={24} />
              Select Location
            </h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-[#333] transition-colors md:hidden">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <button 
              onClick={useCurrentLocation}
              disabled={isLocating}
              className="w-full flex items-center gap-3 bg-[#e50914]/10 hover:bg-[#e50914]/20 text-[#e50914] p-3 rounded-xl transition-colors mb-4 border border-[#e50914]/20"
            >
              <Crosshair size={20} className={isLocating ? 'animate-spin' : ''} />
              <div className="text-left">
                <p className="font-semibold text-sm">Detect my current location</p>
                <p className="text-xs text-red-300">Using GPS / Browser Location</p>
              </div>
            </button>

            <form onSubmit={handleSearch} className="mb-4 relative">
              <input
                type="text"
                placeholder="Search precise address or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-[#e50914] transition-colors"
                autoComplete="off"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </form>

            <div className="space-y-2">
              {isSearching && <p className="text-gray-400 text-sm text-center py-4">Searching...</p>}
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left p-3 hover:bg-[#222] rounded-xl transition-colors border border-transparent hover:border-[#333] flex items-start gap-3"
                >
                   <MapPin className="text-gray-500 mt-1 shrink-0" size={16} />
                   <div>
                     <p className="text-white text-sm font-medium line-clamp-1">{result.name || result.display_name.split(',')[0]}</p>
                     <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{result.display_name}</p>
                   </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="w-full md:w-[60%] h-full relative bg-[#0a0a0a]">
           <button onClick={onClose} className="absolute top-4 right-4 z-[400] p-2 bg-black/50 backdrop-blur border border-white/10 rounded-full text-white hover:bg-black/80 transition-colors hidden md:block shadow-lg">
              <X size={20} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-black/80 backdrop-blur rounded-full px-4 py-2 text-xs text-white border border-[#333] shadow-xl text-center pointer-events-none">
              Click anywhere on the map to pin a location
            </div>

            <MapContainer 
               center={mapCenter} 
               zoom={4} 
               style={{ height: '100%', width: '100%' }}
               zoomControl={false}
               attributionControl={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles-dark"
              />
              <UpdateCenter center={mapCenter} />
              <MapEvents />
              {selectedCoord && <Marker position={selectedCoord} />}
            </MapContainer>
            <style dangerouslySetInnerHTML={{__html: `
              .map-tiles-dark { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
              .leaflet-container { background: #0a0a0a !important; font-family: inherit; }
            `}} />
        </div>

      </div>
    </div>,
    document.body
  );
};

export default LocationModal;
