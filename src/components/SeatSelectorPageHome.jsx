import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { seatSelectorHStyles } from '../assets/dummyStyles';
import movies from '../assets/dummymoviedata';
import { ArrowLeft, CreditCard, Ticket, Sofa, RockingChair, Film } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../config/api';

const ROWS = [
  { id: "A", type: "standard", count: 8 },
  { id: "B", type: "standard", count: 8 },
  { id: "C", type: "standard", count: 8 },
  { id: "D", type: "recliner", count: 8 },
  { id: "E", type: "recliner", count: 8 },
];

const seatIdFn = (r, n) => `${r}${n}`;

/* ─── Razorpay script loader ─────────────────────────────────────── */
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

  /* derive slot object and audi from movie data */
  const slotObj = useMemo(() => {
    if (!movie || !slotKey || !Array.isArray(movie.slots)) return null;
    const asObj = movie.slots.find(
      (s) => s && typeof s === "object" &&
        (s.time === slotKey || s.time === decodeURIComponent(slotKey))
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
  const [isBuying, setIsBuying] = useState(false);
  const storageKey = `bookings_${movieId}_${slotKey}_${audiName}`;
  const legacyKey = `bookings_${movieId}_${slotKey}`;

  /* ─── Guards ─────────────────────────────────────────────────────── */
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

  /* ─── Load occupied seats: localStorage + backend ────────────────── */
  useEffect(() => {
    // 1. Seed from localStorage (instant)
    try {
      const raw = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);
      if (raw) setBooked(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
    setSelected(new Set());

    // 2. Merge with backend occupied seats
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
        setBooked((prev) => {
          const merged = new Set([...prev, ...occupiedSet]);
          // persist merged to localStorage
          try { localStorage.setItem(storageKey, JSON.stringify([...merged])); } catch { /* ignore */ }
          return merged;
        });
      }
    }).catch(() => { /* silently ignore — fallback to localStorage */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, slotKey, audiName]);

  /* ─── Seat toggle ────────────────────────────────────────────────── */
  const toggleSeat = useCallback((id) => {
    if (booked.has(id)) {
      toast.error(`Seat ${id} is already booked. Please select another seat.`);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [booked]);

  const clearSelection = () => setSelected(new Set());

  /* ─── Total ──────────────────────────────────────────────────────── */
  const total = useMemo(() =>
    [...selected].reduce((sum, s) => {
      const def = ROWS.find((r) => r.id === s[0]);
      const multiplier = def?.type === "recliner" ? 1.5 : 1;
      return sum + basePrice * multiplier;
    }, 0),
    [selected, basePrice]
  );
  const selectedCount = selected.size;

  /* ─── Build seats payload for backend ───────────────────────────── */
  function buildSeatsPayload() {
    return [...selected].sort().map((s) => {
      const def = ROWS.find((r) => r.id === s[0]);
      const type = def?.type === "recliner" ? "recliner" : "standard";
      const price = def?.type === "recliner" ? Math.round(basePrice * 1.5) : basePrice;
      return { seatId: s, type, price };
    });
  }

  /* ─── Razorpay payment flow ──────────────────────────────────────── */
  const confirmBooking = async () => {
    if (selected.size === 0) { toast.error("Select at least one seat."); return; }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please log in to book tickets.");
      setTimeout(() => navigate('/login'), 800);
      return;
    }

    setIsBuying(true);
    try {
      // Step 1: Create booking + Razorpay order on backend
      const seatsPayload = buildSeatsPayload();
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('cine_user_email') || '';
      const res = await apiClient.post('/api/bookings', {
        movieId: movie?._id || '',
        movieName: movie?.title || movie?.movieName || '',
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
        toast.error(res.data.message || 'Failed to create booking. Try again.');
        setIsBuying(false);
        return;
      }

      const { orderId, amount, currency, keyId } = res.data.payment;
      const bookingId = res.data.booking?.id;

      // Step 2: Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        setIsBuying(false);
        return;
      }

      // Step 3: Open Razorpay checkout
      const user = (() => { try { return JSON.parse(localStorage.getItem('cine_user') || '{}'); } catch { return {}; } })();
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'CineVerse',
        description: `${movie?.title || 'Movie'} – ${audiName}`,
        order_id: orderId,
        prefill: {
          name: user.fullName || user.name || '',
          email: user.email || userEmail,
          contact: user.phone || '',
        },
        theme: { color: '#dc2626' },
        handler: async (response) => {
          // Step 4: Verify payment signature
          try {
            const verifyRes = await apiClient.post('/api/bookings/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              // Mark seats in localStorage too (offline cache)
              const newBooked = new Set([...booked, ...selected]);
              try { localStorage.setItem(storageKey, JSON.stringify([...newBooked])); } catch { /* ignore */ }
              setBooked(newBooked);
              setSelected(new Set());

              toast.success('🎉 Booking Confirmed! Redirecting to your tickets...');
              setTimeout(() => navigate('/bookings'), 1500);
            } else {
              toast.error('Payment verification failed. Contact support.');
            }
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            toast.error(verifyErr?.response?.data?.message || 'Payment verification failed.');
          } finally {
            setIsBuying(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled.');
            setIsBuying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        console.error('Razorpay payment failed:', resp.error);
        toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
        setIsBuying(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err?.response?.data?.message || 'Booking failed. Try again.');
      setIsBuying(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <div className={seatSelectorHStyles.pageContainer}>
      <style>{seatSelectorHStyles.customCSS}</style>
      <div className={seatSelectorHStyles.mainContainer}>
        {/* Header */}
        <div className={seatSelectorHStyles.headerContainer} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(-1)} className={seatSelectorHStyles.backButton}>
              <ArrowLeft size={18} /> Back
            </button>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1 className={seatSelectorHStyles.movieTitle} style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", textShadow: "0 4px 20px rgba(220,38,38,0.4)", letterSpacing: "0.06em", margin: 0 }}>
              {movie?.title}
            </h1>
            <div className={seatSelectorHStyles.showtimeText} style={{ marginTop: 6 }}>
              {slotKey ? new Date(slotKey).toLocaleString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Showtime unavailable"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 120 }}>
            <div className={seatSelectorHStyles.audiBadge} style={{ background: "linear-gradient(90deg,#111,#222)", color: "red", padding: "6px 12px", borderRadius: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.45)" }}>
              <Film size={14} />
              <span>{audiName}</span>
            </div>
          </div>
        </div>

        {/* Screen */}
        <div className={seatSelectorHStyles.screenContainer}>
          <div className={seatSelectorHStyles.screen} style={{ transform: "perspective(120px) rotateX(6deg)", maxWidth: 900, boxShadow: "0 0 40px rgba(220,38,38,0.18)" }}>
            <div className={seatSelectorHStyles.screenText}>CURVED SCREEN</div>
            <div className={seatSelectorHStyles.screenSubtext}>Please face the screen — enjoy the show</div>
          </div>
        </div>

        {/* Main Content */}
        <div className={seatSelectorHStyles.mainContent}>
          <div className={seatSelectorHStyles.sectionHeader}>
            <div className={seatSelectorHStyles.sectionTitleContainer}>
              <h2 className={seatSelectorHStyles.sectionTitle} style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", textShadow: "0 4px 20px rgba(220,38,38,0.4)", letterSpacing: "0.06em" }}>
                Select Your Seats
              </h2>
              <div className={seatSelectorHStyles.titleDivider} />
            </div>
          </div>

          {/* Seat Grid */}
          <div className={seatSelectorHStyles.seatGridContainer}>
            {ROWS.map((row) => (
              <div key={row.id} className={seatSelectorHStyles.rowContainer}>
                <div className={seatSelectorHStyles.rowHeader}>
                  <div className={seatSelectorHStyles.rowLabel}>{row.id}</div>
                  <div className="flex-1 flex justify-center">
                    <div className={seatSelectorHStyles.seatGrid} style={{ width: "100%", maxWidth: "720px" }}>
                      {Array.from({ length: row.count }).map((_, i) => {
                        const num = i + 1;
                        const id = seatIdFn(row.id, num);
                        const isBooked = booked.has(id);
                        const isSelected = selected.has(id);
                        let cls = seatSelectorHStyles.seatButton;
                        if (isBooked) cls += ` ${seatSelectorHStyles.seatButtonBooked}`;
                        else if (isSelected) cls += row.type === "recliner" ? ` ${seatSelectorHStyles.seatButtonSelectedRecliner}` : ` ${seatSelectorHStyles.seatButtonSelectedStandard}`;
                        else cls += row.type === "recliner" ? ` ${seatSelectorHStyles.seatButtonAvailableRecliner}` : ` ${seatSelectorHStyles.seatButtonAvailableStandard}`;
                        return (
                          <button key={id} onClick={() => toggleSeat(id)} disabled={isBooked || isBuying} className={cls}
                            title={isBooked ? `Seat ${id} - Already Booked` : `Seat ${id} (${row.type}) - ₹${row.type === "recliner" ? Math.round(basePrice * 1.5) : basePrice}`}
                            aria-pressed={isSelected}>
                            {row.type === "recliner" ? (
                              <div className={seatSelectorHStyles.seatContent}><Sofa size={16} className={seatSelectorHStyles.seatIcon} /><div className={seatSelectorHStyles.seatNumber}>{num}</div></div>
                            ) : (
                              <div className={seatSelectorHStyles.seatContent}><RockingChair size={12} className={seatSelectorHStyles.seatIcon} /><div className={seatSelectorHStyles.seatNumber}>{num}</div></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className={seatSelectorHStyles.rowType}>{row.type}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Summary & Actions */}
          <div className={seatSelectorHStyles.summaryGrid}>
            <div className={seatSelectorHStyles.summaryContainer}>
              <h3 className={seatSelectorHStyles.summaryTitle}><Ticket size={18} /> Booking Summary</h3>
              <div className="space-y-4">
                <div className={seatSelectorHStyles.summaryItem}>
                  <span className={seatSelectorHStyles.summaryLabel}>Selected Seats:</span>
                  <span className={seatSelectorHStyles.summaryValue}>{selectedCount}</span>
                </div>

                {selectedCount > 0 && (
                  <>
                    <div className={seatSelectorHStyles.selectedSeatsContainer}>
                      <div className={seatSelectorHStyles.selectedSeatsLabel}>Selected Seats:</div>
                      <div className={seatSelectorHStyles.selectedSeatsList}>
                        {[...selected].sort().map((seat) => (
                          <span key={seat} className={seatSelectorHStyles.selectedSeatBadge}>{seat}</span>
                        ))}
                      </div>
                    </div>
                    <div className={seatSelectorHStyles.totalContainer}>
                      <div className={seatSelectorHStyles.pricingRow}>
                        <span className={seatSelectorHStyles.totalLabel}>Total Amount:</span>
                        <span className={seatSelectorHStyles.totalValue}>₹{Math.round(total)}</span>
                      </div>
                    </div>
                  </>
                )}

                {selectedCount === 0 && (
                  <div className={seatSelectorHStyles.emptyState}>
                    <div className={seatSelectorHStyles.emptyStateTitle}>No seats selected</div>
                    <div className={seatSelectorHStyles.emptyStateSubtitle}>Select seats from the grid to continue</div>
                  </div>
                )}

                <div className={seatSelectorHStyles.actionButtons}>
                  <button onClick={clearSelection} disabled={selectedCount === 0 || isBuying} className={seatSelectorHStyles.clearButton}>Clear</button>
                  <button onClick={confirmBooking} disabled={selectedCount === 0 || isBuying} className={seatSelectorHStyles.confirmButton}>
                    {isBuying ? 'Processing…' : 'Pay & Confirm'}
                  </button>
                </div>
              </div>
            </div>

            <div className={seatSelectorHStyles.pricingContainer}>
              <h3 className={seatSelectorHStyles.pricingTitle}><CreditCard size={18} /> Pricing Info</h3>
              <div className="space-y-3">
                <div className={seatSelectorHStyles.pricingItem}>
                  <div className={seatSelectorHStyles.pricingRow}>
                    <div className={seatSelectorHStyles.pricingLabel}>Standard (Rows A–C)</div>
                    <div className={seatSelectorHStyles.pricingValueStandard}>₹{basePrice}</div>
                  </div>
                </div>
                <div className={seatSelectorHStyles.pricingItem}>
                  <div className={seatSelectorHStyles.pricingRow}>
                    <div className={seatSelectorHStyles.pricingLabel}>Recliner (Rows D–E)</div>
                    <div className={seatSelectorHStyles.pricingValueRecliner}>₹{Math.round(basePrice * 1.5)}</div>
                  </div>
                </div>
                <div className={seatSelectorHStyles.pricingNote}>All prices include taxes. No hidden charges.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectorPageHome;