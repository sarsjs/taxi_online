import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GananciasChart = ({ datos, tipo }) => {
  const graficaTipo = tipo === 'ganancias' ? 'line' : 'bar';
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label} : $${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        {graficaTipo === 'line' ? (
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="ganancia" 
              stroke="#0FA958" 
              activeDot={{ r: 8 }} 
              name="Ganancias ($)" 
            />
          </LineChart>
        ) : (
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="viajes" 
              fill="#2E3A59" 
              name="Viajes" 
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default GananciasChart;