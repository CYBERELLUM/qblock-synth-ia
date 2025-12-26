/**
 * useEdgeMemory - Sovereign Edge Memory Hook
 * 
 * Provides per-subscriber persistent memory and autonomous knowledge evolution
 * for edge agents. Supports both federated and sovereign modes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserMemory {
  content: string;
  memoryType: string;
  importance: string;
  confidence: number;
  topicTags?: string[];
}

interface UserKnowledge {
  [key: string]: {
    value: unknown;
    confidence: number;
    observations: number;
    type: string;
  };
}

interface SessionState {
  conversationSummary?: string;
  activeContext: Record<string, unknown>;
  pendingTopics: string[];
  communicationStyle: string;
  verbosityPreference: string;
  totalInteractions: number;
  totalSessions: number;
}

interface EdgeMemoryState {
  memories: UserMemory[];
  knowledge: UserKnowledge;
  session: SessionState | null;
  isReturningUser: boolean;
  greeting: string;
  isLoading: boolean;
  isOnline: boolean;
  lastSyncAt: Date | null;
}

const LOCAL_STORAGE_KEY = 'edge_memory_cache';

export const useEdgeMemory = (
  satelliteId: string,
  sessionId?: string
): EdgeMemoryState & {
  storeMemory: (memory: Omit<UserMemory, 'confidence'>) => Promise<void>;
  evolveKnowledge: (key: string, value: unknown, type?: string) => Promise<void>;
  updateSession: (updates: Partial<SessionState>) => Promise<void>;
  extractInsights: (conversation: { role: string; content: string }[]) => Promise<void>;
  rehydrate: () => Promise<void>;
  getContext: () => EdgeMemoryState;
} => {
  const [state, setState] = useState<EdgeMemoryState>({
    memories: [],
    knowledge: {},
    session: null,
    isReturningUser: false,
    greeting: 'Hello',
    isLoading: true,
    isOnline: true,
    lastSyncAt: null
  });

  const userIdRef = useRef<string | null>(null);
  const currentSessionId = useRef(sessionId || crypto.randomUUID());

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userIdRef.current = user.id;
        await rehydrateInternal(user.id);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        userIdRef.current = session.user.id;
        rehydrateInternal(session.user.id);
      } else {
        userIdRef.current = null;
        loadFromLocalStorage();
      }
    });

    return () => subscription.unsubscribe();
  }, [satelliteId]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${satelliteId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setState(prev => ({
          ...prev,
          memories: parsed.memories || [],
          knowledge: parsed.knowledge || {},
          session: parsed.session || null,
          isOnline: false,
          isLoading: false
        }));
      }
    } catch (e) {
      console.error('[useEdgeMemory] Local storage error:', e);
    }
  }, [satelliteId]);

  const saveToLocalStorage = useCallback((data: Partial<EdgeMemoryState>) => {
    try {
      const existing = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${satelliteId}`);
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = { ...parsed, ...data, savedAt: new Date().toISOString() };
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${satelliteId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('[useEdgeMemory] Save to local storage error:', e);
    }
  }, [satelliteId]);

  const rehydrateInternal = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('edge-agent-memory', {
        body: {
          action: 'rehydrate',
          userId,
          satelliteId,
          sessionId: currentSessionId.current
        }
      });

      if (error) {
        console.error('[useEdgeMemory] Rehydration error:', error);
        loadFromLocalStorage();
        setState(prev => ({ ...prev, isOnline: false, isLoading: false }));
        return;
      }

      const newState: Partial<EdgeMemoryState> = {
        memories: data.context?.memories || [],
        knowledge: data.context?.knowledge || {},
        session: data.context?.session || null,
        isReturningUser: data.isReturningUser,
        greeting: data.greeting,
        isOnline: true,
        isLoading: false,
        lastSyncAt: new Date()
      };

      setState(prev => ({ ...prev, ...newState }));
      saveToLocalStorage(newState);
    } catch (e) {
      console.error('[useEdgeMemory] Rehydration exception:', e);
      loadFromLocalStorage();
      setState(prev => ({ ...prev, isOnline: false, isLoading: false }));
    }
  };

  const storeMemory = useCallback(async (memory: Omit<UserMemory, 'confidence'>) => {
    const userId = userIdRef.current;
    if (!userId) {
      setState(prev => ({
        ...prev,
        memories: [...prev.memories.slice(-49), { ...memory, confidence: 0.5 }]
      }));
      return;
    }

    try {
      await supabase.functions.invoke('edge-agent-memory', {
        body: {
          action: 'store_memory',
          userId,
          satelliteId,
          sessionId: currentSessionId.current,
          data: {
            memoryType: memory.memoryType,
            content: memory.content,
            importance: memory.importance,
            topicTags: memory.topicTags,
            sourceMode: state.isOnline ? 'federated' : 'sovereign'
          }
        }
      });

      setState(prev => ({
        ...prev,
        memories: [...prev.memories.slice(-49), { ...memory, confidence: 0.5 }]
      }));
    } catch (e) {
      console.error('[useEdgeMemory] Store memory error:', e);
      setState(prev => ({
        ...prev,
        memories: [...prev.memories.slice(-49), { ...memory, confidence: 0.5 }]
      }));
    }
  }, [satelliteId, state.isOnline]);

  const evolveKnowledge = useCallback(async (
    key: string, 
    value: unknown, 
    type: string = 'preference'
  ) => {
    const userId = userIdRef.current;
    if (!userId) {
      setState(prev => ({
        ...prev,
        knowledge: {
          ...prev.knowledge,
          [key]: { value, confidence: 0.5, observations: 1, type }
        }
      }));
      return;
    }

    try {
      const { data } = await supabase.functions.invoke('edge-agent-memory', {
        body: {
          action: 'evolve_knowledge',
          userId,
          satelliteId,
          data: {
            knowledgeType: type,
            knowledgeKey: key,
            knowledgeValue: { value }
          }
        }
      });

      if (data?.evolved) {
        const trajectory = data.evolved.confidence_trajectory || [0.5];
        const confidence = trajectory[trajectory.length - 1];
        
        setState(prev => ({
          ...prev,
          knowledge: {
            ...prev.knowledge,
            [key]: { 
              value, 
              confidence, 
              observations: data.evolved.observations_count || 1,
              type 
            }
          }
        }));
      }
    } catch (e) {
      console.error('[useEdgeMemory] Evolve knowledge error:', e);
    }
  }, [satelliteId]);

  const updateSession = useCallback(async (updates: Partial<SessionState>) => {
    const userId = userIdRef.current;
    if (!userId) return;

    try {
      await supabase.functions.invoke('edge-agent-memory', {
        body: {
          action: 'sync_session',
          userId,
          satelliteId,
          sessionId: currentSessionId.current,
          data: updates
        }
      });

      setState(prev => ({
        ...prev,
        session: prev.session ? { ...prev.session, ...updates } : null
      }));
    } catch (e) {
      console.error('[useEdgeMemory] Update session error:', e);
    }
  }, [satelliteId]);

  const extractInsights = useCallback(async (
    conversation: { role: string; content: string }[]
  ) => {
    const userId = userIdRef.current;
    if (!userId || conversation.length < 2) return;

    try {
      const { data } = await supabase.functions.invoke('edge-agent-memory', {
        body: {
          action: 'extract_insights',
          userId,
          satelliteId,
          data: { conversationHistory: conversation }
        }
      });

      if (data?.success && data.insights) {
        for (const pref of data.insights.preferences || []) {
          if (pref.confidence > 0.6) {
            await evolveKnowledge(pref.key, pref.value, 'preference');
          }
        }
        for (const pattern of data.insights.patterns || []) {
          if (pattern.confidence > 0.5) {
            await evolveKnowledge(pattern.key, pattern.value, 'behavior');
          }
        }
        for (const fact of data.insights.facts || []) {
          await storeMemory({
            memoryType: 'insight',
            content: fact.content,
            importance: fact.importance,
            topicTags: []
          });
        }
      }
    } catch (e) {
      console.error('[useEdgeMemory] Extract insights error:', e);
    }
  }, [satelliteId, evolveKnowledge, storeMemory]);

  const rehydrate = useCallback(async () => {
    const userId = userIdRef.current;
    if (userId) {
      await rehydrateInternal(userId);
    } else {
      loadFromLocalStorage();
    }
  }, [loadFromLocalStorage]);

  const getContext = useCallback(() => state, [state]);

  return {
    ...state,
    storeMemory,
    evolveKnowledge,
    updateSession,
    extractInsights,
    rehydrate,
    getContext
  };
};

export default useEdgeMemory;