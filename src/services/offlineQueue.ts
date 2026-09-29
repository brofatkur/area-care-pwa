// Offline queue management with IndexedDB (idb-keyval)
import { get, set } from 'idb-keyval';
import { runQuery } from './insforge';
import { CheckpointRecord, Finding, SupplyItem } from '../types';

const SYNC_QUEUE_KEY = 'area_care_offline_queue';
const SAVED_CHECKPOINTS_KEY = 'area_care_local_checkpoints';
const SAVED_FINDINGS_KEY = 'area_care_local_findings';
const SAVED_SUPPLIES_KEY = 'area_care_local_supplies';
const GAMIFICATION_KEY = 'area_care_gamification_state';

export interface SyncPayload {
  id: string;
  type: 'checkpoint' | 'finding' | 'supply' | 'review';
  data: any;
  timestamp: string;
}

export async function getPendingSyncQueue(): Promise<SyncPayload[]> {
  const queue = await get<SyncPayload[]>(SYNC_QUEUE_KEY);
  return queue || [];
}

export async function addToSyncQueue(item: Omit<SyncPayload, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getPendingSyncQueue();
  const payload: SyncPayload = {
    ...item,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };
  queue.push(payload);
  await set(SYNC_QUEUE_KEY, queue);
}

export async function processSyncQueue(): Promise<{ synced: number; remaining: number }> {
  if (!navigator.onLine) return { synced: 0, remaining: (await getPendingSyncQueue()).length };

  const queue = await getPendingSyncQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  const remaining: SyncPayload[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.type === 'checkpoint') {
        const c: CheckpointRecord = item.data;
        const sql = `
          INSERT INTO checkpoints (id, user_id, date, slot, started_at, completed_at, status, score, signature_url)
          VALUES ('${c.id}', '${c.officer_id}', '${c.date}', '${c.slot}', '${c.started_at || new Date().toISOString()}', '${c.completed_at || new Date().toISOString()}', '${c.status}', ${c.overall_score}, '${c.signature_url || ''}')
          ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, score = EXCLUDED.score, completed_at = EXCLUDED.completed_at, signature_url = EXCLUDED.signature_url;
        `;
        await runQuery(sql);

        // Also sync area_checks
        for (const [areaId, res] of Object.entries(c.area_results)) {
          const areaCheckSql = `
            INSERT INTO area_checks (id, checkpoint_id, area_id, scanned_at, is_ready, score, ready_photo_url, status)
            VALUES ('${c.id}_${areaId}', '${c.id}', '${areaId}', '${res.scanned_at || new Date().toISOString()}', ${res.is_ready}, ${res.score}, '${res.ready_photo_url || ''}', 'completed')
            ON CONFLICT (id) DO UPDATE SET is_ready = EXCLUDED.is_ready, score = EXCLUDED.score, ready_photo_url = EXCLUDED.ready_photo_url;
          `;
          await runQuery(areaCheckSql);
        }
        synced++;
      } else if (item.type === 'finding') {
        const f: Finding = item.data;
        const sql = `
          INSERT INTO findings (id, area_id, item_name, description, action_taken, finding_type, status, pic, deadline, reported_by)
          VALUES ('${f.id}', '${f.area_id}', '${(f.item_name || '').replace(/'/g, "''")}', '${f.description.replace(/'/g, "''")}', '${(f.action_taken || '').replace(/'/g, "''")}', '${f.finding_type}', '${f.status}', '${(f.pic || '').replace(/'/g, "''")}', '${f.deadline}', '${f.reported_by}')
          ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, action_taken = EXCLUDED.action_taken;
        `;
        await runQuery(sql);
        synced++;
      } else if (item.type === 'supply') {
        const s: SupplyItem = item.data;
        const sql = `
          INSERT INTO supplies_log (id, area_id, item_name, status, recorded_by)
          VALUES ('${s.id}', '${s.area_id}', '${s.name.replace(/'/g, "''")}', '${s.status}', '${s.updated_by}')
          ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
        `;
        await runQuery(sql);
        synced++;
      }
    } catch (e) {
      console.warn('Sync failed for item, keeping in queue:', item, e);
      remaining.push(item);
    }
  }

  await set(SYNC_QUEUE_KEY, remaining);
  return { synced, remaining: remaining.length };
}

// Local cache helpers
export async function getLocalCheckpoints(): Promise<Record<string, CheckpointRecord>> {
  const data = await get<Record<string, CheckpointRecord>>(SAVED_CHECKPOINTS_KEY);
  return data || {};
}

export async function saveLocalCheckpoint(record: CheckpointRecord): Promise<void> {
  const current = await getLocalCheckpoints();
  current[record.id] = record;
  await set(SAVED_CHECKPOINTS_KEY, current);
  await addToSyncQueue({ type: 'checkpoint', data: record });
}

export async function getLocalFindings(): Promise<Finding[]> {
  const data = await get<Finding[]>(SAVED_FINDINGS_KEY);
  return data || [];
}

export async function saveLocalFinding(finding: Finding): Promise<void> {
  const current = await getLocalFindings();
  const idx = current.findIndex(f => f.id === finding.id);
  if (idx >= 0) current[idx] = finding;
  else current.unshift(finding);
  await set(SAVED_FINDINGS_KEY, current);
  await addToSyncQueue({ type: 'finding', data: finding });
}

export async function getLocalSupplies(): Promise<SupplyItem[]> {
  const data = await get<SupplyItem[]>(SAVED_SUPPLIES_KEY);
  return data || [];
}

export async function saveLocalSupplies(supplies: SupplyItem[]): Promise<void> {
  await set(SAVED_SUPPLIES_KEY, supplies);
}

export async function getLocalGamification(): Promise<any> {
  return (await get(GAMIFICATION_KEY)) || {
    points: 85,
    streak: 6,
    level: 'Bersih',
    points_history: [
      { id: 'p1', points: 10, reason: 'Checkpoint 07.00 tepat waktu', created_at: '2026-09-29 07:18' },
      { id: 'p2', points: 10, reason: 'Foto bukti Ready-to-Use lengkap', created_at: '2026-09-29 07:22' },
      { id: 'p3', points: 5, reason: 'Temuan ampas sink dibersihkan', created_at: '2026-09-29 07:25' }
    ]
  };
}

export async function saveLocalGamification(state: any): Promise<void> {
  await set(GAMIFICATION_KEY, state);
}
