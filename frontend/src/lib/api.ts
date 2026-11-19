const API_BASE = "http://localhost:8000"; export const api = { health: () => fetch(`${API_BASE}/health`).then(r => r.json()) };
