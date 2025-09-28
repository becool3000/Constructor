import React from 'react';
import { getTool } from '../../logic/content.js';

const ToolsTab = ({ state, tools, onBuy }) => {
  return (
    <div className="panel">
      <h2>Tool Crib</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Cost</th>
            <th>Effects</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr key={tool.id}>
              <td>{tool.name}</td>
              <td>${tool.cost}</td>
              <td>
                {Object.entries(tool.effects).map(([key, value]) => (
                  <div key={key}>
                    {key}: {typeof value === 'number' ? value : JSON.stringify(value)}
                  </div>
                ))}
              </td>
              <td>
                <button
                  type="button"
                  className="primary"
                  onClick={() => onBuy(tool.id)}
                  disabled={state.resources.cash < tool.cost}
                >
                  Buy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel" style={{ marginTop: '1rem' }}>
        <h2>Owned Tools</h2>
        {state.tools.owned.length === 0 ? (
          <p>No tools yet.</p>
        ) : (
          <ul>
            {state.tools.owned.map((toolId) => {
              const tool = getTool(toolId);
              return <li key={toolId}>{tool?.name ?? toolId}</li>;
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ToolsTab;
