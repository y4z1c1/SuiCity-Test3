import React from "react";
import "../assets/styles/Modal.css"; // Add styles for modal

interface ModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
