import React from 'react';
import './SessionEntry.css';

interface DeviceDropdownProps {
    label: string;
    limit: number;
    value: number[]; // Changed to array for multiple selection
    occupied: number[];
    icon: React.ReactNode;
    onChange: (val: number[]) => void;
}

const DeviceDropdown: React.FC<DeviceDropdownProps> = ({
    label,
    limit,
    value = [],
    occupied = [],
    icon,
    onChange
}) => {
    const availableCount = limit - occupied.length;
    const isEssentiallyFull = availableCount <= 0;

    const toggleSelection = (id: number) => {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id].sort((a, b) => a - b));
        }
    };

    return (
        <div className={`device-card-item ${value.length > 0 ? 'active' : ''}`}>
            <div className="device-icon-wrapper">
                {icon}
            </div>
            <div className="device-info">
                <span className="device-name">{label}</span>
                <span className="device-stock">
                    {value.length > 0
                        ? `${value.length} selected`
                        : (isEssentiallyFull ? 'Occupied' : `${availableCount} available`)
                    }
                </span>
            </div>

            <div className="device-chips-container">
                {Array.from({ length: limit }, (_, i) => i + 1).map(num => {
                    const isTaken = occupied.includes(num);
                    const isSelected = value.includes(num);

                    return (
                        <button
                            key={num}
                            className={`device-chip ${isSelected ? 'selected' : ''} ${isTaken ? 'occupied' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isTaken) toggleSelection(num);
                            }}
                            disabled={isTaken}
                            title={isTaken ? `Machine ${num} Occupied` : `Machine ${num}`}
                        >
                            {num}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DeviceDropdown;
