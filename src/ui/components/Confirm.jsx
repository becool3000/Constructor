import React from 'react';

const Confirm = ({ label, message, onConfirm, children }) => {
  const handleClick = () => {
    const ok = typeof window !== 'undefined' ? window.confirm(message) : true;
    if (ok) onConfirm();
  };
  return (
    <button type="button" className="secondary" aria-label={label} onClick={handleClick}>
      {children ?? label}
    </button>
  );
};

export default Confirm;
