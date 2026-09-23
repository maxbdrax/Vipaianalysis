import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocs,
  query,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  DrawResult, 
  AuditLog, 
  NextDrawAnalysis, 
  BacktestReport, 
  SequenceAnalysisResult,
  TransitionStat
} from '../types';
import { computeAttributes } from '../lib/lotteryRules';
import { INITIAL_SEED_DRAWS } from '../lib/seedData';
import { 
  runMultiModelAnalysis, 
  runWalkForwardBacktest, 
  calculateTransitions, 
  calculateTwoStepSequence, 
  calculateThreeStepSequence,
  calculateTransitionMatrix,
  calculateBigSmallTransitions,
  calculateColorTransitions
} from '../lib/analyticsEngine';

export type SyncState = 'LIVE' | 'OFFLINE' | 'SYNCING' | 'SYNCHRONIZED';

interface DrawDataContextType {
  draws: DrawResult[]; // chronological order
  drawsReversed: DrawResult[]; // newest first for history table
  syncState: SyncState;
  lastUpdated: Date;
  loading: boolean;
  totalCount: number;
  auditLogs: AuditLog[];
  
  // Analytics
  nextAnalysis: NextDrawAnalysis;
  backtest: BacktestReport;
  matrixData: ReturnType<typeof calculateTransitionMatrix>;
  bigSmallAnalysis: ReturnType<typeof calculateBigSmallTransitions>;
  colorAnalysis: ReturnType<typeof calculateColorTransitions>;

  // AI Explanation
  aiExplanation: string | null;
  aiExplanationLoading: boolean;
  fetchAiExplanation: () => Promise<void>;

  // Action methods
  addDrawResult: (params: {
    drawId: string;
    result: number;
    notes?: string;
    source?: string;
    customTime?: Date;
  }) => Promise<{ success: boolean; error?: string }>;
  
  updateDrawResult: (params: {
    drawId: string;
    result: number;
    notes?: string;
    source?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  deleteDrawResult: (drawId: string) => Promise<{ success: boolean; error?: string }>;
  
  bulkImportDraws: (items: { drawId: string; result: number; source?: string; notes?: string }[]) => Promise<{
    imported: number;
    duplicates: number;
    invalid: number;
  }>;

  resetToSeedData: () => Promise<void>;

  // Query helpers
  getTransitionForNumber: (num: number) => {
    previousNumber: number;
    sampleSize: number;
    candidates: TransitionStat[];
    topCandidate: number | null;
  };
  getTwoStepSequence: (s1: number, s2: number) => SequenceAnalysisResult;
  getThreeStepSequence: (s1: number, s2: number, s3: number) => SequenceAnalysisResult;
}

const DrawDataContext = createContext<DrawDataContextType | undefined>(undefined);

export const DrawDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role, isAdmin, isAnalyst } = useAuth();
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('SYNCING');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplanationLoading, setAiExplanationLoading] = useState<boolean>(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncState('LIVE');
    const handleOffline = () => setSyncState('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firestore draw results in real time
  useEffect(() => {
    setSyncState('SYNCING');
    const drawsRef = collection(db, 'drawResults');

    const unsubscribe = onSnapshot(
      drawsRef,
      (snapshot) => {
        const loaded: DrawResult[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as DrawResult);
        });

        // Sort chronologically (oldest to newest)
        loaded.sort((a, b) => {
          if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
          return a.drawId.localeCompare(b.drawId);
        });

        setDraws(loaded);
        setLastUpdated(new Date());
        setLoading(false);
        setSyncState(navigator.onLine ? 'LIVE' : 'OFFLINE');
      },
      (error) => {
        console.error('Realtime Firestore Listener Error:', error);
        setSyncState('OFFLINE');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto-seed if empty on initial launch
  useEffect(() => {
    if (!loading && draws.length === 0 && currentUser && isAnalyst) {
      // Seed with authentic historical sequence
      const seedBatch = async () => {
        try {
          const batch = writeBatch(db);
          INITIAL_SEED_DRAWS.forEach((item) => {
            const docRef = doc(db, 'drawResults', item.drawId);
            batch.set(docRef, item);
          });
          await batch.commit();
          console.log(`Seeded ${INITIAL_SEED_DRAWS.length} authentic historical draws into Firebase.`);
        } catch (err) {
          console.error('Auto-seed failed:', err);
        }
      };
      seedBatch();
    }
  }, [loading, draws.length, currentUser, isAnalyst]);

  // Listen to audit logs if Admin
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      setAuditLogs([]);
      return;
    }

    const logsRef = collection(db, 'auditLogs');
    const unsub = onSnapshot(
      logsRef,
      (snapshot) => {
        const logs: AuditLog[] = [];
        snapshot.forEach((d) => logs.push(d.data() as AuditLog));
        logs.sort((a, b) => b.timestamp - a.timestamp);
        setAuditLogs(logs);
      },
      (err) => {
        console.warn('Could not read audit logs:', err);
      }
    );

    return () => unsub();
  }, [currentUser, isAdmin]);

  // Reverse view for latest-first history
  const drawsReversed = useMemo(() => {
    return [...draws].reverse();
  }, [draws]);

  // Recalculate full analytical suite
  const nextAnalysis = useMemo(() => {
    return runMultiModelAnalysis(draws);
  }, [draws]);

  const backtest = useMemo(() => {
    return runWalkForwardBacktest(draws, Math.min(25, Math.floor(draws.length * 0.25)));
  }, [draws]);

  const matrixData = useMemo(() => {
    return calculateTransitionMatrix(draws);
  }, [draws]);

  const bigSmallAnalysis = useMemo(() => {
    return calculateBigSmallTransitions(draws);
  }, [draws]);

  const colorAnalysis = useMemo(() => {
    return calculateColorTransitions(draws);
  }, [draws]);

  // Log audit action helper
  const logAudit = async (
    action: AuditLog['action'],
    recordId: string,
    oldValue?: any,
    newValue?: any
  ) => {
    if (!currentUser) return;
    try {
      const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logDoc = doc(db, 'auditLogs', logId);
      const logData: AuditLog = {
        id: logId,
        userId: currentUser.uid,
        userEmail: currentUser.email || 'unknown',
        action,
        recordId,
        oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
        newValue: newValue ? JSON.stringify(newValue) : undefined,
        timestamp: Date.now(),
      };
      await setDoc(logDoc, logData);
    } catch (e) {
      console.warn('Failed to record audit log:', e);
    }
  };

  // Add Result
  const addDrawResult = async (params: {
    drawId: string;
    result: number;
    notes?: string;
    source?: string;
    customTime?: Date;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanId = params.drawId.trim();
    if (!cleanId) return { success: false, error: 'Draw ID cannot be empty' };
    if (params.result < 0 || params.result > 9) return { success: false, error: 'Result must be between 0 and 9' };

    // Duplicate check
    const existing = draws.find((d) => d.drawId === cleanId);
    if (existing) {
      return { success: false, error: `Duplicate Draw ID: Draw #${cleanId} already exists in database with result ${existing.result}.` };
    }

    setSyncState('SYNCING');
    try {
      const now = params.customTime || new Date();
      const attrs = computeAttributes(params.result);
      const newRecord: DrawResult = {
        drawId: cleanId,
        result: params.result,
        bigSmall: attrs.bigSmall,
        color: attrs.color,
        oddEven: attrs.oddEven,
        timestamp: now.getTime(),
        dateStr: now.toISOString().split('T')[0],
        timeStr: now.toTimeString().split(' ')[0],
        notes: params.notes?.trim() || undefined,
        source: params.source?.trim() || 'Manual Entry',
        createdBy: currentUser?.uid || 'anonymous',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await setDoc(doc(db, 'drawResults', cleanId), newRecord);
      await logAudit('CREATE', cleanId, undefined, newRecord);
      setSyncState('SYNCHRONIZED');
      setTimeout(() => setSyncState('LIVE'), 1200);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `drawResults/${cleanId}`);
      return { success: false, error: String(error) };
    }
  };

  // Update Result
  const updateDrawResult = async (params: {
    drawId: string;
    result: number;
    notes?: string;
    source?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'Only ADMIN role can edit historical results.' };
    const cleanId = params.drawId.trim();
    const existing = draws.find((d) => d.drawId === cleanId);
    if (!existing) return { success: false, error: `Draw #${cleanId} not found.` };

    setSyncState('SYNCING');
    try {
      const attrs = computeAttributes(params.result);
      const updatedFields: Partial<DrawResult> = {
        result: params.result,
        bigSmall: attrs.bigSmall,
        color: attrs.color,
        oddEven: attrs.oddEven,
        notes: params.notes?.trim() || undefined,
        source: params.source?.trim() || existing.source,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'drawResults', cleanId), updatedFields as any);
      await logAudit('UPDATE', cleanId, existing, { ...existing, ...updatedFields });
      setSyncState('SYNCHRONIZED');
      setTimeout(() => setSyncState('LIVE'), 1200);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `drawResults/${cleanId}`);
      return { success: false, error: String(error) };
    }
  };

  // Delete Result
  const deleteDrawResult = async (drawId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'Only ADMIN role can delete historical results.' };
    const cleanId = drawId.trim();
    const existing = draws.find((d) => d.drawId === cleanId);
    if (!existing) return { success: false, error: 'Record not found' };

    setSyncState('SYNCING');
    try {
      await deleteDoc(doc(db, 'drawResults', cleanId));
      await logAudit('DELETE', cleanId, existing, undefined);
      setSyncState('SYNCHRONIZED');
      setTimeout(() => setSyncState('LIVE'), 1200);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `drawResults/${cleanId}`);
      return { success: false, error: String(error) };
    }
  };

  // Bulk Import
  const bulkImportDraws = async (
    items: { drawId: string; result: number; source?: string; notes?: string }[]
  ): Promise<{ imported: number; duplicates: number; invalid: number }> => {
    if (!isAnalyst) throw new Error('Permission denied: Viewer cannot import data');

    setSyncState('SYNCING');
    let imported = 0;
    let duplicates = 0;
    let invalid = 0;

    const existingMap = new Set(draws.map((d) => d.drawId));
    const validRecords: DrawResult[] = [];

    const now = new Date();
    let currentTs = now.getTime() - items.length * 60000;

    items.forEach((item, idx) => {
      const cleanId = String(item.drawId).trim();
      const num = Number(item.result);

      if (!cleanId || isNaN(num) || num < 0 || num > 9) {
        invalid++;
        return;
      }

      if (existingMap.has(cleanId)) {
        duplicates++;
        return;
      }

      existingMap.add(cleanId);
      const attrs = computeAttributes(num);
      const recordTs = currentTs + idx * 60000;
      const recDate = new Date(recordTs);

      validRecords.push({
        drawId: cleanId,
        result: num,
        bigSmall: attrs.bigSmall,
        color: attrs.color,
        oddEven: attrs.oddEven,
        timestamp: recordTs,
        dateStr: recDate.toISOString().split('T')[0],
        timeStr: recDate.toTimeString().split(' ')[0],
        source: item.source || 'Bulk Import',
        notes: item.notes,
        createdBy: currentUser?.uid || 'import',
        createdAt: recDate.toISOString(),
        updatedAt: recDate.toISOString(),
      });
    });

    // Write in chunks of 450 to respect Firestore batch limit (500)
    const chunkSize = 450;
    for (let i = 0; i < validRecords.length; i += chunkSize) {
      const chunk = validRecords.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((rec) => {
        batch.set(doc(db, 'drawResults', rec.drawId), rec);
      });
      await batch.commit();
      imported += chunk.length;
    }

    if (imported > 0) {
      await logAudit('IMPORT', `BATCH-${Date.now()}`, undefined, { count: imported });
    }

    setSyncState('SYNCHRONIZED');
    setTimeout(() => setSyncState('LIVE'), 1200);

    return { imported, duplicates, invalid };
  };

  // Reset to authentic seed data
  const resetToSeedData = async () => {
    if (!isAdmin) return;
    setSyncState('SYNCING');
    try {
      // Clear existing
      const existingSnaps = await getDocs(collection(db, 'drawResults'));
      const batches: ReturnType<typeof writeBatch>[] = [];
      let curBatch = writeBatch(db);
      let count = 0;

      existingSnaps.forEach((d) => {
        curBatch.delete(d.ref);
        count++;
        if (count >= 400) {
          batches.push(curBatch);
          curBatch = writeBatch(db);
          count = 0;
        }
      });
      batches.push(curBatch);
      for (const b of batches) {
        await b.commit();
      }

      // Re-populate seed
      const seedBatch = writeBatch(db);
      INITIAL_SEED_DRAWS.forEach((item) => {
        seedBatch.set(doc(db, 'drawResults', item.drawId), item);
      });
      await seedBatch.commit();
      await logAudit('IMPORT', 'RESET_SEED', undefined, { count: INITIAL_SEED_DRAWS.length });

      setSyncState('SYNCHRONIZED');
      setTimeout(() => setSyncState('LIVE'), 1200);
    } catch (err) {
      console.error('Failed to reset seed data:', err);
    }
  };

  // AI Explanation fetcher
  const fetchAiExplanation = async () => {
    if (aiExplanationLoading || draws.length === 0) return;
    setAiExplanationLoading(true);
    try {
      const top3 = nextAnalysis.candidates.slice(0, 3).map((c) => ({
        number: c.number,
        score: c.modelScore,
        count: c.historicalCount,
        percentage: c.historicalPercentage,
      }));

      const res = await fetch('/api/gemini/explain-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousResult: nextAnalysis.previousResult,
          currentSequence: nextAnalysis.currentSequence3
            ? nextAnalysis.currentSequence3.join(' → ')
            : nextAnalysis.currentSequence2
            ? nextAnalysis.currentSequence2.join(' → ')
            : String(nextAnalysis.previousResult),
          topCandidates: top3,
          modelAgreement: nextAnalysis.modelAgreement,
          sampleSize: nextAnalysis.sampleSize,
          backtestTop1Rate: backtest.top1Rate,
          backtestTop3Rate: backtest.top3Rate,
        }),
      });

      const data = await res.json();
      if (data.success && data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Failed to fetch AI explanation:', err);
    } finally {
      setAiExplanationLoading(false);
    }
  };

  // Transition & sequence helpers
  const getTransitionForNumber = (num: number) => {
    return calculateTransitions(draws, num);
  };

  const getTwoStepSequence = (s1: number, s2: number) => {
    return calculateTwoStepSequence(draws, s1, s2);
  };

  const getThreeStepSequence = (s1: number, s2: number, s3: number) => {
    return calculateThreeStepSequence(draws, s1, s2, s3);
  };

  return (
    <DrawDataContext.Provider
      value={{
        draws,
        drawsReversed,
        syncState,
        lastUpdated,
        loading,
        totalCount: draws.length,
        auditLogs,
        nextAnalysis,
        backtest,
        matrixData,
        bigSmallAnalysis,
        colorAnalysis,
        aiExplanation,
        aiExplanationLoading,
        fetchAiExplanation,
        addDrawResult,
        updateDrawResult,
        deleteDrawResult,
        bulkImportDraws,
        resetToSeedData,
        getTransitionForNumber,
        getTwoStepSequence,
        getThreeStepSequence,
      }}
    >
      {children}
    </DrawDataContext.Provider>
  );
};

export function useDrawData() {
  const context = useContext(DrawDataContext);
  if (!context) {
    throw new Error('useDrawData must be used within a DrawDataProvider');
  }
  return context;
}
