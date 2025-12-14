import { useState, useEffect, useCallback, useRef } from 'react';
import { SuiteWasteDatabase, Transaction, AuditLog } from './db';
import { format } from 'date-fns';
export const useAutoSync = (db?: SuiteWasteDatabase) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const lastSyncTimestamp = useRef<number>(0);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  const syncNow = useCallback(async () => {
    if (!db?.transactions || !db?.audit_logs || isSyncing || !isOnline) {
      if (!isOnline) console.log('Sync skipped: offline.');
      return;
    }
    setIsSyncing(true);
    console.log('Starting manual sync...');
    try {
      // PUSH local changes (Transactions & Audits)
      const localTx = await db.transactions.find({ selector: { timestamp: { $gt: lastSyncTimestamp.current } } }).exec();
      const localAudits = await db.audit_logs.find({ selector: { timestamp: { $gt: lastSyncTimestamp.current } } }).exec();
      if (localTx.length > 0) {
        console.log(`Pushing ${localTx.length} local transactions...`);
        const res = await fetch('/api/sync/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localTx) });
        if (!res.ok) throw new Error('Transaction push failed');
      }
      if (localAudits.length > 0) {
        console.log(`Pushing ${localAudits.length} local audits...`);
        const res = await fetch('/api/sync/audits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localAudits) });
        if (!res.ok) throw new Error('Audit push failed');
      }
      // PULL remote changes (Transactions & Audits)
      const pullTxResponse = await fetch('/api/sync/pull');
      if (!pullTxResponse.ok) throw new Error('Transaction pull failed');
      const { documents: remoteTx } = await pullTxResponse.json() as { documents: Transaction[] };
      if (remoteTx?.length > 0) {
        console.log(`Pulling ${remoteTx.length} remote transactions...`);
        try {
          await db.transactions.bulkUpsert(remoteTx.map(doc => ({...doc} as Partial<Transaction>)));
        } catch (e) { console.error('Transaction upsert failed', e); }
      }
      const pullAuditResponse = await fetch('/api/sync/audits');
      if (!pullAuditResponse.ok) throw new Error('Audit pull failed');
      const { documents: remoteAudits } = await pullAuditResponse.json() as { documents: AuditLog[] };
      if (remoteAudits?.length > 0) {
        console.log(`Pulling ${remoteAudits.length} remote audits...`);
        try {
          await db.audit_logs.bulkUpsert(remoteAudits.map(doc => ({...doc} as Partial<AuditLog>)));
        } catch (e) { console.error('Audit upsert failed', e); }
      }
      const now = new Date();
      lastSyncTimestamp.current = now.getTime();
      setLastSync(format(now, 'yyyy-MM-dd HH:mm:ss'));
      console.log('Sync successful.');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [db, isSyncing, isOnline]);
  useEffect(() => {
    const interval = setInterval(() => {
      syncNow();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [syncNow]);
  return { isSyncing, lastSync, syncNow, isOnline };
};