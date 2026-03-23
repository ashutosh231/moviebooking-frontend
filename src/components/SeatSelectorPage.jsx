import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { seatSelectorStyles } from '../assets/dummyStyles';
import movies from '../assets/dummymdata';
import { ArrowLeft, CreditCard, Ticket, Sofa, RockingChair } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient, { API_BASE } from '../config/api';
import { io } from 'socket.io-client';

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

const SeatSelectorPage = () => {
  const { id, slot } = useParams();
  const movieId = Number(id);
  const slotKey = slot ? decodeURIComponent(slot) : "";
  const navigate = useNavigate();

  const movie = useMemo(() => movies.find((m) => m.id === movieId), [movieId]);
  const basePrice = movie?.price ?? 0;

  const audiForSlot = useMemo(() => {
    if (!movie || !slotKey) return null;
    try {
      const targetMs = new Date(slotKey).getTime();
      if (isNaN(targetMs)) return null;
      for (const s of (movie.slots || [])) {
        let timeStr = typeof s === "string" ? s : (s.datetime || s.time || s.iso || s.date || null);
        if (!timeStr) continue;
        if (new Date(timeStr).getTime() === targetMs) return s.audi || s.audiName || s.auditorium || null;
      }
      return null;
    } catch { return null; }
  }, [movie, slotKey]);

  const audiName = audiForSlot || "Audi 1";
  const storageKey = `bookings_${movieId}_${slotKey}`;
  const [booked, setBooked] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [isBuying, setIsBuying] = useState(false);
  // Set of seatIds currently locked by OTHER users (being booked right now)
  const [lockedByOthers, setLockedByOthers] = useState(new Set());
  // Ref so polling interval can always read latest selected set
  const selectedRef = React.useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  /* ─── Guards ─────────────────────────────────────────────────── */
  useEffect(() => {
    const isValidDate = !!slotKey && !isNaN(new Date(slotKey).getTime());
    if (!isValidDate) {
      toast.error("Invalid or missing showtime. Please select a time from the movie page.");
      setTimeout(() => { if (movie) navigate(`/movies/${movie.id}`); else navigate("/movies"); }, 600);
    }
  }, [slotKey, movie, navigate]);

  useEffect(() => {
    if (!movie) {
      toast.error("Movie not found.");
      setTimeout(() => navigate("/movies"), 600);
    }
  }, [movie, navigate]);

  /* ─── Load occupied seats ────────────────────────────────────── */
  useEffect(() => {
    setSelected(new Set());

    if (!slotKey || !movie) return;
    apiClient.get('/api/bookings/occupied', {
      params: { movieId: movie._id || movie.id || '', movieName: movie.title || '', showtime: slotKey, audi: audiName },
    }).then((res) => {
      const occupiedArr = res?.data?.occupied;
      if (Array.isArray(occupiedArr) && occupiedArr.length > 0) {
        const occupiedSet = new Set(occupiedArr.map((s) => String(s).toUpperCase()));
        setBooked(occupiedSet);
      } else {
        setBooked(new Set());
      }
    }).catch(() => { /* silently ignore */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey, audiName]);

  /* ─── Real-time Seat Locking (WebSocket) ───────────────────────── */
  useEffect(() => {
    if (!slotKey || !movie) return;

    // We still fetch initial state once so late joiners see already-locked seats
    const allSeatIds = ROWS.flatMap((r) => Array.from({ length: r.count }, (_, i) => `${r.id}${i + 1}`));
    const fetchInitialLocks = async () => {
      try {
        const res = await apiClient.get('/api/bookings/locked-seats', {
          params: { movieId: movie._id || movie.id || '', showtime: slotKey, auditorium: audiName, seats: allSeatIds.join(',') },
        });
        const seats = res?.data?.seats || [];
        const cineUser = JSON.parse(localStorage.getItem('cine_user') || '{}');
        const myId = cineUser._id || cineUser.id || localStorage.getItem('userId') || '';
        
        setLockedByOthers(new Set(seats.filter(s => s.isLocked && s.lockedBy !== myId).map(s => s.seatId)));
      } catch { /* ignore */ }
    };
    fetchInitialLocks();

    // Setup Socket
    // Setup Socket
    const show = String(slotKey || "unknown").replace(/[^a-zA-Z0-9]/g, "-");
    const audi = audiName.replace(/\s+/g, "");
    const movieStringId = (movie._id || movie.id || 'unknown').toString().replace(/[^a-zA-Z0-9]/g, "-");
    const showId = `${movieStringId}_${show}_${audi}`;
    const socket = io(API_BASE, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('join-show', { showId });
    });

    socket.on('seat-locked', ({ seats, lockedByUserId }) => {
      // Ignore if WE locked these seats
      const cineUser = JSON.parse(localStorage.getItem('cine_user') || '{}');
      const myId = cineUser._id || cineUser.id || localStorage.getItem('userId') || '';
      
      if (myId && lockedByUserId === myId) return;

      setLockedByOthers(prev => {
        const next = new Set(prev);
        seats.forEach(s => next.add(s));
        return next;
      });

      // Snatch warning: Auto-deselect if we were selecting them
      const currentSelected = selectedRef.current;
      const snatched = [...currentSelected].filter(s => seats.includes(s));
      if (snatched.length > 0) {
        toast.warn(`⚠️ Seat${snatched.length > 1 ? 's' : ''} ${snatched.join(', ')} just got locked by someone else!`, { autoClose: 4000 });
        setSelected(prev => {
          const next = new Set(prev);
          snatched.forEach(s => next.delete(s));
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
      socket.emit('leave-show', { showId });
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey, audiName, movie]);

  const toggleSeat = useCallback((seatId) => {
    if (booked.has(seatId)) { toast.error(`Seat ${seatId} is already booked.`); return; }
    if (lockedByOthers.has(seatId)) {
      toast.warn(`⏳ Seat ${seatId} is currently being booked by someone else. Try another seat.`);
      return;
    }
    setSelected((prev) => { const next = new Set(prev); if (next.has(seatId)) next.delete(seatId); else next.add(seatId); return next; });
  }, [booked, lockedByOthers]);

  const clearSelection = () => setSelected(new Set());

  const total = useMemo(() =>
    [...selected].reduce((sum, s) => {
      const def = ROWS.find((r) => r.id === s[0]);
      return sum + basePrice * (def?.type === "recliner" ? 1.5 : 1);
    }, 0),
    [selected, basePrice]
  );

  /* ─── Razorpay flow ──────────────────────────────────────────── */
  const confirmBooking = async () => {
    if (selected.size === 0) { toast.error("Select at least one seat."); return; }
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) { toast.error("Please log in to book tickets."); setTimeout(() => navigate('/login'), 800); return; }

    setIsBuying(true);

    const seatsPayload = [...selected].sort().map((s) => {
      const def = ROWS.find((r) => r.id === s[0]);
      return { seatId: s, type: def?.type === "recliner" ? "recliner" : "standard", price: def?.type === "recliner" ? Math.round(basePrice * 1.5) : basePrice };
    });
    const seatIds = seatsPayload.map(s => s.seatId);

    // Helper to release locks (called on cancel / failure)
    const releaseLocks = async () => {
      try {
        await apiClient.post('/api/bookings/release-seats', {
          movieId: movie?._id || '',
          showtime: slotKey,
          auditorium: audiName,
          seats: seatIds,
        });
      } catch { /* non-fatal */ }
    };

    try {
      // ── Step 1: Lock seats in Valkey BEFORE creating booking ──────
      // This gives the user early feedback and prevents race conditions
      // on the UI side (backend also enforces this independently).
      try {
        await apiClient.post('/api/bookings/lock-seats', {
          movieId: movie?._id || movie?.id || '',
          showtime: slotKey,
          auditorium: audiName,
          seats: seatIds,
        });
      } catch (lockErr) {
        const conflictSeats = lockErr?.response?.data?.conflictSeats;
        toast.error(conflictSeats ? `Seat(s) ${conflictSeats.join(', ')} are taken.` : 'Seats are being booked by someone else.');
        setIsBuying(false);
        return;
      }

      // ── Step 2: Create booking in MongoDB ─────────────────────────
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('cine_user_email') || '';
      const res = await apiClient.post('/api/bookings', {
        movieId: movie?._id || '',
        movieName: movie?.title || '',
        showtime: slotKey,
        audi: audiName,
        auditorium: audiName,
        seats: seatsPayload,
        email: userEmail,
        customer: (() => { try { return JSON.parse(localStorage.getItem('cine_user') || '{}').fullName || userEmail; } catch { return userEmail; } })(),
        paymentMethod: 'card',
        currency: 'INR',
      });

      if (!res.data.success || !res.data.payment) {
        toast.error(res.data.message || 'Failed to create booking.');
        await releaseLocks();
        setIsBuying(false);
        return;
      }

      // ── Step 3: Open Razorpay ──────────────────────────────────────
      const { orderId, amount, currency, keyId } = res.data.payment;
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway.'); await releaseLocks(); setIsBuying(false); return; }

      const user = (() => { try { return JSON.parse(localStorage.getItem('cine_user') || '{}'); } catch { return {}; } })();
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'CineVerse',
        description: `${movie?.title || 'Movie'} – ${audiName}`,
        order_id: orderId,
        prefill: { name: user.fullName || '', email: user.email || userEmail, contact: user.phone || '' },
        theme: { color: '#dc2626' },
        retry: { enabled: false },
        handler: async (response) => {
          // ── Step 4: Verify payment (backend releases lock automatically) ──
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
              toast.success('🎉 Booking Confirmed! Redirecting to your tickets...');
              setTimeout(() => navigate('/bookings'), 1500);
            } else {
              toast.error('Payment verification failed. Contact support.');
              await releaseLocks();
            }
          } catch (verifyErr) {
            toast.error(verifyErr?.response?.data?.message || 'Payment verification failed.');
            await releaseLocks();
          } finally {
            setIsBuying(false);
          }
        },
        modal: {
          ondismiss: async () => {
            // User closed Razorpay without paying — release the seat lock
            toast.info('Payment cancelled. Seats are now available again.');
            await releaseLocks();
            setIsBuying(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (resp) => {
        toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
        await releaseLocks();
        setIsBuying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking failed. Try again.');
      await releaseLocks().catch(() => {});
      setIsBuying(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <div className={seatSelectorStyles.pageContainer}>
      <style>{seatSelectorStyles.customCSS}</style>
      <style>{`
        @keyframes seatLockPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.6); }
          50%       { opacity: 0.75; box-shadow: 0 0 0 6px rgba(251, 146, 60, 0); }
        }
        .seat-locked-by-other {
          background: linear-gradient(135deg, #f97316, #ea580c) !important;
          color: #fff !important;
          border: 2px solid #fb923c !important;
          cursor: not-allowed !important;
          animation: seatLockPulse 1.4s ease-in-out infinite !important;
          opacity: 0.9 !important;
        }
      `}</style>
      <div className={seatSelectorStyles.mainContainer}>
        <div className={seatSelectorStyles.headerContainer}>
          <button className={seatSelectorStyles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
          <div className={seatSelectorStyles.titleContainer}>
            <h1 className={seatSelectorStyles.movieTitle}>{movie?.title}</h1>
            <div className={seatSelectorStyles.showtimeText}>
              {slotKey ? new Date(slotKey).toLocaleString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Showtime unavailable"}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            {audiName && (
              <div style={{ background: "linear-gradient(90deg,#ef4444,#dc2626)", color: "#fff", padding: "6px 12px", borderRadius: 12, fontWeight: 700, boxShadow: "0 6px 18px rgba(0,0,0,0.12)", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                {audiName}
              </div>
            )}
          </div>
        </div>

        <div className={seatSelectorStyles.screenContainer}>
          <div className={seatSelectorStyles.screen} style={{ transform: "perspective(120px) rotateX(6deg)", maxWidth: 900, boxShadow: "0 0 40px rgba(220,38,38,0.18)" }}>
            <div className={seatSelectorStyles.screenText}>CURVED SCREEN</div>
            <div className={seatSelectorStyles.screenSubtext}>Please face the screen — enjoy the show</div>
          </div>
        </div>

        {/* ── Seat Legend ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', padding: '12px 0 4px', fontSize: 13 }}>
          {[
            { color: '#22c55e', label: 'Available' },
            { color: '#3b82f6', label: 'Selected' },
            { color: '#f97316', label: 'Being Booked', pulse: true },
            { color: '#6b7280', label: 'Booked' },
          ].map(({ color, label, pulse }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 4,
                background: color, display: 'inline-block',
                animation: pulse ? 'seatLockPulse 1.4s ease-in-out infinite' : 'none',
                boxShadow: pulse ? `0 0 6px ${color}99` : 'none',
              }} />
              <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>


        <div className={seatSelectorStyles.mainContent}>
          <div className={seatSelectorStyles.seatGridContainer}>
            {ROWS.map((row) => (
              <div key={row.id} className={seatSelectorStyles.rowContainer}>
                <div className={seatSelectorStyles.rowHeader}>
                  <div className={seatSelectorStyles.rowLabel}>{row.id}</div>
                  <div className="flex-1 flex justify-center">
                    <div className={seatSelectorStyles.seatGrid}>
                      {Array.from({ length: row.count }).map((_, i) => {
                        const num = i + 1;
                        const id = seatIdFn(row.id, num);
                        const isBooked = booked.has(id);
                        const isSelected = selected.has(id);
                        const isLockedByOther = lockedByOthers.has(id);
                        let cls = seatSelectorStyles.seatButton;
                        if (isBooked) cls += ` ${seatSelectorStyles.seatButtonBooked}`;
                        else if (isLockedByOther) cls += ' seat-locked-by-other';
                        else if (isSelected) cls += row.type === "recliner" ? ` ${seatSelectorStyles.seatButtonSelectedRecliner}` : ` ${seatSelectorStyles.seatButtonSelectedStandard}`;
                        else cls += row.type === "recliner" ? ` ${seatSelectorStyles.seatButtonAvailableRecliner}` : ` ${seatSelectorStyles.seatButtonAvailableStandard}`;
                        return (
                          <button key={id} onClick={() => toggleSeat(id)} disabled={isBooked || isLockedByOther || isBuying} className={cls}
                            title={
                              isBooked ? `Seat ${id} - Already Booked` :
                              isLockedByOther ? `Seat ${id} - Being booked by someone else…` :
                              `Seat ${id} (${row.type}) - ₹${row.type === "recliner" ? Math.round(basePrice * 1.5) : basePrice}`
                            }>
                            <div className={seatSelectorStyles.seatContent}>
                              {row.type === "recliner" ? <Sofa size={16} className={seatSelectorStyles.seatIcon} /> : <RockingChair size={12} className={seatSelectorStyles.seatIcon} />}
                              <div className={seatSelectorStyles.seatNumber}>{num}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className={seatSelectorStyles.rowType}>{row.type}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={seatSelectorStyles.summaryGrid}>
            <div className={seatSelectorStyles.summaryContainer}>
              <h3 className={seatSelectorStyles.summaryTitle}><Ticket size={18} />Booking Summary</h3>
              <div className="space-y-4">
                <div className={seatSelectorStyles.summaryItem}>
                  <span className={seatSelectorStyles.summaryLabel}>Selected Seats:</span>
                  <span className={seatSelectorStyles.summaryValue}>{selectedCount}</span>
                </div>
                {selectedCount > 0 && (
                  <>
                    <div className={seatSelectorStyles.selectedSeatsContainer}>
                      <div className={seatSelectorStyles.selectedSeatsLabel}>Selected Seats:</div>
                      <div className={seatSelectorStyles.selectedSeatsList}>
                        {[...selected].sort().map((seat) => <span key={seat} className={seatSelectorStyles.selectedSeatBadge}>{seat}</span>)}
                      </div>
                    </div>
                    <div className={seatSelectorStyles.totalContainer}>
                      <div className={seatSelectorStyles.pricingRow}>
                        <span className={seatSelectorStyles.totalLabel}>Total Amount:</span>
                        <span className={seatSelectorStyles.totalValue}>₹{Math.round(total)}</span>
                      </div>
                    </div>
                  </>
                )}
                {selectedCount === 0 && (
                  <div className={seatSelectorStyles.emptyState}>
                    <div className={seatSelectorStyles.emptyStateTitle}>No Seats Selected</div>
                    <div className={seatSelectorStyles.emptyStateSubtitle}>Select seats from the grid to continue</div>
                  </div>
                )}
                <div className={seatSelectorStyles.actionButtons}>
                  <button onClick={clearSelection} disabled={selectedCount === 0 || isBuying} className={seatSelectorStyles.clearButton}>Clear</button>
                  <button onClick={confirmBooking} disabled={selectedCount === 0 || isBuying} className={seatSelectorStyles.confirmButton}>
                    {isBuying ? 'Processing…' : 'Pay & Confirm'}
                  </button>
                </div>
              </div>
            </div>

            <div className={seatSelectorStyles.pricingContainer}>
              <h3 className={seatSelectorStyles.pricingTitle}><CreditCard size={18} /> Pricing Info</h3>
              <div className="space-y-3">
                <div className={seatSelectorStyles.pricingItem}>
                  <div className={seatSelectorStyles.pricingRow}>
                    <div className={seatSelectorStyles.pricingLabel}>Standard (Rows A–C)</div>
                    <div className={seatSelectorStyles.pricingValueStandard}>₹{basePrice}</div>
                  </div>
                </div>
                <div className={seatSelectorStyles.pricingItem}>
                  <div className={seatSelectorStyles.pricingRow}>
                    <div className={seatSelectorStyles.pricingLabel}>Recliner (Rows D–E)</div>
                    <div className={seatSelectorStyles.pricingValueStandard}>₹{Math.round(basePrice * 1.5)}</div>
                  </div>
                </div>
                <div className={seatSelectorStyles.pricingNote}>All prices include taxes. No hidden charges. 🍿</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectorPage;