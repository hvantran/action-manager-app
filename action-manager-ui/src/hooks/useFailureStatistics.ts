import { useState, useEffect } from 'react';
import { STATISTICS_API_URL } from '../components/AppConstants';

interface FailureStatistics {
  totalFailedJobs: number;
  timestamp: string;
}

export const useFailureStatistics = (pollInterval = 30000) => {
  const [failureCount, setFailureCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${STATISTICS_API_URL}/failures`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FailureStatistics = await response.json();
        setFailureCount(data.totalFailedJobs);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch failure statistics', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval]);

  return { failureCount, loading, error };
};
