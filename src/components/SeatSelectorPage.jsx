import React, {  useState } from 'react';
import { seatSelectorStyles } from '../assets/dummyStyles';
import movies from '../assets/dummymdata';
import { ArrowLeft,CreditCard,Ticket } from 'lucide-react';
import { useNavigate,useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Sofa, RockingChair } from 'lucide-react';
/* layout */
const ROWS = [
  { id: "A", type: "standard", count: 8 },
  { id: "B", type: "standard", count: 8 },
  { id: "C", type: "standard", count: 8 },
  { id: "D", type: "recliner", count: 8 },
  { id: "E", type: "recliner", count: 8 },
];

const SeatSelectorPage = () => {
    const { id, slot } = useParams();
    const movieId = Number(id);
    const slotKey = slot ? decodeURIComponent(slot) : "";

    const movie = useMemo(() => movies.find((m) => m.id === movieId), [movieId]);
    const navigate = useNavigate();
    const seatId = (r, n) => `${r}${n}`;

     // Guard: only show this page when a valid slot (datetime) exists
    useEffect(() => {
        const isValidDate = !!slotKey && !isNaN(new Date(slotKey).getTime());
        if (!isValidDate) {
        toast.error(
            "Invalid or missing showtime. Please select a time from the movie page."
        );
        setTimeout(() => {
            if (movie) navigate(`/movie/${movie.id}`);
            else navigate("/movies");
        }, 600);
        }
    }, [slotKey, movie, navigate]);

    const storageKey =`bookings_${movieId}_${slotKey}`;
    const [booked,setBooked]=useState(new Set());
    const [selected,setSelected]=useState(new Set());

    useEffect(() => {
        if(!movie) {
            toast.error("Movie not found.");
            setTimeout(() => navigate("/movies"), 600);
            return;
        }
    }, [movie, navigate]);

    useEffect(() => {
        try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            const arr = JSON.parse(raw);
            setBooked(new Set(arr));
        } else {
            setBooked(new Set());
        }
        } catch (err) {
        setBooked(new Set());
        }
        setSelected(new Set());
    }, [storageKey]);//get storage key from local storage

    const toggleSeat = (id) => {
        if(booked.has(id)){
            console.log(`Seat ${id} is already booked. Booking Details: `,
                {movie:movie?.title,showtime:slotKey,seat:id,status:"booked"});
            
            return;
        }
        setSelected((prev) => {
            const next = new Set(prev);
            if(next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelected(new Set());

    //LIKE HANDLESUBMIT
    const confirmBooking = () => {
    if (selected.size === 0) {
      toast.error("Select at least one seat.");
      return;
    }

    const newBooked = new Set([...booked, ...selected]);
    localStorage.setItem(storageKey, JSON.stringify([...newBooked]));

    // Build booking details
    const bookingDetails = {
      movie: movie?.title,
      movieId: movieId,
      showtime: slotKey,
      audi: audiForSlot || null,
      bookedSeats: [...selected].sort(),
      totalSeats: selected.size,
      totalAmount: Math.round(
        [...selected].reduce((sum, s) => {
          const rowLetter = s[0];
          const def = ROWS.find((r) => r.id === rowLetter);
          const multiplier = def?.type === "recliner" ? 1.5 : 1;
          return sum + (movie?.price ?? 0) * multiplier;
        }, 0)
      ),
      bookingTime: new Date().toISOString(),
      bookingId: `B${Date.now()}`,
    };

    // Log all booking details to console instead of WhatsApp
    console.log("🎬 Booking Confirmed:", bookingDetails);
    console.table(bookingDetails);

    setBooked(newBooked);
    setSelected(new Set());

    toast.success(
      <div>
        <div className="font-bold">Booking Confirmed! 🎉</div>
        <div className="text-sm">
          {bookingDetails.totalSeats} seat(s) booked successfully
        </div>
      </div>
    );
  };

  const basePrice = movie?.price ?? 0;
  const total=[...selected].reduce((sum, s) => {
    const rowLetter = s[0];
    const def = ROWS.find((r) => r.id === rowLetter);
    const multiplier = def?.type === "recliner" ? 1.5 : 1;
    return sum + basePrice * multiplier;
  }, 0);

  const selectedCount = selected.size;

  const audiForSlot = useMemo(() => {
    if (!movie || !slotKey) return null;
    try {
      const targetMs = new Date(slotKey).getTime();
      if (isNaN(targetMs)) return null;
      const slots = movie.slots || [];
      for (const s of slots) {
        let timeStr = null;
        if (typeof s === "string") timeStr = s;
        else if (s.datetime) timeStr = s.datetime;
        else if (s.time) timeStr = s.time;
        else if (s.iso) timeStr = s.iso;
        else if (s.date) timeStr = s.date;
        if (!timeStr) continue;
        const sMs = new Date(timeStr).getTime();
        if (sMs === targetMs) {
          return s.audi || s.audiName || s.auditorium || null;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [movie, slotKey]);//get audi for slot


  return (
    <div className={seatSelectorStyles.pageContainer}>
        <style>{seatSelectorStyles.customCSS}</style>
        <div className={seatSelectorStyles.mainContainer}>
            <div className={seatSelectorStyles.headerContainer}>
            <button className={seatSelectorStyles.backButton} onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Back
            </button>

            <div className={seatSelectorStyles.titleContainer}>
                <h1 className={seatSelectorStyles.movieTitle}>{movie?.title}</h1>
                {/* Header */}
                    <div className={seatSelectorStyles.showtimeText}>
                    {slotKey
                        ? new Date(slotKey).toLocaleString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "Showtime unavailable"}
                    </div>
            </div>
            <div
          style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
        >
          {audiForSlot && (
            <div
              style={{
                background: "linear-gradient(90deg,#ef4444,#dc2626)",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 12,
                fontWeight: 700,
                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
              }}
              title={`Auditorium: ${audiForSlot}`}
            >
              {audiForSlot}
            </div>
          )}
        </div>

        </div>

          <div className={seatSelectorStyles.screenContainer}>
            <div className={seatSelectorStyles.screen}
            style={{transform:"perspective(120px) rotateX(6deg)",
                maxWidth: 900,
                boxShadow:"0 0 40px rgba(220,38,38,0.18)",
            }}
            >
            <div className={seatSelectorStyles.screenText}>CURVED SCREEN</div>
            <div className={seatSelectorStyles.screenSubtext}>Please face the screen  -- enjoy the show</div>

            </div>

          </div>

          {/* MAIN CONTENT */}
                <div className={seatSelectorStyles.mainContent}>
                <div className={seatSelectorStyles.seatGridContainer}>
                    {ROWS.map((row) => (
                    <div key={row.id} className={seatSelectorStyles.rowContainer}>
                        <div className={seatSelectorStyles.rowHeader}>
                        <div className={seatSelectorStyles.rowLabel}>
                            {row.id}
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className={seatSelectorStyles.seatGrid}>
                                {Array.from({ length: row.count }).map((_, i) => {
                        const num = i + 1;
                        const id = seatId(row.id, num);
                        const isBooked = booked.has(id);
                        const isSelected = selected.has(id);
                        let cls = seatSelectorStyles.seatButton;
                        if (isBooked)
                          cls += ` ${seatSelectorStyles.seatButtonBooked}`;
                        else if (isSelected)
                          cls +=
                            row.type === "recliner"
                              ? ` ${seatSelectorStyles.seatButtonSelectedRecliner}`
                              : ` ${seatSelectorStyles.seatButtonSelectedStandard}`;
                        else
                          cls +=
                            row.type === "recliner"
                              ? ` ${seatSelectorStyles.seatButtonAvailableRecliner}`
                              : ` ${seatSelectorStyles.seatButtonAvailableStandard}`;
                        return (
                          <button
                            key={id}
                            onClick={() => toggleSeat(id)}
                            disabled={isBooked}
                            className={cls}
                            title={
                              isBooked
                                ? `Seat ${id} - Already Booked`
                                : `Seat ${id} (${row.type}) - ₹${
                                    row.type === "recliner"
                                      ? Math.round(basePrice * 1.5)
                                      : basePrice
                                  }`
                            }
                          >
                            <div className={seatSelectorStyles.seatContent}>
                              {row.type === "recliner" ? (
                                <Sofa
                                  size={16}
                                  className={seatSelectorStyles.seatIcon}
                                />
                              ) : (
                                <RockingChair
                                  size={12}
                                  className={seatSelectorStyles.seatIcon}
                                />
                              )}
                              <div className={seatSelectorStyles.seatNumber}>
                                {num}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                            </div>

                        </div>
                        <div className={seatSelectorStyles.rowType}>
                            {row.type}
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                {/* Booking Summary and Actions */}
                <div className={seatSelectorStyles.summaryGrid}>
                    <div className={seatSelectorStyles.summaryContainer}>
                        <h3 className={seatSelectorStyles.summaryTitle}>
                            <Ticket size={18} />Booking Summary
                        </h3>
                        <div className="space-y-4">
                            <div className={seatSelectorStyles.summaryItem}>
                                <span className={seatSelectorStyles.summaryLabel}>
                                    Selected Seats:
                                </span>
                                <span className={seatSelectorStyles.summaryValue}>
                                    {selectedCount} 
                                </span>

                            </div>
                            {selectedCount > 0 && (
                        <>
                            <div className={seatSelectorStyles.selectedSeatsContainer}>
                            <div className={seatSelectorStyles.selectedSeatsLabel}>
                                Selected Seats:
                            </div>
                            <div className={seatSelectorStyles.selectedSeatsList}>
                                {[...selected].sort().map((seat) => (
                                <span
                                    key={seat}
                                    className={seatSelectorStyles.selectedSeatBadge}
                                >
                                    {seat}
                                </span>
                                ))}
                            </div>
                            </div>
                            <div className={seatSelectorStyles.totalContainer}>
                            <div className={seatSelectorStyles.pricingRow}>
                                <span className={seatSelectorStyles.totalLabel}>
                                Total Amount:
                                </span>
                                <span className={seatSelectorStyles.totalValue}>
                                ₹{Math.round(total)}
                                </span>
                            </div>
                            </div>
                        </>
                        )}
                        {selectedCount === 0 && (
                            <div className={seatSelectorStyles.emptyState}>
                                <div className={seatSelectorStyles.emptyStateTitle}>
                                    No Seats Selected


                                </div>
                                <div className={seatSelectorStyles.emptyStateSubtitle}>
                                    Select seats from the grid to continue
                                </div>

                            </div>
                        )}
                        <div className={seatSelectorStyles.actionButtons}>
                            <button onClick={clearSelection} disabled={selectedCount === 0} className={seatSelectorStyles.clearButton}>
                                Clear
                            </button>
                            <button onClick={confirmBooking} disabled={selectedCount === 0} className={seatSelectorStyles.confirmButton}>
                                Confirm Booking
                            </button>

                        </div>

                        </div>
                    </div>

                    <div className={seatSelectorStyles.pricingContainer}>
                        <h3 className={seatSelectorStyles.pricingTitle}>
                            <CreditCard size={18} /> Pricing Info
                        </h3>
                        <div className="space-y-3">
                            <div className={seatSelectorStyles.pricingItem}>
                                <div className={seatSelectorStyles.pricingRow}>
                                    <div className={seatSelectorStyles.pricingLabel}>
                                        Standard
                                    </div>
                                    <div className={seatSelectorStyles.pricingValueStandard}>
                                        ₹{basePrice}
                                    </div>
                                </div>
                            </div>

                            <div className={seatSelectorStyles.pricingItem}>
                                <div className={seatSelectorStyles.pricingRow}>
                                    <div className={seatSelectorStyles.pricingLabel}>
                                        Recliner
                                    </div>
                                    <div className={seatSelectorStyles.pricingValueStandard}>
                                        ₹{Math.round(basePrice * 1.5)}
                                    </div>
                                </div>
                            </div>

                            <div className={seatSelectorStyles.pricingNote}>
                                All prices include taxes. No hidden charges. 🍿

                            </div>

                        </div>

                    </div>

                </div>
            </div>
            </div>

    </div>
  );
};

export default SeatSelectorPage;