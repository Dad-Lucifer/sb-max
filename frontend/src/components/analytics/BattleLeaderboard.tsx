import React, { useMemo } from 'react';
import { FaCrown } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

interface BattlePlayer { name: string; phone: string; age?: string; score: number; }
interface CompletedBattle {
    id: string; crownHolder: BattlePlayer; challenger: BattlePlayer;
    startTime: string; endTime: string; winner?: string;
}
interface LeaderboardEntry { name: string; wins: number; totalBattles: number; totalScore: number; winRate: number; }

const BattleLeaderboard: React.FC<{ data: CompletedBattle[]; loading?: boolean }> = ({ data, loading }) => {
    const leaderboard = useMemo<LeaderboardEntry[]>(() => {
        const map = new Map<string, LeaderboardEntry>();
        const process = (player: BattlePlayer, isWinner: boolean) => {
            const e = map.get(player.name);
            if (e) {
                e.totalBattles += 1;
                e.totalScore += player.score;
                if (isWinner) e.wins += 1;
                e.winRate = (e.wins / e.totalBattles) * 100;
            } else {
                map.set(player.name, {
                    name: player.name, wins: isWinner ? 1 : 0,
                    totalBattles: 1, totalScore: player.score,
                    winRate: isWinner ? 100 : 0,
                });
            }
        };
        if (Array.isArray(data)) {
            data.forEach(b => {
                if (b?.crownHolder?.name) {
                    const isWinner = Boolean(b.winner && b.winner.toLowerCase() === b.crownHolder.name.toLowerCase());
                    process(b.crownHolder, isWinner);
                }
                if (b?.challenger?.name) {
                    const isWinner = Boolean(b.winner && b.winner.toLowerCase() === b.challenger.name.toLowerCase());
                    process(b.challenger, isWinner);
                }
            });
        }
        return Array.from(map.values()).sort((a, b) =>
            b.wins !== a.wins ? b.wins - a.wins : b.winRate - a.winRate
        );
    }, [data]);

    if (loading) return <div className="an-skeleton">Loading…</div>;
    if (!leaderboard.length) return (
        <div className="an-empty">
            <GiCrossedSwords />
            <span>No battles completed yet</span>
        </div>
    );

    const rankClass = (i: number) =>
        i === 0 ? 'an-rank-1' : i === 1 ? 'an-rank-2' : i === 2 ? 'an-rank-3' : 'an-rank-default';

    return (
        <div className="an-lb-list">
            {leaderboard.map((entry, i) => (
                <div key={entry.name} className="an-lb-item">
                    <div className={`an-lb-rank ${rankClass(i)}`}>
                        {i === 0 ? <FaCrown /> : `#${i + 1}`}
                    </div>
                    <div className="an-lb-info">
                        <div className="an-lb-name">{entry.name}</div>
                        <div className="an-lb-meta">
                            <span>{entry.totalBattles}B</span>
                            <span>·</span>
                            <span>{entry.winRate.toFixed(0)}% WR</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <div className="an-lb-right an-lb-wins">
                            {entry.wins} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>W</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{entry.totalScore} pts</div>
                    </div>
                    {i === 0 && <span className="an-champion-tag">Champ</span>}
                </div>
            ))}
        </div>
    );
};

export default BattleLeaderboard;
