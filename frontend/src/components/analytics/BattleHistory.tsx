import React, { useState, useMemo } from 'react';
import { FaCrown, FaSearch, FaClock, FaBolt, FaTrophy } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import './BattleHistory.css';

export interface BattlePlayer {
    name: string;
    phone?: string;
    teamName?: string;
    score: number;
}

export interface CompletedBattle {
    id: string;
    crownHolder: BattlePlayer;
    challenger: BattlePlayer;
    winner?: string;
    config?: {
        gameType?: string;
        matchType?: string;
        entryFee?: number;
    };
    startTime?: string;
    endTime?: string;
    createdAt?: string;
}

interface Props {
    data: CompletedBattle[];
    loading?: boolean;
}

const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffSeconds) || diffSeconds < 0) return '';
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatFullTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const BattleHistory: React.FC<Props> = ({ data = [], loading = false }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBattles = useMemo(() => {
        if (!Array.isArray(data)) return [];

        return data.filter(b => {
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();

            const p1 = (b.crownHolder?.name || '').toLowerCase();
            const p2 = (b.challenger?.name || '').toLowerCase();
            const winner = (b.winner || '').toLowerCase();
            const gameType = (b.config?.gameType || '').toLowerCase();
            const matchType = (b.config?.matchType || '').toLowerCase();

            return p1.includes(term) || p2.includes(term) || winner.includes(term) || gameType.includes(term) || matchType.includes(term);
        });
    }, [data, searchTerm]);

    if (loading) {
        return (
            <div className="bh-container">
                <div className="an-skeleton" style={{ padding: '3rem 0' }}>
                    <GiCrossedSwords style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite' }} />
                    <span>Loading battle history...</span>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bh-empty">
                <GiCrossedSwords />
                <div className="bh-empty-title">No Battles Completed Yet</div>
                <div className="bh-empty-desc">
                    Finished battles from Live Battles arena will automatically appear here with complete match stats.
                </div>
            </div>
        );
    }

    return (
        <div className="bh-container">
            {/* Search and Filters */}
            <div className="bh-controls">
                <div className="bh-search-box">
                    <FaSearch />
                    <input
                        type="text"
                        className="bh-search-input"
                        placeholder="Search by player name or game type..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bh-count-badge">
                    {filteredBattles.length} of {data.length} match{data.length === 1 ? '' : 'es'}
                </div>
            </div>

            {/* Battles List */}
            {filteredBattles.length === 0 ? (
                <div className="bh-empty" style={{ padding: '2rem 1rem' }}>
                    <FaSearch style={{ fontSize: '2rem', opacity: 0.2 }} />
                    <div className="bh-empty-title">No matches found</div>
                    <div className="bh-empty-desc">No battles match "{searchTerm}"</div>
                </div>
            ) : (
                <div className="bh-list">
                    {filteredBattles.map(battle => {
                        const p1 = battle.crownHolder || { name: 'Player 1', score: 0 };
                        const p2 = battle.challenger || { name: 'Player 2', score: 0 };

                        const isTie = battle.winner === 'tie' || (!battle.winner && p1.score === p2.score);
                        const isP1Winner = !isTie && battle.winner?.toLowerCase() === p1.name?.toLowerCase();
                        const isP2Winner = !isTie && battle.winner?.toLowerCase() === p2.name?.toLowerCase();

                        const matchTime = battle.endTime || battle.createdAt || battle.startTime;
                        const timeAgo = formatTimeAgo(matchTime);
                        const fullTime = formatFullTime(matchTime);

                        return (
                            <div key={battle.id} className="bh-card">
                                {/* Header: Tags & Time */}
                                <div className="bh-card-header">
                                    <div className="bh-tags">
                                        <span className="bh-tag bh-tag-accent">
                                            {battle.config?.matchType || 'Solo'}
                                        </span>
                                        <span className="bh-tag">
                                            {battle.config?.gameType || 'Standard'}
                                        </span>
                                        {Number(battle.config?.entryFee) > 0 && (
                                            <span className="bh-tag" style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)' }}>
                                                ₹{battle.config?.entryFee}
                                            </span>
                                        )}
                                    </div>
                                    <div className="bh-time" title={fullTime}>
                                        <FaClock />
                                        <span>{timeAgo || fullTime}</span>
                                    </div>
                                </div>

                                {/* Matchup Showdown */}
                                <div className="bh-matchup">
                                    {/* Player 1 (Crown Holder) */}
                                    <div className={`bh-player ${isP1Winner ? 'is-winner' : ''}`}>
                                        <div className="bh-player-header">
                                            {isP1Winner && <FaCrown className="bh-crown-icon" />}
                                            <span className="bh-player-name">{p1.name}</span>
                                        </div>
                                        {p1.teamName && (
                                            <span className="bh-player-phone">{p1.teamName}</span>
                                        )}
                                        <div className="bh-player-score-row">
                                            <span className="bh-score">{p1.score ?? 0}</span>
                                        </div>
                                    </div>

                                    {/* VS Divider */}
                                    <div className="bh-vs-badge">
                                        <GiCrossedSwords style={{ color: '#64748b', fontSize: '1.1rem' }} />
                                        <span className="bh-vs-pill">VS</span>
                                    </div>

                                    {/* Player 2 (Challenger) */}
                                    <div className={`bh-player player-right ${isP2Winner ? 'is-winner' : ''}`}>
                                        <div className="bh-player-header">
                                            {isP2Winner && <FaCrown className="bh-crown-icon" />}
                                            <span className="bh-player-name">{p2.name}</span>
                                        </div>
                                        {p2.teamName && (
                                            <span className="bh-player-phone">{p2.teamName}</span>
                                        )}
                                        <div className="bh-player-score-row">
                                            <span className="bh-score">{p2.score ?? 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer: Result & Reward */}
                                <div className="bh-card-footer">
                                    <div className={`bh-winner-info ${isTie ? 'is-tie' : ''}`}>
                                        {isTie ? (
                                            <>
                                                <span>🤝 Match Drawn ({p1.score} - {p2.score})</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaTrophy style={{ color: '#fbbf24' }} />
                                                <span>Winner: {isP1Winner ? p1.name : (isP2Winner ? p2.name : battle.winner)}</span>
                                            </>
                                        )}
                                    </div>
                                    {!isTie && (
                                        <div className="bh-coin-reward">
                                            <FaBolt />
                                            <span>+15 Thunder Coins</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BattleHistory;
