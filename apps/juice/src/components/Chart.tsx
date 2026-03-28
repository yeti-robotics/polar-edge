import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { MatchData } from './FileUpload';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: MatchData;
  title: string;
  dataKey: 'voltage' | 'current' | 'power' | 'ratio';
  color: string;
  unit: string;
}

export default function Chart({ data, title, dataKey, color, unit }: ChartProps) {
  const getChartData = () => {
    let values: number[] = [];
    
    switch (dataKey) {
      case 'voltage':
        values = data.voltage;
        break;
      case 'current':
        values = data.current;
        break;
      case 'power':
        values = data.voltage.map((v, i) => v * data.current[i]);
        break;
      case 'ratio':
        values = data.voltage.map((v, i) => data.current[i] !== 0 ? v / data.current[i] : 0);
        break;
    }

    return {
      labels: data.timestamp.map(t => t.toFixed(2)),
      datasets: [
        {
          label: title,
          data: values,
          borderColor: color,
          backgroundColor: color + '20',
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time (s)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: `${title} (${unit})`
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="w-full h-64 p-4 bg-white rounded-lg shadow">
      <Line data={getChartData()} options={options} />
    </div>
  );
}
