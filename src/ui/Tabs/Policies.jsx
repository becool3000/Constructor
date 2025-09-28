import React from 'react';
import { content } from '../../logic/content.js';

const PoliciesTab = ({ state, onChange }) => (
  <div className="panel">
    <h2>Company Policies</h2>
    <div className="grid two">
      {content.policies.map((policy) => {
        const value = state.policies[policy.id];
        if (policy.type === 'toggle') {
          return (
            <label key={policy.id} className="stat">
              <span>{policy.name}</span>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => onChange(policy.id, event.target.checked)}
              />
            </label>
          );
        }
        return (
          <label key={policy.id} className="stat">
            <span>{policy.name}</span>
            <select value={value} onChange={(event) => onChange(policy.id, Number(event.target.value))}>
              {policy.values.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  </div>
);

export default PoliciesTab;
