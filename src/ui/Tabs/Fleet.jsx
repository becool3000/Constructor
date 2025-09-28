import React from 'react';

const FleetTab = ({ state }) => (
  <div className="panel">
    <h2>Fleet Overview</h2>
    <div className="grid two">
      <div className="panel">
        <h3>Primary Truck</h3>
        <p>Condition: {(state.truck.condition * 100).toFixed(0)}%</p>
        <p>Capacity: {state.truck.capacity} units</p>
        <p>MPG: {state.truck.mpg}</p>
      </div>
      <div className="panel">
        <h3>Vehicles</h3>
        {state.fleet.vehicles.length === 0 ? (
          <p>Work truck ready. Additional fleet slots unlock later.</p>
        ) : (
          <ul>
            {state.fleet.vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                {vehicle.name} — Capacity {vehicle.capacity}, Condition {vehicle.condition}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

export default FleetTab;
