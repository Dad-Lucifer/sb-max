import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronRight, FaChevronLeft, FaCalendarAlt, FaPlus, FaTrash, FaBolt } from 'react-icons/fa';
import { FaPlaystation, FaDesktop, FaVrCardboard, FaGamepad } from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import BookingModal from './BookingModal';
import ConfirmationModal from './ConfirmationModal';
import './UpcomingBookings.css';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type DeviceType = 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat';

interface BookingDevice {
  type: DeviceType;
  id: number | null;
}

interface Booking {
  id: string;
  name: string;
  time: string;
  endTime?: string;
  devices: BookingDevice[];
  peopleCount?: number;
  duration?: number;
}

const UpcomingBookings = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { user } = useAuth();
  const { showToast } = useToast();

  const [startingIds, setStartingIds] = useState<Set<string>>(new Set());
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Update clock every minute for countdown and button activation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000); // 1 min update
    return () => clearInterval(timer);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('https://lavenderblush-chicken-803718.hostingersite.com0/api/sessions/upcoming');
      // Sort bookings chronologically
      const sorted = res.data.sort((a: Booking, b: Booking) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setBookings(sorted);
    } catch (error) {
      console.error('Failed to load upcoming bookings', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // No more automatic start check here! Handled manually by user click.
  }, []);

  const handleStartSession = async (booking: Booking) => {
    if (startingIds.has(booking.id)) return;

    setStartingIds(prev => new Set(prev).add(booking.id));

    try {
      await axios.post(`https://lavenderblush-chicken-803718.hostingersite.com0/api/sessions/start-booking/${booking.id}`);
      showToast(`${booking.name}'s session has started.`, 'success');
      fetchBookings(); // Refresh the active sessions board somehow? The Dashboard usually polls or gets sockets.
    } catch (error: any) {
      console.error('Error starting booking:', error);
      showToast(error.response?.data?.message || 'Failed to start session', 'error');
    } finally {
      setStartingIds(prev => {
        const next = new Set(prev);
        next.delete(booking.id);
        return next;
      });
    }
  };

  const confirmDeleteBooking = async () => {
    if (!deleteData) return;

    try {
      await axios.delete(`https://lavenderblush-chicken-803718.hostingersite.com0/api/sessions/booking/${deleteData.id}`, {
        data: {
          deletedBy: user?.role === 'owner' ? 'Owner' : 'Employee',
          deletedByName: user?.username || 'Unknown'
        }
      });
      fetchBookings();
      setDeleteData(null);
      showToast(`${deleteData.name}'s booking cancelled`, 'success');
    } catch (error) {
      console.error('Error deleting booking:', error);
      showToast('Failed to cancel booking', 'error');
    }
  };

  const getDeviceIcon = (device: DeviceType) => {
    switch (device) {
      case 'ps': return <FaPlaystation />;
      case 'pc': return <FaDesktop />;
      case 'vr': return <FaVrCardboard />;
      case 'wheel': return <GiSteeringWheel />;
      case 'metabat': return <GiCricketBat />;
      default: return <FaGamepad />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <section className="upcoming-bookings-container">
      <div className="bookings-header">
        <div className="bookings-header-left">
          <h3 className="bookings-title">
            <FaCalendarAlt className="icon-gold" />
            Launch Protocol
          </h3>
          <p className="bookings-subtitle" style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {bookings.length} reservations queued
          </p>
        </div>

        <div className="bookings-actions">
          <button className="new-booking-btn" onClick={() => setShowModal(true)}>
            <FaPlus /> Initialize Booking
          </button>
          <div className="scroll-controls">
            <button className="scroll-btn" onClick={() => scroll('left')}><FaChevronLeft /></button>
            <button className="scroll-btn" onClick={() => scroll('right')}><FaChevronRight /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bookings-timeline skeleton">
          {[1, 2, 3].map(i => <div key={i} className="ticket-skeleton" />)}
        </div>
      ) : bookings.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-bookings-state">
          <div className="empty-icon"><FaCalendarAlt /></div>
          <h4 className="empty-title">Queue Empty</h4>
          <p className="empty-subtitle">Standby for incoming reservations.</p>
        </motion.div>
      ) : (
        <div className="bookings-timeline" ref={scrollRef}>
          <AnimatePresence>
            {bookings.map((booking, index) => {
              const bookingTime = new Date(booking.time).getTime();
              const timeDiff = bookingTime - currentTime;

              // We consider it "Ready" if it is past the start time OR within 5 minutes of it
              const isReadyToStart = timeDiff <= (5 * 60 * 1000);
              const isOverdue = timeDiff < 0;
              const isStarting = startingIds.has(booking.id);

              let statusText = 'SCHEDULED';
              let statusColor = '#94a3b8';
              let timeUntilText = '';

              if (isReadyToStart) {
                statusText = isOverdue ? 'OVERDUE' : 'STANDBY';
                statusColor = isOverdue ? '#ef4444' : '#fbbf24';
              } else {
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const mins = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                timeUntilText = hours > 0 ? `T-${hours}H ${mins}M` : `T-${mins}M`;
              }

              return (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                  className={`booking-ticket ${isReadyToStart ? 'ready' : ''} ${isOverdue ? 'overdue' : ''}`}
                >
                  {/* LEFT: INFORMATION */}
                  <div className="ticket-main">
                    <div className="ticket-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="status-indicator" style={{ background: statusColor }}></div>
                        <span className="status-text" style={{ color: statusColor }}>{statusText}</span>
                      </div>
                      <button className="delete-btn" onClick={() => setDeleteData({ isOpen: true, id: booking.id, name: booking.name })} title="Cancel Booking">
                        <FaTrash />
                      </button>
                    </div>

                    <div className="ticket-time">
                      <span className="time-primary">{formatTime(booking.time)}</span>
                      {timeUntilText && <span className="time-countdown">{timeUntilText}</span>}
                    </div>

                    <div className="ticket-customer">
                      <span className="customer-name">{booking.name}</span>
                      <span className="customer-meta">
                        {booking.peopleCount || 1} PAX
                        {booking.duration ? ` // ${booking.duration} HR` : ''}
                      </span>
                    </div>

                    <div className="ticket-devices">
                      {booking.devices.map((dev, i) => (
                        <div key={i} className={`device-tag ${dev.type}`} title={dev.type}>
                          {getDeviceIcon(dev.type)}
                          {dev.id && <span className="dev-id">#{dev.id}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: ACTION (Perforated Edge) */}
                  <div className="ticket-action">
                    <div className="perforation"></div>

                    {isReadyToStart ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`start-action-btn ${isStarting ? 'loading' : ''} ${isOverdue ? 'urgent' : ''}`}
                        onClick={() => handleStartSession(booking)}
                        disabled={isStarting}
                      >
                        {isStarting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}><FaBolt /></motion.div>
                        ) : (
                          <>
                            <FaBolt className="action-icon" />
                            <span>START</span>
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <div className="locked-action">
                        <div className="locked-pulse"></div>
                        <span>LOCKED</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showModal && (
        <BookingModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchBookings(); }} />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteData?.isOpen}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDeleteBooking}
        title="Abort Launch?"
        message={`Are you sure you want to cancel the reservation for ${deleteData?.name}? This action cannot be reversed.`}
        isDanger={true}
      />
    </section>
  );
};

export default UpcomingBookings;
