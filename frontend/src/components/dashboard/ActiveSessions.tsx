import { useEffect, useState, useMemo } from 'react';
import api from '../../utils/api';
import { API_BASE_URL } from '../../utils/api';
import { FaPlaystation, FaDesktop, FaVrCardboard, FaGamepad } from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import UpdateSessionModal from './UpdateSessionModal';
import './ActiveSessions.css';
import { io } from 'socket.io-client';
import { isFunNightTime, isNormalHourTime } from '../../utils/pricing';


/* ---------------------------------------
   Device Icon Helper
--------------------------------------- */
const DeviceIcon = ({ type, size = 14 }: { type: string, size?: number }) => {
  switch (type) {
    case 'ps': return <FaPlaystation size={size} />;
    case 'pc': return <FaDesktop size={size} />;
    case 'vr': return <FaVrCardboard size={size} />;
    case 'wheel': return <GiSteeringWheel size={size} />;
    case 'metabat': return <GiCricketBat size={size} />;
    default: return <FaGamepad size={size} />;
  }
};


const socket = io(API_BASE_URL, {
  transports: ['websocket']
});


/* ---------------------------------------
   Types
--------------------------------------- */
interface ActiveSession {
  id: string;
  customer: string;
  startTime: string;   // ISO
  duration: number;    // hours
  peopleCount: number;
  price: number;
  paidAmount?: number;
  remainingAmount?: number;
  snacks: {name: string, quantity: number}[];

  devices: { type: 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat'; id: number | null }[];
  status: string;
}

const ActiveSessions = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------
     Initial fetch (ONLY ONCE)
  --------------------------------------- */
  const fetchSessions = async () => {
    try {
      const res = await api.get('/api/sessions/active');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load active sessions', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------
     Socket listeners
  --------------------------------------- */
  useEffect(() => {
    fetchSessions();

    socket.on('session:started', (session: ActiveSession) => {
      setSessions(prev => [...prev, session]);
    });

    socket.on('session:completed', ({ sessionId }) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    });

    socket.on('session:updated', async () => {
      // Rare event → safe to refresh list once
      const res = await api.get('/api/sessions/active');
      setSessions(res.data);
    });

    socket.on('booking:converted', async () => {
      // booking → session happened
      const res = await api.get('/api/sessions/active');
      setSessions(res.data);
    });

    return () => {
      socket.off('session:started');
      socket.off('session:completed');
      socket.off('session:updated');
      socket.off('booking:converted');
    };
  }, []);

  /* ---------------------------------------
     Timer for UI countdown AND Auto-Complete Logic
  --------------------------------------- */
  const [currentTime, setCurrentTime] = useState(Date.now());
  const processingRef = useState<Set<string>>(new Set())[0]; // Track processing IDs

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Check for sessions to auto-complete (expired by > 30 seconds)
      sessions.forEach(session => {
        const start = new Date(session.startTime).getTime();
        const totalDurationMs = session.duration * 60 * 60 * 1000;
        const end = start + totalDurationMs;
        const remaining = end - now;

        // If time is up by more than 30 seconds (-30000ms) AND it is fully paid
        // Strictly check that remainingAmount is 0 or less
        const isFullyPaid = (Number(session.remainingAmount) || 0) <= 0;

        if (remaining < -30000 && isFullyPaid && !processingRef.has(session.id)) {
          processingRef.add(session.id);
          console.log(`Auto-completing session ${session.id} because time is up > 30s and fully paid`);

          api.post(`/api/sessions/complete/${session.id}`)
            .then(() => {
              // Success - socket will remove it, or we can manually remove
              // If selected session matches, close modal
              if (selectedSession && selectedSession.id === session.id) {
                setSelectedSession(null);
              }
            })
            .catch(e => {
              console.error(`Failed to auto-complete session ${session.id}`, e);
              processingRef.delete(session.id); // Retry next tick
            });
        }
      });

    }, 1000);
    return () => clearInterval(timer);
  }, [sessions, selectedSession]);

  const isFunNight = isFunNightTime();
  const isNormalHour = isNormalHourTime();

  /* ---------------------------------------
     Remaining time helper
  --------------------------------------- */
  const getSessionDetails = (session: ActiveSession) => {
    const start = new Date(session.startTime).getTime();
    const totalDurationMs = session.duration * 60 * 60 * 1000;
    const end = start + totalDurationMs;

    const now = currentTime;
    const remaining = end - now;
    const isUnpaidFinished = remaining <= 0 && (Number(session.remainingAmount) || 0) > 0;

    // UI Logic for completed
    let timeText = "Completed";
    if (remaining > 0) {
      const hrs = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);
      timeText = `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
    } else {
      if (isUnpaidFinished) {
        timeText = "Payment Pending";
      } else if (remaining > -30000) {
        const vanishingIn = Math.ceil((30000 + remaining) / 1000);
        timeText = `Vanishing in ${vanishingIn}s`;
      } else {
        timeText = "Vanishing...";
      }
    }

    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDurationMs) * 100));
    const isCompleted = remaining <= 0 || session.status === 'completed';
    const isUrgent = !isCompleted && remaining < 10 * 60 * 1000 && remaining > 0;

    return { progress, isUrgent, isUnpaidFinished, isCompleted, timeText, remaining };
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };


  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <section className="active-sessions-container">

      {/* Header */}
      <div className="sessions-header">
        <h3 className="section-title-lg">Active Sessions
          {isFunNight && <span className="badge-fun-night">🌙 Fun Night</span>}
          {isNormalHour && <span className="badge-normal-hour">☀️ Normal Hour</span>}
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="player-count">
            {sessions.length} Players Online
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="sessions-grid-premium">
        {loading && <div style={{ color: '#fff' }}>Loading data...</div>}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <h4>No active sessions</h4>
            <p>The arena is currently empty.</p>
          </div>
        )}

        {!loading && sessions.map((session) => {
          const { progress, isUrgent, isUnpaidFinished, isCompleted, timeText } = getSessionDetails(session);
          const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={session.id}
              className={`session-card-premium ${isCompleted ? 'completed' : isUrgent ? 'urgent' : ''} ${isUnpaidFinished ? 'unpaid-finished' : ''}`}
              onClick={() => setSelectedSession(session)}
            >
              {/* Top Stripe - REMOVED for Neon Look */}

              <div className="card-content">
                {/* Header: User */}
                <div className="card-user-header">
                  <div className="user-avatar-glow">
                    {getInitials(session.customer)}
                  </div>
                  <div className="user-info">
                    <h4>{session.customer}</h4>
                    <p><span className="session-price">₹{session.remainingAmount}</span> • {session.peopleCount} Player{session.peopleCount > 1 ? 's' : ''}</p>
                    <div className="session-meta">
                      <span className="start-time">Started at {startTime}</span>
                      <span className={`time-badge ${isCompleted ? 'completed-badge' : isUrgent ? 'urgent-badge' : ''}`}>
                        {timeText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Devices (Made Bigger) */}
                <div className="devices-mini-grid">
                  {session.devices.map((dev, i) => (
                    <div key={i} className={`device-tag ${dev.type}`}>
                      <DeviceIcon type={dev.type} size={14} />
                      <span style={{ textTransform: 'uppercase' }}>
                        {dev.type} {dev.id ? `#${dev.id}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar (Attached to bottom) */}
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{ width: isCompleted ? '100%' : `${100 - progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {useMemo(() => {
        if (!selectedSession) return null;
        return (
          <UpdateSessionModal
            session={selectedSession}
            onClose={() => {
              setSelectedSession(null);
              fetchSessions(); // Refresh after update
            }}
          />
        );
      }, [selectedSession])}
    </section>
  );
};

export default ActiveSessions;
