import React, { useState } from 'react';

const PrestigeTab = ({ state, prestige, onPrestige }) => {
  const [selected, setSelected] = useState([]);
  const available = (prestige.banked ?? 0) + (prestige.canPrestige ? prestige.earned : 0);

  const toggleChoice = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((choice) => choice !== id) : [...prev, id],
    );
  };

  const handlePrestige = () => {
    onPrestige(selected);
    setSelected([]);
  };

  return (
    <div className="panel">
      <h2>Prestige</h2>
      <p>
        Banked Charters: {prestige.banked} · Earned this run: {prestige.earned}
      </p>
      <p>
        Select permanent bonuses to carry over into your next career. Resetting will restart day 1
        with your chosen perks and banked charters.
      </p>
      <div className="grid two">
        {prestige.choices.map((choice) => {
          const isSelected = selected.includes(choice.id);
          return (
            <label key={choice.id} className="stat">
              <span>{choice.label}</span>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleChoice(choice.id)}
              />
            </label>
          );
        })}
      </div>
      <button
        type="button"
        className="primary"
        disabled={!prestige.canPrestige || selected.length > available}
        onClick={handlePrestige}
      >
        Reset for {selected.length} charter(s)
      </button>
    </div>
  );
};

export default PrestigeTab;
