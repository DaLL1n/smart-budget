export interface ErrorIncident {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
}

const STORAGE_KEY = 'smart_budget_error_incidents_v1';
const MAX_INCIDENTS = 10;

const memoryIncidents: ErrorIncident[] = [];

/**
 * Logs an error incident to console and retains the last 10 in localStorage (or memory) for debugging
 */
export function logErrorIncident(error: Error, errorInfo?: { componentStack?: string | null }): void {
  const incident: ErrorIncident = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    message: error?.message || String(error),
    stack: error?.stack,
    componentStack: errorInfo?.componentStack || undefined,
  };

  console.error('[ErrorBoundary Incident Captured]:', incident);

  memoryIncidents.unshift(incident);
  if (memoryIncidents.length > MAX_INCIDENTS) {
    memoryIncidents.length = MAX_INCIDENTS;
  }

  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      const incidents: ErrorIncident[] = raw ? JSON.parse(raw) : [];
      incidents.unshift(incident);
      if (incidents.length > MAX_INCIDENTS) {
        incidents.length = MAX_INCIDENTS;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    }
  } catch (err) {
    console.warn('Failed to persist error incident to localStorage:', err);
  }
}

/**
 * Retrieve stored error incidents
 */
export function getStoredErrorIncidents(): ErrorIncident[] {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ErrorIncident[];
    }
  } catch {}
  return [...memoryIncidents];
}
