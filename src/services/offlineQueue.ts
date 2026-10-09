// Offline queue management with IndexedDB (idb-keyval) & Insforge PostgREST
import { get, set } from 'idb-keyval';
import { upsertRecords, saveAttendanceOnline } from './insforge';
import { CheckpointRecord, Finding, SupplyItem, ShiftAttendance } from '../types';

const SYNC_QUEUE_KEY = 'area_care_offline_queue';
const SAVED_CHECKPOINTS_KEY = 'area_care_local_checkpoints';
const SAVED_FINDINGS_KEY = 'area_care_local_findings';
const SAVED_SUPPLIES_KEY = 'area_care_local_supplies';
const GAMIFICATION_KEY = 'area_care_gamification_state';
const ATTENDANCE_KEY = 'area_care_shift_attendance';

export interface SyncPayload {
  id: string;
  type: 'checkpoint' | 'finding' | 'supply' | 'review' | 'attendance';
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
        await upsertRecords('checkpoints', [{
          id: c.id,
          user_id: c.officer_id || 'usr_hendi',
          date: c.date,
          slot: c.slot,
          started_at: c.started_at || new Date().toISOString(),
          completed_at: c.completed_at ? new Date().toISOString() : null,
          status: c.status,
          score: c.overall_score,
          signature_url: c.signature_url || null
        }]);

        // Sync area_checks
        for (const [areaId, res] of Object.entries(c.area_results || {})) {
          const areaCheckId = `${c.id}_${areaId}`;
          await upsertRecords('area_checks', [{
            id: areaCheckId,
            checkpoint_id: c.id,
            area_id: areaId,
            scanned_at: res.scanned_at || new Date().toISOString(),
            is_ready: res.is_ready ?? true,
            score: res.score,
            ready_photo_url: res.ready_photo_url || null,
            status: 'completed'
          }]);

          // Sync item_results if available
          if (res.ratings) {
            const itemRows = Object.entries(res.ratings).map(([itemId, rating]) => ({
              id: `${areaCheckId}_${itemId}`,
              area_check_id: areaCheckId,
              item_id: itemId,
              score: rating,
              note: res.item_notes?.[itemId] || null,
              before_photo_url: res.item_photos?.[itemId]?.before || null,
              after_photo_url: res.item_photos?.[itemId]?.after || null
            }));
            if (itemRows.length > 0) {
              await upsertRecords('item_results', itemRows);
            }
          }
        }
        synced++;
      } else if (item.type === 'finding') {
        const f: Finding = item.data;
        await upsertRecords('findings', [{
          id: f.id,
          area_id: f.area_id,
          item_id: f.item_id || null,
          item_name: f.item_name || null,
          description: f.description,
          action_taken: f.action_taken || null,
          finding_type: f.finding_type,
          status: f.status,
          pic: f.pic || null,
          deadline: f.deadline || null,
          photo_before: f.photo_before || null,
          photo_after: f.photo_after || null,
          reported_by: f.reported_by || 'Hendi'
        }]);
        synced++;
      } else if (item.type === 'supply') {
        const s: SupplyItem = item.data;
        await upsertRecords('supplies_log', [{
          id: s.id,
          area_id: s.area_id,
          item_name: s.name,
          status: s.status,
          recorded_by: s.updated_by || 'Hendi'
        }]);
        synced++;
      } else if (item.type === 'attendance') {
        await saveAttendanceOnline(item.data);
        synced++;
      }
    } catch (e) {
      console.warn('[Sync Queue] Sync failed for item, keeping in queue:', item, e);
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
  // Ensure keyed both by slot (e.g. '07.00') and by ID
  current[record.slot] = record;
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
    points_history: []
  };
}

export async function saveLocalGamification(state: any): Promise<void> {
  await set(GAMIFICATION_KEY, state);
}

export async function getLocalAttendance(): Promise<ShiftAttendance | null> {
  return (await get(ATTENDANCE_KEY)) || null;
}

export async function saveLocalAttendance(att: ShiftAttendance): Promise<void> {
  await set(ATTENDANCE_KEY, att);
  await addToSyncQueue({ type: 'attendance', data: att });
}
