export type Role = 'officer' | 'supervisor' | 'management';

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  origin_team: string;
  phone: string;
  pin: string;
}

export type CheckpointSlot = '07.00' | '10.00' | '13.00' | '15.30';

export type RatingScore = 2 | 1 | 0 | 'NA';

export type SupplyStatus = 'Cukup' | 'Menipis' | 'Habis';

export interface ChecklistItem {
  id: string;
  code: string;
  text: string;
  frequency: 'daily_0700' | 'all_checkpoints';
  weight: 1 | 2;
  is_key_item: boolean;
  require_photo: boolean;
  is_supply: boolean;
}

export interface Section {
  id: string;
  code: string;
  name: string;
  items: ChecklistItem[];
}

export interface Area {
  id: string;
  name: string;
  qr_code: string;
  sections: Section[];
  total_items: number;
}

export interface Finding {
  id: string;
  area_id: string;
  area_name: string;
  item_id?: string;
  item_name?: string;
  description: string;
  action_taken: string;
  finding_type: 'Perbaiki langsung' | 'Teknis-berisiko';
  status: 'Open' | 'Diteruskan' | 'Dalam proses' | 'Selesai';
  pic: string;
  deadline: string;
  photo_before?: string;
  photo_after?: string;
  reported_by: string;
  created_at: string;
  resolved_at?: string;
  comments?: Array<{
    id: string;
    author: string;
    text: string;
    created_at: string;
  }>;
}

export interface AreaResult {
  scanned_at: string;
  is_ready: boolean;
  score: number;
  ready_photo_url?: string;
  ratings: Record<string, RatingScore>;
  item_notes: Record<string, string>;
  item_photos: Record<string, { before?: string; after?: string }>;
}

export interface CheckpointRecord {
  id: string;
  slot: CheckpointSlot;
  date: string;
  officer_name: string;
  officer_id: string;
  is_substitute: boolean;
  started_at?: string;
  completed_at?: string;
  status: 'Belum' | 'Berjalan' | 'Selesai' | 'Terlambat' | 'Terlewat';
  overall_score: number;
  signature_url?: string;
  area_results: Record<string, AreaResult>;
  supervisor_review?: {
    supervisor_name: string;
    reviewed_at: string;
    status: 'Approved' | 'Revision Requested';
    notes: string;
    signature_url?: string;
    spot_check_diff?: number;
  };
}

export interface GamificationState {
  points: number;
  streak: number;
  level: string;
  points_history: Array<{
    id: string;
    points: number;
    reason: string;
    created_at: string;
  }>;
}

export interface SupplyItem {
  id: string;
  name: string;
  area_id: string;
  area_name: string;
  status: SupplyStatus;
  last_updated: string;
  updated_by: string;
}
