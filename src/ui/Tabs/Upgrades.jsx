import React from 'react';
import { getUpgrade } from '../../logic/content.js';

const UpgradesTab = ({ state, upgrades, onBuy }) => (
  <div className="panel">
    <h2>Upgrades</h2>
    <table className="table">
      <thead>
        <tr>
          <th>Upgrade</th>
          <th>Cost</th>
          <th>Effects</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {upgrades.map((upgrade) => (
          <tr key={upgrade.id}>
            <td>{upgrade.name}</td>
            <td>${upgrade.cost}</td>
            <td>
              {Object.entries(upgrade.effects).map(([key, value]) => (
                <div key={key}>
                  {key}: {typeof value === 'number' ? value : JSON.stringify(value)}
                </div>
              ))}
            </td>
            <td>
              <button
                type="button"
                className="primary"
                onClick={() => onBuy(upgrade.id)}
                disabled={state.resources.cash < upgrade.cost}
              >
                Purchase
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="panel" style={{ marginTop: '1rem' }}>
      <h2>Owned Upgrades</h2>
      {state.upgrades.owned.length === 0 ? (
        <p>No upgrades purchased yet.</p>
      ) : (
        <ul>
          {state.upgrades.owned.map((id) => {
            const upgrade = getUpgrade(id);
            return <li key={id}>{upgrade?.name ?? id}</li>;
          })}
        </ul>
      )}
    </div>
  </div>
);

export default UpgradesTab;
