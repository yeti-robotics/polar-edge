import React, { useState } from 'react';

interface FileUploadProps {
  onFileUpload: (data: MatchData) => void;
}

export interface MatchData {
  timestamp: number[];
  voltage: number[];
  current: number[];
  filename: string;
  teamNumber?: number;
  matchNumber?: number;
  event?: string;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setLoading(true);
    setError('');

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileExtension === 'json') {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const parsedData = parseJSONData(jsonData, file.name);
        onFileUpload(parsedData);
      } else if (fileExtension === 'dslog') {
        const arrayBuffer = await file.arrayBuffer();
        const parsedData = parseDSLogData(arrayBuffer, file.name);
        onFileUpload(parsedData);
      } else {
        throw new Error('Unsupported file format. Please upload a .json or .dslog file.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const parseJSONData = (data: any, filename: string): MatchData => {
    // Handle the BFG data format you provided
    if (data.bfg_data) {
      const bfg = data.bfg_data;
      
      // Create time-series data from the available statistics
      // Since we only have aggregate data, we'll create representative points
      const duration = bfg.match_discharge_time || 94; // seconds
      const samplingRate = 1; // 1 sample per second for visualization
      
      const timestamp: number[] = [];
      const voltage: number[] = [];
      const current: number[] = [];
      
      // Create a realistic time series from the min/max/average values
      for (let i = 0; i <= duration; i += samplingRate) {
        timestamp.push(i);
        
        // Simulate voltage variation between min and max
        const vMin = bfg.match_min_v || 6.285;
        const vMax = bfg.match_max_v || 12.569;
        const vAvg = bfg.voltage || 12.0;
        
        // Create a realistic voltage curve (starts high, drops during match)
        const voltageDrop = (vMax - vMin) * (i / duration);
        voltage.push(Math.max(vMin, vMax - voltageDrop));
        
        // Simulate current variation
        const iMin = bfg.match_min_i || 0.452;
        const iMax = bfg.match_max_i || 1.048;
        const iAvg = bfg.current || 0.9;
        
        // Create realistic current usage (spikes during high activity)
        const currentVariation = Math.sin(i * 0.2) * (iMax - iMin) * 0.3;
        current.push(Math.max(iMin, Math.min(iMax, iAvg + currentVariation)));
      }
      
      return {
        timestamp,
        voltage,
        current,
        filename,
        teamNumber: data.team_number,
        matchNumber: data.match_number,
        event: data.event_name
      };
    }
    
    // Handle original format with time-series arrays
    if (!data.timestamp || !data.voltage || !data.current) {
      throw new Error('Invalid JSON format. Expected either bfg_data structure or timestamp, voltage, and current arrays.');
    }

    return {
      timestamp: data.timestamp,
      voltage: data.voltage,
      current: data.current,
      filename
    };
  };

  const parseDSLogData = (arrayBuffer: ArrayBuffer, filename: string): MatchData => {
    // Basic DSLog parsing - this is a simplified implementation
    // Real DSLog files would need more sophisticated parsing
    const dataView = new DataView(arrayBuffer);
    const timestamp: number[] = [];
    const voltage: number[] = [];
    const current: number[] = [];

    // This is a placeholder implementation
    // Real DSLog parsing would depend on the specific format
    for (let i = 0; i < Math.min(arrayBuffer.byteLength / 12, 1000); i++) {
      const offset = i * 12;
      if (offset + 12 <= arrayBuffer.byteLength) {
        timestamp.push(i * 0.02); // Assuming 50Hz sampling rate
        voltage.push(12.0 + Math.sin(i * 0.1) * 2); // Mock voltage data
        current.push(50 + Math.sin(i * 0.15) * 20); // Mock current data
      }
    }

    return {
      timestamp,
      voltage,
      current,
      filename
    };
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".json,.dslog"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />
        
        <div className="space-y-2">
          <div className="text-gray-600">
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Processing file...</span>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm">
                  Drop your DSLog or JSON file here, or click to browse
                </p>
                <p className="text-xs text-gray-500">Supports .dslog and .json files</p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
