import React from 'react';
import type { MatchData } from './FileUpload';

interface StatisticsProps {
  data: MatchData;
}

export default function Statistics({ data }: StatisticsProps) {
  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return { min, max, avg };
  };

  const voltageStats = calculateStats(data.voltage);
  const currentStats = calculateStats(data.current);
  const powerValues = data.voltage.map((v, i) => v * data.current[i]);
  const powerStats = calculateStats(powerValues);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
      
      {data.teamNumber && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Team:</span>
              <span className="font-mono font-semibold">{data.teamNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Match:</span>
              <span className="font-mono font-semibold">{data.matchNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-mono text-xs">{data.event || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h4 className="font-medium text-blue-600">Voltage</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-mono">{voltageStats.avg.toFixed(2)} V</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-mono">{voltageStats.min.toFixed(2)} V</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-mono">{voltageStats.max.toFixed(2)} V</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-green-600">Current</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-mono">{currentStats.avg.toFixed(2)} A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-mono">{currentStats.min.toFixed(2)} A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-mono">{currentStats.max.toFixed(2)} A</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-purple-600">Power</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-mono">{powerStats.avg.toFixed(2)} W</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-mono">{powerStats.min.toFixed(2)} W</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-mono">{powerStats.max.toFixed(2)} W</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Data Points:</span>
          <span className="font-mono">{data.voltage.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duration:</span>
          <span className="font-mono">{data.timestamp[data.timestamp.length - 1]?.toFixed(2) || '0.00'} s</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">File:</span>
          <span className="font-mono text-xs truncate ml-2">{data.filename}</span>
        </div>
      </div>
    </div>
  );
}
