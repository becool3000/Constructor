import React from 'react';

const Stat = ({ label, value, hint }) => (
  <div className="stat" role="group" aria-label={label}>
    <div>
      <strong>{label}</strong>
      {hint ? <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{hint}</div> : null}
    </div>
    <div>{value}</div>
  </div>
);

export default Stat;
