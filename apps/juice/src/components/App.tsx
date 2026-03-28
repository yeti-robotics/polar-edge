import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import Chart from './Chart';
import Statistics from './Statistics';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { MatchData } from './FileUpload';

export default function App() {
  const { storedData, saveData, clearData } = useLocalStorage();
  const [matchData, setMatchData] = useState<MatchData | null>(storedData);

  useEffect(() => {
    if (storedData && !matchData) {
      setMatchData(storedData);
    }
  }, [storedData, matchData]);

  const handleFileUpload = (data: MatchData) => {
    setMatchData(data);
    saveData(data);
  };

  const handleClearData = () => {
    setMatchData(null);
    clearData();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Juice</h1>
        <p className="text-gray-600">FRC Match Data Analyzer</p>
      </header>

      {!matchData ? (
        <div className="max-w-2xl mx-auto">
          <FileUpload onFileUpload={handleFileUpload} />
          {storedData && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setMatchData(storedData)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Load Previous Data ({storedData.filename})
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Match Data: {matchData.filename}
            </h2>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Clear Data
            </button>
          </div>

          <Statistics data={matchData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Chart 
              data={matchData} 
              title="Voltage" 
              dataKey="voltage" 
              color="#3B82F6" 
              unit="V" 
            />
            <Chart 
              data={matchData} 
              title="Current" 
              dataKey="current" 
              color="#10B981" 
              unit="A" 
            />
            <Chart 
              data={matchData} 
              title="Power (V × I)" 
              dataKey="power" 
              color="#8B5CF6" 
              unit="W" 
            />
            <Chart 
              data={matchData} 
              title="Voltage/Current Ratio" 
              dataKey="ratio" 
              color="#F59E0B" 
              unit="Ω" 
            />
          </div>

          <div className="text-center">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        </div>
      )}
    </div>
  );
}
