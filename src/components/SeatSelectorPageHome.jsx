import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { seatSelectorHStyles } from '../assets/dummyStyles';
import movies from '../assets/dummymoviedata';
import { ArrowLeft, CreditCard, Ticket, Sofa, RockingChair, Film, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../config/api';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ROWS = [
  { id: "A", type: "standard", count: 8 },
  { id: "B", type: "standard", count: 8 },
  { id: "C", type: "standard", count: 8 },
  { id: "D", type: "recliner", count: 8 },
  { id: "E", type: "recliner", count: 8 },
];

const seatIdFn = (r, n) => `${r}${n}`;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const SeatSelectorPageHome = () => {
  const { id, slot } = useParams();
  const movieId = Number(id);
  const slotKey = slot ? decodeURIComponent(slot) : "";
  const navigate = useNavigate();

  const movie = useMemo(() => movies.find((m) => m.id === movieId), [movieId]);

  const slotObj = useMemo(() => {
    if (!movie || !slotKey || !Array.isArray(movie.slots)) return null;
    const asObj = movie.slots.find(
      (s) => s && typeof s === "object" && (s.time === slotKey || s.time === decodeURIComponent(slotKey))
    );
    if (asObj) return asObj;
    const asString = movie.slots.find(
      (s) => typeof s === "string" && (s === slotKey || s === decodeURIComponent(slotKey))
    );
    if (asString) return { time: asString, audi: "Audi 1" };
    return null;
  }, [movie, slotKey]);

  const audiName = slotObj?.audi ?? "Audi 1";
  const basePrice = movie?.price ?? 0;

  const [booked, setBooked] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [lockedByOthers, setLockedByOthers] = useState(new Set());
  const [isBuying, setIsBuying] = useState(false);
  const storageKey = `bookings_${movieId}_${slotKey}_${audiName}`;
  const legacyKey = `bookings_${movieId}_${slotKey}`;

  useEffect(() => {
    const isValidDate = !!slotKey && !isNaN(new Date(slotKey).getTime());
    if (!isValidDate) {
      toast.error("Invalid or missing showtime. Please select a time from the movie page.");
      setTimeout(() => { if (movie) navigate(`/movie/${movie.id}`); else navigate("/movies"); }, 600);
    }
  }, [slotKey, movie, navigate]);

  useEffect(() => {
    if (!movie) {
      toast.error("Movie not found.");
      setTimeout(() => navigate("/movies"), 600);
    }
  }, [movie, navigate]);

  /* ─── Real-time Seat Locking (WebSockets) ────────────────────────── */
  useEffect(() => {
    if (!movie || !slotKey) return;

    const fetchInitialLocks = async () => {
      try {
        const res = await apiClient.get('/api/bookings/locked-seats', {
          params: { movieId: movie._id || movie.id, showtime: slotKey, audi: audiName }
        });
        if (res.data.success) {
          const userId = localStorage.getItem('userId');
          const locks = res.data.lockedSeats
            .filter(lock => lock.lockedBy !== userId)
            .map(lock => lock.seatId);
          setLockedByOthers(new Set(locks));
        }
      } catch (err) {
        console.error('Failed to fetch initial locks:', err);
      }
    };
    fetchInitialLocks();

    const show = String(slotKey || "unknown").replace(/[^a-zA-Z0-9]/g, "-");
    const audi = audiName.replace(/\s+/g, "");
    const movieStringId = (movie._id || movie.id || 'unknown').toString().replace(/[^a-zA-Z0-9]/g, "-");
    const showId = `${movieStringId}_${show}_${audi}`;
    const socket = io(API_BASE, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('join-show', showId);
    });

    socket.on('seat-locked', ({ seats, userId }) => {
      const cineUser = JSON.parse(localStorage.getItem('cine_user') || '{}');
      const myId = cineUser._id || cineUser.id || localStorage.getItem('userId') || '';
      
      if (userId !== myId) {
        setLockedByOthers(prev => {
          const next = new Set(prev);
          seats.forEach(s => {
            next.add(s);
            if (selected.has(s)) {
              setSelected(current => {
                const updated = new Set(current);
                updated.delete(s);
                return updated;
              });
              toast.warn(`Seat ${s} was just locked by another user.`);
            }
          });
          return next;
        });
      }
    });

    socket.on('seat-released', ({ seats }) => {
      setLockedByOthers(prev => {
        const next = new Set(prev);
        seats.forEach(s => next.delete(s));
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [movie, slotKey, audiName, selected]);

  /* ─── Load occupied seats ────────────────────────────────────────── */
  useEffect(() => {
    setSelected(new Set());

    if (!slotKey || !movie) return;
    apiClient.get('/api/bookings/occupied', {
      params: {
        movieId: movie._id || movie.id || '',
        movieName: movie.title || movie.movieName || '',
        showtime: slotKey,
        audi: audiName,
      },
    }).then((res) => {
      const occupiedArr = res?.data?.occupied;
      if (Array.isArray(occupiedArr) && occupiedArr.length > 0) {
        const occupiedSet = new Set(occupiedArr.map((s) => String(s).toUpperCase()));
        setBooked(occupiedSet);
      } else {
        setBooked(new Set());
      }
    }).catch(() => { /* fallback */ });
  }, [slotKey, audiName, movie]);

  const toggleSeat = useCallback((id) => {
    if (booked.has(id)) {
      toast.error(`Seat ${id} is already booked.`);
      return;
    }
    if (lockedByOthers.has(id)) {
      toast.warn(`Seat ${id} is currently being booked by someone else.`);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [booked, lockedByOthers]);

  const clearSelection = () => setSelected(new Set());

  const total = useMemo(() =>
    [...selected].reduce((sum, s) => {
      const def = ROWS.find((r) => r.id === s[0]);
      const multiplier = def?.type === "recliner" ? 1.5 : 1;
      return sum + basePrice * multiplier;
    }, 0),
    [selected, basePrice]
  );

  const buildSeatsPayload = () => {
    return [...selected].sort().map((s) => {
      const def = ROWS.find((r) => r.id === s[0]);
      const type = def?.type === "recliner" ? "recliner" : "standard";
      const price = def?.type === "recliner" ? Math.round(basePrice * 1.5) : basePrice;
      return { seatId: s, type, price };
    });
  };

  const confirmBooking = async () => {
    if (selected.size === 0) { toast.error("Select at least one seat."); return; }
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      toast.error("Please log in to book tickets.");
      setTimeout(() => navigate('/login'), 800);
      return;
    }

    setIsBuying(true);
    try {
      // 1. Lock seats
      try {
        const lockRes = await apiClient.post('/api/bookings/lock-seats', {
          movieId: movie?._id || movie?.id,
          showtime: slotKey,
          audi: audiName,
          seats: [...selected]
        });
        if (!lockRes.data.success) {
          toast.error(lockRes.data.message || "Failed to lock seats.");
          setIsBuying(false);
          return;
        }
      } catch (lockErr) {
        const conflictSeats = lockErr?.response?.data?.conflictSeats;
        toast.error(conflictSeats ? `Seat ${conflictSeats.join(', ')} taken. Pick others.` : 'Seats are being booked by someone else.');
        setIsBuying(false);
        return;
      }

      // 2. Create booking
      const seatsPayload = buildSeatsPayload();
      const userEmail = localStorage.getItem('userEmail') || '';
      const res = await apiClient.post('/api/bookings', {
        movieId: movie?._id || movie?.id,
        movieName: movie?.title || '',
        showtime: slotKey,
        audi: audiName,
        auditorium: audiName,
        seats: seatsPayload,
        email: userEmail,
        customer: userEmail,
        paymentMethod: 'card',
        currency: 'INR',
      });

      if (!res.data.success || !res.data.payment) {
        toast.error(res.data.message || 'Failed to create booking.');
        await apiClient.post('/api/bookings/release-seats', {
          movieId: movie?._id || movie?.id,
          showtime: slotKey,
          audi: audiName,
          seats: [...selected]
        });
        setIsBuying(false);
        return;
      }

      const { orderId, amount, currency, keyId } = res.data.payment;
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway.');
        setIsBuying(false);
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'CineVerse',
        description: movie?.title,
        order_id: orderId,
        theme: { color: '#dc2626' },
        retry: { enabled: false },
        handler: async (response) => {
          try {
            const verifyRes = await apiClient.post('/api/bookings/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              const newBooked = new Set([...booked, ...selected]);
              setBooked(newBooked);
              setSelected(new Set());
              toast.success('🎉 Booking Confirmed!');
              setTimeout(() => navigate('/bookings'), 1500);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error('Payment verification error.');
          } finally {
            setIsBuying(false);
          }
        },
        modal: {
          ondismiss: async () => {
            await apiClient.post('/api/bookings/release-seats', {
              movieId: movie?._id || movie?.id,
              showtime: slotKey,
              audi: audiName,
              seats: [...selected]
            });
            toast.info('Payment cancelled.');
            setIsBuying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Booking failed.');
      setIsBuying(false);
    }
  };

  return (
    <div className={seatSelectorHStyles.pageContainer}>
      <style>{`
        ${seatSelectorHStyles.customCSS}
        @keyframes pulse-orange {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); transform: scale(1); }
          70% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); transform: scale(1); }
        }
        .seat-locked-by-other {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
          color: white !important;
          animation: pulse-orange 2s infinite !important;
          cursor: not-allowed !important;
          opacity: 0.9 !important;
        }
      `}</style>
      <div className={seatSelectorHStyles.mainContainer}>
        <div className={seatSelectorHStyles.headerContainer} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(-1)} className={seatSelectorHStyles.backButton}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ textAlign: "center" }}>
            <h1 className={seatSelectorHStyles.movieTitle}>{movie?.title}</h1>
            <div className={seatSelectorHStyles.showtimeText}>
              {slotKey ? new Date(slotKey).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Showtime N/A"}
            </div>
          </div>
          <div className={seatSelectorHStyles.audiBadge}>
            <Film size={14} /> <span>{audiName}</span>
          </div>
        </div>

        <div className={seatSelectorHStyles.screenContainer}>
          <div className={seatSelectorHStyles.screen}>
            <div className={seatSelectorHStyles.screenText}>CURVED SCREEN</div>
          </div>
        </div>

        <div className={seatSelectorHStyles.mainContent}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', padding: '0 0 24px', fontSize: 13 }}>
            {[
              { color: '#22c55e', label: 'Available' },
              { color: '#3b82f6', label: 'Selected' },
              { color: '#f97316', label: 'Being Booked', pulse: true },
              { color: '#6b7280', label: 'Booked' },
            ].map(({ color, label, pulse }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 14, height: 14, borderRadius: 3, background: color,
                  boxShadow: pulse ? '0 0 8px #f97316' : 'none',
                  animation: pulse ? 'pulse-orange 2s infinite' : 'none'
                }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className={seatSelectorHStyles.seatGridContainer}>
            {ROWS.map((row) => (
              <div key={row.id} className={seatSelectorHStyles.rowContainer}>
                <div className={seatSelectorHStyles.rowHeader}>
                  <div className={seatSelectorHStyles.rowLabel}>{row.id}</div>
                  <div className={seatSelectorHStyles.seatGrid}>
                    {Array.from({ length: row.count }).map((_, i) => {
                      const id = seatIdFn(row.id, i+1);
                      const isBooked = booked.has(id);
                      const isSelected = selected.has(id);
                      const isLockedOther = lockedByOthers.has(id);
                      
                      let cls = seatSelectorHStyles.seatButton;
                      if (isBooked) cls += ` ${seatSelectorHStyles.seatButtonBooked}`;
                      else if (isLockedOther) cls += " seat-locked-by-other";
                      else if (isSelected) cls += row.type === "recliner" ? ` ${seatSelectorHStyles.seatButtonSelectedRecliner}` : ` ${seatSelectorHStyles.seatButtonSelectedStandard}`;
                      else cls += row.type === "recliner" ? ` ${seatSelectorHStyles.seatButtonAvailableRecliner}` : ` ${seatSelectorHStyles.seatButtonAvailableStandard}`;

                      return (
                        <button key={id} onClick={() => toggleSeat(id)} disabled={isBooked || isLockedOther || isBuying} className={cls}>
                          <div className={seatSelectorHStyles.seatContent}>
                            {row.type === "recliner" ? <Sofa size={16} /> : <RockingChair size={12} />}
                            <span className={seatSelectorHStyles.seatNumber}>{i+1}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className={seatSelectorHStyles.rowType}>{row.type}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={seatSelectorHStyles.summaryGrid}>
            <div className={seatSelectorHStyles.summaryContainer}>
               <h3 className={seatSelectorHStyles.summaryTitle}><Ticket size={18} /> Summary</h3>
               {selected.size > 0 ? (
                 <div className="space-y-4">
                   <div className={seatSelectorHStyles.selectedSeatsList}>
                     {[...selected].sort().map(s => <span key={s} className={seatSelectorHStyles.selectedSeatBadge}>{s}</span>)}
                   </div>
                   <div className={seatSelectorHStyles.totalValue}>₹{Math.round(total)}</div>
                 </div>
               ) : <div className={seatSelectorHStyles.emptyState}>No seats selected</div>}
               <div className={seatSelectorHStyles.actionButtons}>
                 <button onClick={clearSelection} disabled={selected.size === 0 || isBuying} className={seatSelectorHStyles.clearButton}>Clear</button>
                 <button onClick={confirmBooking} disabled={selected.size === 0 || isBuying} className={seatSelectorHStyles.confirmButton}>Pay Now</button>
               </div>
            </div>
            <div className={seatSelectorHStyles.pricingContainer}>
               <h3 className={seatSelectorHStyles.pricingTitle}><Users size={18} /> Pricing</h3>
               <div className={seatSelectorHStyles.pricingRow}>
                 <span>Standard</span><span>₹{basePrice}</span>
               </div>
               <div className={seatSelectorHStyles.pricingRow}>
                 <span>Recliner</span><span>₹{Math.round(basePrice * 1.5)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectorPageHome;