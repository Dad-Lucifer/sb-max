import { useState, useEffect } from 'react';
import { GiCrossedSwords, GiTrophyCup } from 'react-icons/gi';
import { FaFire } from 'react-icons/fa';
import api, { API_BASE_URL } from '../../utils/api';
import { io } from 'socket.io-client';
import './ActiveBattles.css';

/* -------------------- Types -------------------- */

interface BattlePlayer {
    name: string;
    phone: string;
    score: number;
}

interface Battle {
    id: string;
    crownHolder: BattlePlayer;
    challenger: BattlePlayer;
    startTime: any; // Firestore timestamp
}

/* -------------------- Socket -------------------- */

// create socket ONCE
const socket = io(API_BASE_URL, {
    transports: ['websocket']
});

/* -------------------- Component -------------------- */

const ActiveBattles = () => {
    const [battles, setBattles] = useState<Battle[]>([]);

    /* -------------------- Initial Fetch -------------------- */

    const fetchBattles = async () => {
        try {
            const res = await api.get('/api/battles/active');
            setBattles(res.data);
        } catch (error) {
            console.error('❌ Failed to fetch battles:', error);
        }
    };

    /* -------------------- Socket Listeners -------------------- */

    useEffect(() => {
        // 1️⃣ Fetch ONCE on load
        fetchBattles();

        // 2️⃣ Score updates


        // 3️⃣ Battle finished
        socket.on('battle:finished', ({ battleId }) => {
            setBattles(prev => prev.filter(b => b.id !== battleId));
            sessionStorage.removeItem('an_battles_v1');
        });

        // 4️⃣ New battle started
        socket.on('battle:started', (battle: Battle) => {
            setBattles(prev => [battle, ...prev]);
        });

        return () => {
            socket.off('battle:scoreUpdated');
            socket.off('battle:finished');
            socket.off('battle:started');
        };
    }, []);

    /* -------------------- Actions -------------------- */

    const updateScore = async (
        id: string,
        player: 'crownHolder' | 'challenger'
    ) => {
        try {
            // Optimistic update
            setBattles(prev =>
                prev.map(b =>
                    b.id === id
                        ? {
                            ...b,
                            [player]: {
                                ...b[player],
                                score: b[player].score + 1
                            }
                        }
                        : b
                )
            );

            await api.post(
                `/api/battles/score/${id}`,
                { player }
            );
        } catch (error) {
            console.error(error);
            fetchBattles(); // resync on error
        }
    };

    const finishBattle = async (id: string) => {
        if (!window.confirm('End this battle?')) return;

        try {
            await api.post(
                `/api/battles/finish/${id}`
            );
            sessionStorage.removeItem('an_battles_v1');
            // removal handled by socket event
        } catch (error) {
            console.error(error);
        }
    };

    /* -------------------- Helpers -------------------- */

    const getDuration = (startTime: any) => {
        if (!startTime) return '';
        const start =
            startTime.seconds
                ? startTime.seconds * 1000
                : new Date(startTime).getTime();

        const mins = Math.floor((Date.now() - start) / 60000);
        return `${mins}m elapsed`;
    };

    /* -------------------- UI -------------------- */

    return (
        <section className="active-battles-container">
            <div className="battles-header">
                <h3 className="battles-title">
                    <GiCrossedSwords className="icon-battle-red" />
                    Live Battles
                </h3>
                <span className="battles-count">
                    {battles.length} active matches
                </span>
            </div>

            {battles.length === 0 ? (
                <div className="empty-state">
                    <GiCrossedSwords size={48} />
                    <p>No active battles</p>
                </div>
            ) : (
                <div className="battles-grid">
                    {battles.map(battle => (
                        <div key={battle.id} className="battle-card">
                            {/* Status */}
                            <div className="battle-status-bar">
                                <div className="live-badge">
                                    <div className="live-dot" /> LIVE
                                </div>
                                <span>{getDuration(battle.startTime)}</span>
                            </div>

                            {/* Content */}
                            <div className="battle-content">
                                <div className="battle-vs-layout">
                                    <div className="player-side">
                                        <div className="crown-hold player-score">
                                            {battle.crownHolder.score}
                                        </div>
                                        <span className="player-name">
                                            {battle.crownHolder.name}
                                        </span>
                                        <div className="player-meta">
                                            <GiTrophyCup /> Crown Holder
                                        </div>
                                    </div>

                                    <div className="vs-divider">VS</div>

                                    <div className="player-side challenger">
                                        <div className="chal-hold player-score">
                                            {battle.challenger.score}
                                        </div>
                                        <span className="player-name">
                                            {battle.challenger.name}
                                        </span>
                                        <div className="player-meta">
                                            Challenger <FaFire />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="battle-footer">
                                <button
                                    className="action-btn"
                                    onClick={() =>
                                        updateScore(battle.id, 'crownHolder')
                                    }
                                >
                                    + Crown Score
                                </button>
                                <button
                                    className="action-btn"
                                    onClick={() =>
                                        updateScore(battle.id, 'challenger')
                                    }
                                >
                                    + Chal. Score
                                </button>
                                <button
                                    className="action-btn finish"
                                    onClick={() => finishBattle(battle.id)}
                                >
                                    Finish Match
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default ActiveBattles;
