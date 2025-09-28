import React from 'react';

const Row = ({ left, right }) => (
  <div className="row">
    <div>{left}</div>
    <div>{right}</div>
  </div>
);

export default Row;
