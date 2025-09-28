import React, { useState } from 'react';

const bundles = [
  { label: 'Lumber x5 ($200)', materials: { lumber: 5 }, cost: 200 },
  { label: 'Concrete x5 ($400)', materials: { concrete: 5 }, cost: 400 },
  { label: 'Steel x3 ($195)', materials: { steel: 3 }, cost: 195 },
  { label: 'Fuel x20 ($500)', materials: { fuel: 20 }, cost: 500 },
];

const FinanceTab = ({ state, onExport, onImport, onBuyMaterials }) => {
  const [importText, setImportText] = useState('');
  const ledger = [...state.ledger].reverse();
  return (
    <div className="panel">
      <h2>Finance</h2>
      <div className="grid two">
        <div className="panel">
          <h3>Quick Orders</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {bundles.map((bundle) => (
              <button
                key={bundle.label}
                type="button"
                className="secondary"
                onClick={() => onBuyMaterials(bundle)}
                disabled={state.resources.cash < bundle.cost}
              >
                {bundle.label}
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Import Save</h3>
          <textarea
            style={{ width: '100%', minHeight: '120px', background: 'rgba(15,23,42,0.8)', color: 'inherit' }}
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            aria-label="Import save data"
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="secondary" onClick={() => setImportText(onExport())}>
              Load Current Save
            </button>
            <button type="button" className="secondary" onClick={() => onImport(importText)}>
              Apply Import
            </button>
          </div>
        </div>
      </div>
      <div className="panel" style={{ marginTop: '1rem' }}>
        <h3>Ledger</h3>
        {ledger.length === 0 ? (
          <p>No ledger entries yet.</p>
        ) : (
          <ul>
            {ledger.map((entry) => (
              <li key={entry.id}>
                {entry.label} — {entry.delta}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FinanceTab;
