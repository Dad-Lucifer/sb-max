import { useState } from 'react';
import { GiCrossedSwords } from 'react-icons/gi';

import PlayersBattleModal from './PlayersBattleModal';
import './PlayersBattle.css';

const PlayersBattle = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div
                className="battle-launcher-card"
                onClick={() => setIsOpen(true)}
                role="button"
                tabIndex={0}
            >
                <div className="launcher-icon-wrapper">
                    <GiCrossedSwords size={32} color="#facc15" />
                </div>
                <h3 className="launcher-title">Battle Arena</h3>
                <p className="launcher-subtitle">
                    Register new players, track scores, and manage tournaments.
                </p>
            </div>

            <PlayersBattleModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};

export default PlayersBattle;
