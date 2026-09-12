import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    isDanger?: boolean;
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    isDanger = false,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="confirmation-backdrop" onClick={onClose}>
                <motion.div
                    className="confirmation-modal"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    <div className={`icon-wrapper ${isDanger ? 'danger' : 'warning'}`}>
                        {isDanger ? <FaTrash size={24} /> : <FaExclamationTriangle size={24} />}
                    </div>

                    <h3 className="confirmation-title">{title}</h3>
                    <p className="confirmation-message">{message}</p>

                    <div className="confirmation-actions">
                        <button
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className={`btn-confirm ${isDanger ? 'danger' : 'primary'}`}
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="spinner-border-sm">Processing...</span>
                            ) : (
                                "Confirm"
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
