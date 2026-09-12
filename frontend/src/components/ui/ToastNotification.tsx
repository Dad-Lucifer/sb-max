import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './ToastNotification.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    onClose: (id: string) => void;
    duration?: number;
}

const icons = {
    success: <FaCheckCircle className="toast-icon success" />,
    error: <FaExclamationTriangle className="toast-icon error" />,
    warning: <FaExclamationTriangle className="toast-icon warning" />,
    info: <FaInfoCircle className="toast-icon info" />
};

const ToastNotification: React.FC<ToastProps> = ({ id, type, message, onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`toast-card ${type}`}
        >
            <div className="toast-content">
                {icons[type]}
                <p className="toast-message">{message}</p>
            </div>
            <button onClick={() => onClose(id)} className="toast-close">
                <FaTimes />
            </button>

            {/* Progress Bar */}
            <motion.div
                className={`toast-progress ${type}`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
            />
        </motion.div>
    );
};

export default ToastNotification;
