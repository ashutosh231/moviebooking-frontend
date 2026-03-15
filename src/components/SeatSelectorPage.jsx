import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { seatSelectorStyles } from '../assets/dummyStyles';
import movies from '../assets/dummymdata';
import { ArrowLeft, CreditCard, Ticket, Sofa, RockingChair } from 'lucide-react';
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
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setBooked(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
    setSelected(new Set());

    if (!slotKey || !movie) return;
    apiClient.get('/api/bookings/occupied', {
      params: { movieId: movie._id || movie.id || '', movieName: movie.title || '', showtime: slotKey, audi: audiName },
    }).then((res) => {
      const occupiedArr = res?.data?.occupied;
      if (Array.isArray(occupiedArr) && occupiedArr.length > 0) {
        const occupiedSet = new Set(occupiedArr.map((s) => String(s).toUpperCase()));
        setBooked((prev) => {
          const merged = new Set([...prev, ...occupiedSet]);
          try { localStorage.setItem(storageKey, JSON.stringify([...merged])); } catch { /* ignore */ }
          return merged;
        });
      }
    }).catch(() => { /* silently ignore */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, slotKey, audiName]);

  const toggleSeat = useCallback((id) => {
    if (booked.has(id)) { toast.error(`Seat ${id} is already booked.`); return; }
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, [booked]);

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
    const token = localStorage.getItem('token');
    if (!token) { toast.error("Please log in to book tickets."); setTimeout(() => navigate('/login'), 800); return; }

    setIsBuying(true);
    try {
      const seatsPayload = [...selected].sort().map((s) => {
        const def = ROWS.find((r) => r.id === s[0]);
        return { seatId: s, type: def?.type === "recliner" ? "recliner" : "standard", price: def?.type === "recliner" ? Math.round(basePrice * 1.5) : basePrice };
      });

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

      if (!res.data.success || !res.data.payment) { toast.error(res.data.message || 'Failed to create booking.'); setIsBuying(false); return; }

      const { orderId, amount, currency, keyId } = res.data.payment;
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway.'); setIsBuying(false); return; }

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
        handler: async (response) => {
          try {
            const verifyRes = await apiClient.post('/api/bookings/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
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
            toast.error(verifyErr?.response?.data?.message || 'Payment verification failed.');
          } finally {
            setIsBuying(false);
          }
        },
        modal: { ondismiss: () => { toast.info('Payment cancelled.'); setIsBuying(false); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => { toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`); setIsBuying(false); });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking failed. Try again.');
      setIsBuying(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <div className={seatSelectorStyles.pageContainer}>
      <style>{seatSelectorStyles.customCSS}</style>
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
                        let cls = seatSelectorStyles.seatButton;
                        if (isBooked) cls += ` ${seatSelectorStyles.seatButtonBooked}`;
                        else if (isSelected) cls += row.type === "recliner" ? ` ${seatSelectorStyles.seatButtonSelectedRecliner}` : ` ${seatSelectorStyles.seatButtonSelectedStandard}`;
                        else cls += row.type === "recliner" ? ` ${seatSelectorStyles.seatButtonAvailableRecliner}` : ` ${seatSelectorStyles.seatButtonAvailableStandard}`;
                        return (
                          <button key={id} onClick={() => toggleSeat(id)} disabled={isBooked || isBuying} className={cls}
                            title={isBooked ? `Seat ${id} - Already Booked` : `Seat ${id} (${row.type}) - ₹${row.type === "recliner" ? Math.round(basePrice * 1.5) : basePrice}`}>
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