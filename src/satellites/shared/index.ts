// HYDRA-CORE Satellite Shared Module
// Central exports for all satellite shared code

// Dual Hemisphere Cognitive Core - Edge agent architecture
export { DualHemisphereCore, useDualHemisphere } from './DualHemisphereCore';
export { useEdgeMemory } from './useEdgeMemory';
export type { HemisphereState, DualHemisphereCoreProps, ReasoningResult } from './DualHemisphereCore';

// Federation configuration constants
export const FEDERATION_CONFIG = {
  CORE_URL: 'https://yokxmlatktvxqymxtktn.supabase.co',
  SYNC_KEY_NAME: 'FEDERATED_SYNC_KEY',
  SYNC_ENDPOINT: '/functions/v1/federation-receiver',
  SOVEREIGN_ENDPOINT: '/functions/v1/sovereign-fallback',
  HEARTBEAT_INTERVAL_MS: 30000,
  FEDERATION_TIMEOUT_MS: 3000,
  SATELLITE_COUNT: 21,
  SOVEREIGN_CAPABILITIES: [
    'local_reasoning',
    'grls_rehydration',
    'memory_persistence',
    'governance_enforcement',
    'sync_queue'
  ]
} as const;