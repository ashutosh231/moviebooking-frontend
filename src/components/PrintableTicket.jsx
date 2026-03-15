import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Reusable styling for the printable ticket
// We use inline styles heavily to ensure html2canvas captures it perfectly
const styles = {
  container: {
    width: '800px', // Fixed dimensions for the PDF capture
    backgroundColor: '#0f0f11', // Very dark cinematic theme
    color: '#ffffff',
    fontFamily: '"Cinzel", "Times New Roman", serif, sans-serif',
    display: 'flex',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '2px solid #2a2a35',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: '-9999px', // Hide entirely from screen
    left: '-9999px',
    zIndex: -1,
  },
  leftCol: {
    width: '30%',
    position: 'relative',
    backgroundColor: '#1a1a24'
  },
  poster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.9,
    borderRight: '1px solid #333'
  },
  rightCol: {
    width: '70%',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #181820 0%, #0d0d12 100%)'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #333',
    paddingBottom: '20px',
    marginBottom: '20px'
  },
  brand: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#e50914', // CineVerse red
    letterSpacing: '2px',
    textTransform: 'uppercase'
  },
  ticketType: {
    fontSize: '14px',
    letterSpacing: '5px',
    color: '#888',
    textTransform: 'uppercase'
  },
  titleDetailsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px'
  },
  movieTitle: {
    fontSize: '36px',
    fontWeight: '900',
    letterSpacing: '1px',
    margin: '0',
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
  },
  badgeList: {
    display: 'flex',
    gap: '12px'
  },
  badge: {
    padding: '4px 10px',
    border: '1px solid #444',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#ccc',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px',
    marginBottom: '30px'
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  infoLabel: {
    fontSize: '11px',
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: '1.5px'
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#eee',
    fontFamily: '"Inter", sans-serif'
  },
  seatsValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#eee',
    lineHeight: '1.4'
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px dashed #444',
    paddingTop: '20px'
  },
  priceBlock: {
    display: 'flex',
    flexDirection: 'column'
  },
  priceVal: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#e50914',
    marginTop: '4px'
  },
  qrContainer: {
    background: '#fff',
    padding: '10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingIdBlock: {
    textAlign: 'right'
  },
  bookingIdVal: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#aaa',
    marginTop: '6px'
  }
};

const PrintableTicket = forwardRef(({ ticket }, ref) => {
  if (!ticket) return null;

  const {
    id,
    title,
    poster,
    category,
    durationMins,
    slotTime,
    auditorium,
    seats,
    amount
  } = ticket;

  const qrPayload = JSON.stringify({
    bookingId: id,
    title,
    time: slotTime ? new Date(slotTime).toLocaleString() : '',
    auditorium,
    seats: seats.map(s => s.id).join(", ")
  });

  const seatStr = seats && seats.length
     ? seats.map(s => `${s.id} (${s.type})`).join(', ')
     : 'Unknown Seats';

  const timeStr = slotTime 
    ? new Date(slotTime).toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'N/A';

  const durationStr = durationMins ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` : '';

  return (
    <div style={styles.container} ref={ref}>
      {/* LEFT COLUMN: Movie Poster */}
      <div style={styles.leftCol}>
        <img 
          src={poster} 
          alt={title} 
          style={styles.poster} 
          crossOrigin="anonymous" 
        />
      </div>

      {/* RIGHT COLUMN: Ticket Details */}
      <div style={styles.rightCol}>
        <div style={styles.headerRow}>
          <div style={styles.brand}>🎬 CineVerse</div>
          <div style={styles.ticketType}>ADMISSION TICKET</div>
        </div>

        <div style={styles.titleDetailsRow}>
          <h1 style={styles.movieTitle}>{title}</h1>
          <div style={styles.badgeList}>
            {category && <span style={styles.badge}>{category}</span>}
            {durationStr && <span style={styles.badge}>⏳ {durationStr}</span>}
            <span style={styles.badge}>{auditorium}</span>
          </div>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoBlock}>
            <span style={styles.infoLabel}>Date & Time</span>
            <span style={styles.infoValue}>{timeStr.split(',')[0]}<br/>{timeStr.split(',')[1]}</span>
          </div>
          <div style={styles.infoBlock}>
            <span style={styles.infoLabel}>Seats ({seats.length})</span>
            <span style={styles.seatsValue}>{seatStr}</span>
          </div>
          <div style={styles.infoBlock}>
             <div style={styles.qrContainer}>
                <QRCodeSVG value={qrPayload} size={84} level={"M"} />
             </div>
          </div>
        </div>

        <div style={styles.footerRow}>
          <div style={styles.priceBlock}>
            <span style={styles.infoLabel}>Total Amount Paid</span>
            <span style={styles.priceVal}>₹{Number(amount).toLocaleString('en-IN')}</span>
          </div>
          <div style={styles.bookingIdBlock}>
             <span style={styles.infoLabel}>Booking ID</span>
             <div style={styles.bookingIdVal}>{id}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintableTicket;
