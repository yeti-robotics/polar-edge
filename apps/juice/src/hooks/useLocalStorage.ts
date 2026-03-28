import { useState, useEffect } from 'react';
import type { MatchData } from '../components/FileUpload';

const STORAGE_KEY = 'frc-match-data';

export function useLocalStorage() {
  const [storedData, setStoredData] = useState<MatchData | null>(null);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        setStoredData(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  const saveData = (data: MatchData) => {
    try {
      setStoredData(data);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const clearData = () => {
    try {
      setStoredData(null);
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return { storedData, saveData, clearData };
}
