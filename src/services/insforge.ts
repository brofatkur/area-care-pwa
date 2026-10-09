// Insforge API Client & Database Synchronization Service
// Connects to Insforge online backend for persistent checkpoints, attendance, findings, reviews, and supplies.

import {
  CheckpointRecord,
  CheckpointSlot,
  RatingScore,
  ShiftAttendance,
  Finding,
  SupplyItem,
  SupervisorReview
} from '../types';

const ANON_KEY = 'anon_0a75c32f9a5fa623748cae8ca28764bf213bc112';

// In browser environments (both Vercel production & Vite dev server),
// requests go through the same-origin proxy '/api/insforge' to avoid Mixed Content / SSL issues.
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/insforge';
  }
  return 'http://43.157.228.75:7130/api';
}

/**
 * Low-level GET records from Insforge PostgREST API
 */
export async function getRecords<T = any>(
  tableName: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const search = new URLSearchParams(params).toString();
    const url = `${baseUrl}/database/records/${tableName}${search ? `?${search}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[Insforge] GET ${tableName} failed with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[Insforge] Network error on GET ${tableName}:`, err);
    return [];
  }
}

/**
 * Low-level UPSERT records to Insforge PostgREST API
 * Uses PostgREST merge-duplicates resolution header
 */
export async function upsertRecords<T = any>(
  tableName: string,
  records: any[]
): Promise<T[]> {
  if (!records || records.length === 0) return [];
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/database/records/${tableName}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(records)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Insforge] UPSERT ${tableName} failed status ${res.status}:`, errText);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[Insforge] Network error on UPSERT ${tableName}:`, err);
    return [];
  }
}

/**
 * Low-level PATCH records in Insforge PostgREST API
 */
export async function patchRecords<T = any>(
  tableName: string,
  filterQuery: string,
  patchData: Record<string, any>
): Promise<T[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/database/records/${tableName}?${filterQuery}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(patchData)
    });

    if (!res.ok) {
      console.warn(`[Insforge] PATCH ${tableName} failed status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[Insforge] Network error on PATCH ${tableName}:`, err);
    return [];
  }
}

/**
 * Backward compatibility helper for legacy code
 */
export async function runQuery<T = any>(_sql: string): Promise<T[]> {
  console.info('[Insforge] runQuery called - delegating to PostgREST methods');
  return [];
}

// ==========================================
// BUSINESS SYNCHRONIZATION METHODS
// ==========================================

/**
 * 1. ATTENDANCE / PRESENSI
 */
export async function fetchAttendanceOnline(
  userId: string,
  dateStr: string
): Promise<ShiftAttendance | null> {
  const rows = await getRecords('attendance', {
    user_id: `eq.${userId}`,
    date: `eq.${dateStr}`,
    order: 'created_at.desc',
    limit: '1'
  });

  if (rows && rows.length > 0) {
    const r = rows[0];
    return {
      date: r.date,
      status: r.status,
      check_in_time: r.check_in_time,
      check_out_time: r.check_out_time,
      started_timestamp: r.started_timestamp ? Number(r.started_timestamp) : undefined,
      total_break_seconds: r.total_break_seconds ? Number(r.total_break_seconds) : 0,
      break_start_timestamp: r.break_start_timestamp ? Number(r.break_start_timestamp) : undefined
    };
  }
  return null;
}

export async function saveAttendanceOnline(
  att: ShiftAttendance,
  userId: string = 'usr_hendi'
): Promise<boolean> {
  const recordId = `att_${att.date}_${userId}`;
  const payload = [{
    id: recordId,
    user_id: userId,
    date: att.date,
    status: att.status,
    check_in_time: att.check_in_time || null,
    check_out_time: att.check_out_time || null,
    started_timestamp: att.started_timestamp || null,
    total_break_seconds: att.total_break_seconds || 0,
    break_start_timestamp: att.break_start_timestamp || null
  }];

  const res = await upsertRecords('attendance', payload);
  return res.length > 0;
}

/**
 * 2. CHECKPOINTS & AREA CHECKS
 */
export async function fetchCheckpointsOnline(
  dateStr: string
): Promise<Record<string, CheckpointRecord>> {
  const chkRows = await getRecords('checkpoints', {
    date: `eq.${dateStr}`,
    order: 'slot.asc'
  });

  if (!chkRows || chkRows.length === 0) {
    return {};
  }

  const result: Record<string, CheckpointRecord> = {};

  for (const chk of chkRows) {
    const slot = chk.slot as CheckpointSlot;
    const checkpointRecord: CheckpointRecord = {
      id: chk.id,
      slot: slot,
      date: chk.date,
      officer_name: 'Hendi',
      officer_id: chk.user_id,
      is_substitute: false,
      status: chk.status || 'Belum',
      overall_score: chk.score ? Number(chk.score) : 0,
      completed_at: chk.completed_at ? new Date(chk.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' : undefined,
      signature_url: chk.signature_url || undefined,
      area_results: {}
    };

    // Fetch area checks for this checkpoint
    const areaCheckRows = await getRecords('area_checks', {
      checkpoint_id: `eq.${chk.id}`
    });

    for (const ac of areaCheckRows) {
      // Fetch item results for this area check
      const itemRows = await getRecords('item_results', {
        area_check_id: `eq.${ac.id}`
      });

      const ratings: Record<string, RatingScore> = {};
      const itemNotes: Record<string, string> = {};
      const itemPhotos: Record<string, { before?: string; after?: string }> = {};

      for (const ir of itemRows) {
        ratings[ir.item_id] = ir.score as RatingScore;
        if (ir.note) itemNotes[ir.item_id] = ir.note;
        if (ir.before_photo_url || ir.after_photo_url) {
          itemPhotos[ir.item_id] = {
            before: ir.before_photo_url || undefined,
            after: ir.after_photo_url || undefined
          };
        }
      }

      checkpointRecord.area_results[ac.area_id] = {
        scanned_at: ac.scanned_at || new Date().toISOString(),
        is_ready: ac.is_ready ?? true,
        score: ac.score ? Number(ac.score) : 100,
        ready_photo_url: ac.ready_photo_url || undefined,
        ratings,
        item_notes: itemNotes,
        item_photos: itemPhotos
      };
    }

    result[slot] = checkpointRecord;
  }

  return result;
}

export async function saveAreaCheckOnline(data: {
  checkpointId: string;
  officerId: string;
  officerName: string;
  date: string;
  slot: CheckpointSlot;
  areaId: string;
  score: number;
  isReady: boolean;
  readyPhotoUrl?: string;
  ratings: Record<string, RatingScore>;
  itemNotes: Record<string, string>;
  itemPhotos: Record<string, { before?: string; after?: string }>;
}): Promise<boolean> {
  try {
    // 1. Ensure checkpoint record exists in database
    await upsertRecords('checkpoints', [{
      id: data.checkpointId,
      user_id: data.officerId,
      date: data.date,
      slot: data.slot,
      status: 'Berjalan',
      score: data.score
    }]);

    // 2. Upsert area_checks table
    const areaCheckId = `${data.checkpointId}_${data.areaId}`;
    await upsertRecords('area_checks', [{
      id: areaCheckId,
      checkpoint_id: data.checkpointId,
      area_id: data.areaId,
      scanned_at: new Date().toISOString(),
      is_ready: data.isReady,
      score: data.score,
      ready_photo_url: data.readyPhotoUrl || null,
      status: 'completed'
    }]);

    // 3. Upsert individual item_results
    const itemRows = Object.entries(data.ratings).map(([itemId, rating]) => ({
      id: `${areaCheckId}_${itemId}`,
      area_check_id: areaCheckId,
      item_id: itemId,
      score: rating,
      note: data.itemNotes[itemId] || null,
      before_photo_url: data.itemPhotos[itemId]?.before || null,
      after_photo_url: data.itemPhotos[itemId]?.after || null
    }));

    if (itemRows.length > 0) {
      await upsertRecords('item_results', itemRows);
    }

    // 4. Save photo record if readyPhotoUrl exists
    if (data.readyPhotoUrl) {
      await upsertRecords('photos', [{
        id: `photo_${Date.now()}_${data.areaId}`,
        url: data.readyPhotoUrl,
        photo_type: 'ready_to_use',
        area_check_id: areaCheckId,
        server_timestamp: new Date().toISOString()
      }]);
    }

    return true;
  } catch (err) {
    console.error('[Insforge] Failed to save area check online:', err);
    return false;
  }
}

export async function submitCheckpointOnline(data: {
  checkpointId: string;
  officerId: string;
  date: string;
  slot: CheckpointSlot;
  score: number;
  signatureUrl: string;
  pointsEarned: number;
}): Promise<boolean> {
  try {
    // Update checkpoint status to 'Selesai'
    await upsertRecords('checkpoints', [{
      id: data.checkpointId,
      user_id: data.officerId,
      date: data.date,
      slot: data.slot,
      status: 'Selesai',
      score: data.score,
      completed_at: new Date().toISOString(),
      signature_url: data.signatureUrl
    }]);

    // Add points to ledger
    if (data.pointsEarned > 0) {
      await upsertRecords('points_ledger', [{
        id: `pt_${Date.now()}`,
        user_id: data.officerId,
        points: data.pointsEarned,
        reason: `Checkpoint ${data.slot} selesai & paraf digital`,
        checkpoint_id: data.checkpointId
      }]);
    }

    return true;
  } catch (err) {
    console.error('[Insforge] Failed to submit checkpoint online:', err);
    return false;
  }
}

/**
 * 3. FINDINGS / KENDALA
 */
export async function fetchFindingsOnline(): Promise<Finding[]> {
  const rows = await getRecords('findings', {
    order: 'created_at.desc'
  });

  return rows.map(r => ({
    id: r.id,
    area_id: r.area_id,
    area_name: r.area_id,
    item_id: r.item_id || undefined,
    item_name: r.item_name || '',
    description: r.description || '',
    action_taken: r.action_taken || '',
    finding_type: r.finding_type || 'Teknis-berisiko',
    status: r.status || 'Open',
    pic: r.pic || '',
    deadline: r.deadline || new Date().toISOString(),
    photo_before: r.photo_before || undefined,
    photo_after: r.photo_after || undefined,
    reported_by: r.reported_by || 'Hendi',
    created_at: r.created_at || new Date().toISOString()
  }));
}

export async function saveFindingOnline(f: Finding): Promise<boolean> {
  const rows = [{
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
  }];

  const res = await upsertRecords('findings', rows);
  return res.length > 0;
}

/**
 * 4. SUPPLIES / PERSEDIAAN
 */
export async function fetchSuppliesOnline(): Promise<SupplyItem[]> {
  const rows = await getRecords('supplies_log', {
    order: 'created_at.desc'
  });

  return rows.map(r => ({
    id: r.id,
    area_id: r.area_id,
    area_name: r.area_id === 'area_toilet' ? 'Toilet Room' : 'Coffee & Tea Station',
    name: r.item_name,
    status: r.status as any,
    last_updated: r.created_at || new Date().toISOString(),
    updated_by: r.recorded_by || 'Hendi'
  }));
}

export async function saveSupplyOnline(s: SupplyItem): Promise<boolean> {
  const rows = [{
    id: s.id,
    area_id: s.area_id,
    item_name: s.name,
    status: s.status,
    recorded_by: s.updated_by || 'Hendi'
  }];

  const res = await upsertRecords('supplies_log', rows);
  return res.length > 0;
}

/**
 * 5. SUPERVISOR REVIEWS & SPOT-CHECKS (PASEK)
 */
export async function fetchReviewsOnline(checkpointId?: string): Promise<SupervisorReview[]> {
  const params: Record<string, string> = { order: 'created_at.desc' };
  if (checkpointId) {
    params['checkpoint_id'] = `eq.${checkpointId}`;
  }
  const rows = await getRecords('reviews', params);

  return rows.map(r => ({
    id: r.id,
    checkpoint_id: r.checkpoint_id,
    area_id: r.area_id || undefined,
    supervisor_id: r.supervisor_id,
    supervisor_name: 'Pasek',
    score: r.score ? Number(r.score) : undefined,
    status: r.status as any,
    notes: r.notes || '',
    signature_url: r.signature_url || undefined,
    reviewed_at: r.created_at || new Date().toISOString()
  }));
}

export async function saveReviewOnline(rev: SupervisorReview): Promise<boolean> {
  const rows = [{
    id: rev.id || `rev_${Date.now()}`,
    checkpoint_id: rev.checkpoint_id,
    area_id: rev.area_id || null,
    supervisor_id: rev.supervisor_id || 'usr_pasek',
    score: rev.score || null,
    status: rev.status || 'Approved',
    notes: rev.notes || null,
    signature_url: rev.signature_url || null
  }];

  const res = await upsertRecords('reviews', rows);
  return res.length > 0;
}

/**
 * 6. GAMIFICATION / POINTS LEDGER
 */
export async function fetchGamificationOnline(userId: string = 'usr_hendi'): Promise<{
  points: number;
  streak: number;
  level: string;
  points_history: any[];
}> {
  const rows = await getRecords('points_ledger', {
    user_id: `eq.${userId}`,
    order: 'created_at.desc'
  });

  const totalPoints = rows.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
  const level = totalPoints >= 200 ? 'Sempurna' : totalPoints >= 100 ? 'Sangat Bersih' : 'Bersih';

  const history = rows.map(r => ({
    id: r.id,
    points: Number(r.points),
    reason: r.reason,
    created_at: r.created_at ? new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
  }));

  return {
    points: totalPoints > 0 ? totalPoints : 85,
    streak: Math.min(10, Math.max(1, rows.length)),
    level,
    points_history: history
  };
}

/**
 * 7. PHOTO UPLOAD
 * Attempts uploading to storage bucket, and safely falls back to high-resolution JPEG Data URL
 */
export async function uploadPhotoToStorage(
  blob: Blob,
  fileName: string
): Promise<string> {
  const bucketName = 'area-care-photos';
  const objectKey = `${Date.now()}_${fileName}`;
  const baseUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/storage/buckets/${bucketName}/objects/${objectKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: blob
    });
    if (res.ok) {
      return `${baseUrl}/storage/buckets/${bucketName}/objects/${objectKey}`;
    }
  } catch (err) {
    console.warn('[Insforge Storage] Upload error, falling back to base64 data URL:', err);
  }

  // Safe and permanent Data URL fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
