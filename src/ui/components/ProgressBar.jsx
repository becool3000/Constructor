import React from 'react';

const formatPercent = (value) => `${Math.min(100, Math.max(0, value)).toFixed(0)}%`;

const ProgressBar = ({ value = 0, max = 1, label }) => {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="progress-row">
      {label ? <div>{label}</div> : null}
      <div
        className="progress-container"
        role="progressbar"
        aria-valuenow={Math.min(percent, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'progress'}
      >
        <div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <small>{formatPercent(percent)}</small>
    </div>
  );
};

export default ProgressBar;
