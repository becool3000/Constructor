import React from 'react';

const TabBar = ({ tabs, active, onSelect }) => (
  <div className="tab-bar" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab}
        type="button"
        role="tab"
        aria-selected={active === tab}
        className={active === tab ? 'active' : ''}
        onClick={() => onSelect(tab)}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default TabBar;
