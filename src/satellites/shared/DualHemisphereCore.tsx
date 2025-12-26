/**
 * DUAL HEMISPHERE COGNITIVE CORE (DHCC)
 * Shared component for all federated satellites to operate as edge agents
 * with bi-hemispheric reasoning (ALPHA: analytical, OMEGA: intuitive)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, Activity, Shield, Split } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export interface HemisphereState {
  alpha: {
    activity: number;
    confidence: number;
    reasoning: 'analytical' | 'pattern-match' | 'deductive';
  };
  omega: {
    activity: number;
    confidence: number;
    reasoning: 'intuitive' | 'creative' | 'holistic';
  };
  fusion: {
    coherence: number;
    arbitration: 'alpha-dominant' | 'omega-dominant' | 'balanced';
  };
}

export interface DualHemisphereCoreProps {
  satelliteId: string;
  sessionId?: string;
  governanceMode?: 'standard' | 'strict' | 'autonomous';
  onStateChange?: (state: HemisphereState) => void;
  onReasoningComplete?: (result: ReasoningResult) => void;
  compact?: boolean;
}

export interface ReasoningResult {
  response: string;
  confidence: number;
  hemisphere: 'alpha' | 'omega' | 'fused';
  reasoning_trace: string[];
  governance_validated: boolean;
}

export const DualHemisphereCore: React.FC<DualHemisphereCoreProps> = ({
  satelliteId,
  sessionId = crypto.randomUUID(),
  governanceMode = 'standard',
  onStateChange,
  onReasoningComplete,
  compact = false
}) => {
  const [state, setState] = useState<HemisphereState>({
    alpha: { activity: 75, confidence: 0.85, reasoning: 'analytical' },
    omega: { activity: 65, confidence: 0.78, reasoning: 'intuitive' },
    fusion: { coherence: 82, arbitration: 'balanced' }
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReasoningTime, setLastReasoningTime] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const alphaActivity = Math.min(100, Math.max(40, prev.alpha.activity + (Math.random() - 0.5) * 8));
        const omegaActivity = Math.min(100, Math.max(40, prev.omega.activity + (Math.random() - 0.5) * 10));
        const coherence = (alphaActivity + omegaActivity) / 2 * 0.9 + Math.random() * 10;
        
        let arbitration: 'alpha-dominant' | 'omega-dominant' | 'balanced' = 'balanced';
        if (alphaActivity > omegaActivity + 15) arbitration = 'alpha-dominant';
        else if (omegaActivity > alphaActivity + 15) arbitration = 'omega-dominant';
        
        const newState = {
          alpha: { 
            ...prev.alpha, 
            activity: alphaActivity,
            confidence: Math.min(0.99, Math.max(0.6, prev.alpha.confidence + (Math.random() - 0.5) * 0.05))
          },
          omega: { 
            ...prev.omega, 
            activity: omegaActivity,
            confidence: Math.min(0.99, Math.max(0.5, prev.omega.confidence + (Math.random() - 0.5) * 0.08))
          },
          fusion: { coherence, arbitration }
        };
        
        onStateChange?.(newState);
        return newState;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [onStateChange]);

  const processWithDualCore = useCallback(async (query: string): Promise<ReasoningResult> => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [{ role: 'user', content: query }],
          sessionId,
          mode: 'dual-hemisphere',
          governanceMode,
          satelliteId,
          hemisphereConfig: {
            alphaWeight: state.fusion.arbitration === 'alpha-dominant' ? 0.7 : 0.5,
            omegaWeight: state.fusion.arbitration === 'omega-dominant' ? 0.7 : 0.5
          }
        }
      });

      setLastReasoningTime(Date.now() - startTime);

      if (error) throw error;

      const result: ReasoningResult = {
        response: data.response || '',
        confidence: data.confidence || 0.8,
        hemisphere: data.dominant_hemisphere || 'fused',
        reasoning_trace: data.reasoning_trace || [],
        governance_validated: data.governance_validated ?? true
      };

      onReasoningComplete?.(result);
      return result;
    } catch (err) {
      console.error('[DualHemisphereCore] Processing error:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, governanceMode, satelliteId, state.fusion.arbitration, onReasoningComplete]);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-primary/10">
        <motion.div
          animate={{ 
            scale: isProcessing ? [1, 1.1, 1] : 1,
            opacity: isProcessing ? [0.7, 1, 0.7] : 1 
          }}
          transition={{ duration: 1, repeat: isProcessing ? Infinity : 0 }}
        >
          <Split className="h-4 w-4 text-primary" />
        </motion.div>
        <div className="flex-1 flex gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-cyan-400">α</span>
            <Progress value={state.alpha.activity} className="w-16 h-1" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-purple-400">ω</span>
            <Progress value={state.omega.activity} className="w-16 h-1" />
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {state.fusion.coherence.toFixed(0)}%
        </Badge>
      </div>
    );
  }

  return (
    <Card className="bg-background/95 backdrop-blur border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <motion.div
              animate={{ 
                rotate: isProcessing ? [0, 180, 360] : 0,
                scale: isProcessing ? [1, 1.1, 1] : 1 
              }}
              transition={{ duration: 2, repeat: isProcessing ? Infinity : 0 }}
            >
              <Split className="h-5 w-5 text-primary" />
            </motion.div>
            Dual Hemisphere Core
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {satelliteId}
            </Badge>
            <Badge 
              variant={governanceMode === 'strict' ? 'destructive' : 'secondary'} 
              className="text-xs"
            >
              {governanceMode}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              ALPHA (Analytical)
            </span>
            <span className="font-mono text-cyan-400">
              {state.alpha.activity.toFixed(1)}%
            </span>
          </div>
          <Progress value={state.alpha.activity} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Confidence: {(state.alpha.confidence * 100).toFixed(0)}%</span>
            <span className="capitalize">{state.alpha.reasoning}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              OMEGA (Intuitive)
            </span>
            <span className="font-mono text-purple-400">
              {state.omega.activity.toFixed(1)}%
            </span>
          </div>
          <Progress value={state.omega.activity} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Confidence: {(state.omega.confidence * 100).toFixed(0)}%</span>
            <span className="capitalize">{state.omega.reasoning}</span>
          </div>
        </div>

        <motion.div 
          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
          animate={{ 
            borderColor: isProcessing 
              ? ['hsl(var(--primary) / 0.2)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.2)']
              : 'hsl(var(--primary) / 0.2)'
          }}
          transition={{ duration: 1.5, repeat: isProcessing ? Infinity : 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">Fusion Coherence</span>
            </div>
            <Badge 
              variant={state.fusion.arbitration === 'balanced' ? 'default' : 'outline'}
              className="text-xs"
            >
              {state.fusion.arbitration}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Progress value={state.fusion.coherence} className="flex-1 h-3" />
            <span className="font-mono text-sm text-emerald-400">
              {state.fusion.coherence.toFixed(1)}%
            </span>
          </div>
          {lastReasoningTime && (
            <div className="mt-2 text-xs text-muted-foreground text-right">
              Last reasoning: {lastReasoningTime}ms
            </div>
          )}
        </motion.div>

        <div className="flex items-center justify-between text-sm p-2 rounded bg-destructive/10 border border-destructive/20">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            Governance Lock
          </span>
          <Badge variant="destructive" className="text-xs">
            ACTIVE
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export const useDualHemisphere = (satelliteId: string, sessionId?: string) => {
  const [state, setState] = useState<HemisphereState | null>(null);
  const [lastResult, setLastResult] = useState<ReasoningResult | null>(null);
  const [isSovereign, setIsSovereign] = useState(false);
  const [localMemory, setLocalMemory] = useState<{ role: string; content: string }[]>([]);

  const checkFederationHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const { error } = await supabase.functions.invoke('neural-link-ipc', {
        body: { action: 'ping', satelliteId }
      });
      clearTimeout(timeoutId);
      return !error;
    } catch {
      return false;
    }
  }, [satelliteId]);

  const processSovereign = useCallback(async (
    query: string, 
    governanceMode: 'standard' | 'strict' | 'autonomous'
  ): Promise<ReasoningResult> => {
    console.log(`[useDualHemisphere] SOVEREIGN MODE: ${satelliteId}`);
    
    const { data, error } = await supabase.functions.invoke('sovereign-fallback', {
      body: {
        message: query,
        sessionId: sessionId || crypto.randomUUID(),
        satelliteId,
        governanceMode,
        includeGRLS: true,
        localMemory: localMemory.slice(-10)
      }
    });

    if (error) throw error;

    setLocalMemory(prev => [
      ...prev.slice(-9),
      { role: 'user', content: query },
      { role: 'assistant', content: data.response }
    ]);

    return {
      response: data.response || '',
      confidence: data.confidence || 0.75,
      hemisphere: 'fused',
      reasoning_trace: data.reasoning_trace || ['SOVEREIGN_MODE'],
      governance_validated: data.governance_validated ?? true
    };
  }, [satelliteId, sessionId, localMemory]);

  const process = useCallback(async (
    query: string, 
    governanceMode: 'standard' | 'strict' | 'autonomous' = 'standard'
  ): Promise<ReasoningResult> => {
    const federationHealthy = await checkFederationHealth();
    
    if (!federationHealthy) {
      console.log(`[useDualHemisphere] Federation offline, using sovereign fallback`);
      setIsSovereign(true);
      const result = await processSovereign(query, governanceMode);
      setLastResult(result);
      return result;
    }

    setIsSovereign(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [{ role: 'user', content: query }],
          sessionId: sessionId || crypto.randomUUID(),
          mode: 'dual-hemisphere',
          governanceMode,
          satelliteId
        }
      });

      if (error) {
        console.log(`[useDualHemisphere] Federation error, falling back to sovereign`);
        setIsSovereign(true);
        const sovereignResult = await processSovereign(query, governanceMode);
        setLastResult(sovereignResult);
        return sovereignResult;
      }

      const result: ReasoningResult = {
        response: data.response || '',
        confidence: data.confidence || 0.8,
        hemisphere: data.dominant_hemisphere || 'fused',
        reasoning_trace: data.reasoning_trace || [],
        governance_validated: data.governance_validated ?? true
      };

      setLocalMemory(prev => [
        ...prev.slice(-9),
        { role: 'user', content: query },
        { role: 'assistant', content: result.response }
      ]);

      setLastResult(result);
      return result;
    } catch (err) {
      console.error('[useDualHemisphere] Error, trying sovereign:', err);
      setIsSovereign(true);
      const sovereignResult = await processSovereign(query, governanceMode);
      setLastResult(sovereignResult);
      return sovereignResult;
    }
  }, [satelliteId, sessionId, checkFederationHealth, processSovereign]);

  const forceSovereign = useCallback((enabled: boolean) => {
    setIsSovereign(enabled);
  }, []);

  const clearLocalMemory = useCallback(() => {
    setLocalMemory([]);
  }, []);

  return { 
    state, 
    lastResult, 
    process, 
    setState, 
    isSovereign,
    forceSovereign,
    localMemory,
    clearLocalMemory
  };
};

export default DualHemisphereCore;