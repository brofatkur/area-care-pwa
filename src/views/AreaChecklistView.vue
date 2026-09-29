<script setup lang="ts">
import { ref, computed } from 'vue';
import { Area, ChecklistItem, RatingScore, CheckpointSlot, SupplyStatus } from '../types';
import { playTapSound, playSuccessChime, triggerHaptic } from '../services/audioHaptic';
import CameraModal from '../components/CameraModal.vue';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Camera,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowLeft,
  Check,
  Package
} from 'lucide-vue-next';

const props = defineProps<{
  area: Area;
  slot: CheckpointSlot;
  officerName: string;
  isFullCheck: boolean;
  initialRatings: Record<string, RatingScore>;
  initialNotes: Record<string, string>;
  initialPhotos: Record<string, { before?: string; after?: string }>;
  initialReadyPhoto?: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'saveArea', data: {
    areaId: string;
    ratings: Record<string, RatingScore>;
    itemNotes: Record<string, string>;
    itemPhotos: Record<string, { before?: string; after?: string }>;
    readyPhotoUrl?: string;
    score: number;
    isReady: boolean;
  }): void;
}>();

// Section collapse state
const collapsedSections = ref<Record<string, boolean>>({});

// Working ratings and notes
const ratings = ref<Record<string, RatingScore>>({ ...props.initialRatings });
const itemNotes = ref<Record<string, string>>({ ...props.initialNotes });
const itemPhotos = ref<Record<string, { before?: string; after?: string }>>({ ...props.initialPhotos });
const readyPhotoUrl = ref<string | undefined>(props.initialReadyPhoto);

// Camera Modal state
const showCamera = ref(false);
const cameraModalMode = ref<'ready' | 'before' | 'after'>('ready');
const activeCameraItemId = ref<string | null>(null);

// Note Modal state
const showNoteModal = ref(false);
const activeNoteItemId = ref<string | null>(null);
const tempNoteText = ref('');

// Filter items according to checkpoint frequency:
// PRD rule: Infrequent items checked only at 07.00. Checkpoints 10.00, 13.00, 15.30 are shorter.
const getSectionItems = (section: any): ChecklistItem[] => {
  if (props.isFullCheck) {
    return section.items;
  }
  return section.items.filter((item: ChecklistItem) => item.frequency === 'all_checkpoints');
};

const totalVisibleItems = computed(() => {
  return props.area.sections.reduce((acc, s) => acc + getSectionItems(s).length, 0);
});

// Exception-based feature: "Semua Sesuai (2)" per section
const markSectionAllGood = (section: any) => {
  playTapSound();
  triggerHaptic('light');
  const items = getSectionItems(section);
  items.forEach(item => {
    // Only overwrite if not already marked as 0 or 1 or keep
    ratings.value[item.id] = 2;
  });
};

const setItemRating = (itemId: string, score: RatingScore) => {
  playTapSound();
  triggerHaptic('light');
  ratings.value[itemId] = score;

  // PRD Rule: If marked 0 or 1, prompt for before/after photo
  if (score === 0 || score === 1) {
    if (!itemPhotos.value[itemId]?.before) {
      activeCameraItemId.value = itemId;
      cameraModalMode.value = 'before';
      showCamera.value = true;
    }
  }
};

// Supply status updater for replenishment items (Coffee, Tea, Toilet Paper, etc.)
const setSupplyStatus = (itemId: string, status: SupplyStatus) => {
  playTapSound();
  triggerHaptic('light');
  itemNotes.value[itemId] = `Status Persediaan: ${status}`;
  if (status === 'Habis') ratings.value[itemId] = 0;
  else if (status === 'Menipis') ratings.value[itemId] = 1;
  else ratings.value[itemId] = 2;
};

// Open Note Modal
const openNote = (itemId: string) => {
  activeNoteItemId.value = itemId;
  tempNoteText.value = itemNotes.value[itemId] || '';
  showNoteModal.value = true;
};

const saveNote = () => {
  if (activeNoteItemId.value) {
    itemNotes.value[activeNoteItemId.value] = tempNoteText.value.trim();
  }
  showNoteModal.value = false;
};

// Camera handlers
const openReadyPhotoCamera = () => {
  cameraModalMode.value = 'ready';
  activeCameraItemId.value = null;
  showCamera.value = true;
};

const handleCapturedPhoto = (data: { dataUrl: string; blob: Blob }) => {
  showCamera.value = false;
  if (cameraModalMode.value === 'ready') {
    readyPhotoUrl.value = data.dataUrl;
    playSuccessChime();
  } else if (activeCameraItemId.value) {
    if (!itemPhotos.value[activeCameraItemId.value]) {
      itemPhotos.value[activeCameraItemId.value] = {};
    }
    if (cameraModalMode.value === 'before') {
      itemPhotos.value[activeCameraItemId.value].before = data.dataUrl;
    } else {
      itemPhotos.value[activeCameraItemId.value].after = data.dataUrl;
    }
    playSuccessChime();
  }
};

// Area score calculation according to PRD:
// Skor area = sum(nilai * bobot) / sum(2 * bobot) * 100%
const areaMetrics = computed(() => {
  let earnedScore = 0;
  let maxPossibleScore = 0;
  let unratedCount = 0;
  let failedKeyItem = false;
  let zeroCount = 0;

  props.area.sections.forEach(sec => {
    const items = getSectionItems(sec);
    items.forEach(item => {
      const val = ratings.value[item.id];
      if (val === undefined || val === null) {
        unratedCount++;
      } else if (val === 'NA') {
        // N/A excluded from formula
      } else {
        earnedScore += val * item.weight;
        maxPossibleScore += 2 * item.weight;
        if (val === 0) zeroCount++;
        if (item.is_key_item && val === 0) {
          failedKeyItem = true;
        }
      }
    });
  });

  const percentage = maxPossibleScore > 0 ? Math.round((earnedScore / maxPossibleScore) * 100) : 100;
  const isReady = !failedKeyItem && zeroCount === 0;

  return {
    score: percentage,
    unratedCount,
    failedKeyItem,
    zeroCount,
    isReady
  };
});

const handleSaveArea = () => {
  if (!readyPhotoUrl.value) {
    alert('Wajib mengambil 1 foto kondisi "Ready to Use" untuk area ini sebelum menyimpan!');
    openReadyPhotoCamera();
    return;
  }

  playSuccessChime();
  triggerHaptic('success');
  emit('saveArea', {
    areaId: props.area.id,
    ratings: ratings.value,
    itemNotes: itemNotes.value,
    itemPhotos: itemPhotos.value,
    readyPhotoUrl: readyPhotoUrl.value,
    score: areaMetrics.value.score,
    isReady: areaMetrics.value.isReady
  });
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 pb-28">
    <!-- Sticky Sub-Header -->
    <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div class="max-w-md mx-auto flex items-center justify-between">
        <button
          @click="emit('back')"
          class="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali
        </button>

        <div class="text-right">
          <div class="flex items-center gap-2 justify-end">
            <span class="text-xs font-bold text-white">{{ area.name }}</span>
            <span
              class="text-xs font-extrabold px-2 py-0.5 rounded-md"
              :class="areaMetrics.score >= 95 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : areaMetrics.score >= 85 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'"
            >
              {{ areaMetrics.score }}%
            </span>
          </div>
          <p class="text-[10px] text-slate-400">
            Slot {{ slot }} · {{ totalVisibleItems }} item {{ isFullCheck ? '(Pagi Lengkap)' : '(Frekuensi Rutin)' }}
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-md mx-auto p-4 space-y-4">
      <!-- Ready to Use Mandatory Photo Banner -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles class="w-4 h-4" /> Foto Wajib "Ready to Use"
            </div>
            <p class="text-xs text-slate-300 leading-snug">
              Foto kondisi keseluruhan area dengan watermark otomatis (waktu, area, petugas).
            </p>
          </div>
          <button
            @click="openReadyPhotoCamera"
            class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            :class="readyPhotoUrl ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'"
          >
            <Camera class="w-4 h-4" />
            <span>{{ readyPhotoUrl ? 'Ubah Foto' : 'Ambil Foto' }}</span>
          </button>
        </div>

        <!-- Thumbnail preview if photo taken -->
        <div v-if="readyPhotoUrl" class="mt-3 relative rounded-xl overflow-hidden border border-slate-700 max-h-36">
          <img :src="readyPhotoUrl" alt="Ready Photo" class="w-full h-36 object-cover" />
          <div class="absolute bottom-1 right-2 px-2 py-0.5 rounded bg-black/70 text-emerald-400 text-[10px] font-mono">
            READY PROOF SAVED
          </div>
        </div>
      </div>

      <!-- Warning if Ready-to-Use key item fails -->
      <div v-if="!areaMetrics.isReady" class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 text-xs text-rose-200 flex items-start gap-2.5">
        <AlertTriangle class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <p class="font-bold text-rose-300">Status Area: TIDAK SIAP</p>
          <p class="text-[11px] text-rose-200 mt-0.5">
            Ditemukan item bernilai 0 (Kotor) atau item kunci Ready-to-Use belum terpenuhi. Tiket temuan akan dibuat otomatis.
          </p>
        </div>
      </div>

      <!-- Sections & Items List -->
      <div
        v-for="section in area.sections"
        :key="section.id"
        class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
      >
        <!-- Section Header with "Semua Sesuai (2)" button -->
        <div class="p-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <button
            @click="collapsedSections[section.id] = !collapsedSections[section.id]"
            class="flex items-center gap-2 text-left flex-1"
          >
            <span class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
              {{ section.code }}
            </span>
            <div>
              <h4 class="font-bold text-xs text-white">{{ section.name }}</h4>
              <p class="text-[10px] text-slate-400">{{ getSectionItems(section).length }} item inspeksi</p>
            </div>
            <component
              :is="collapsedSections[section.id] ? ChevronDown : ChevronUp"
              class="w-4 h-4 text-slate-400 ml-auto shrink-0"
            />
          </button>

          <!-- 1-Tap "Semua Sesuai (2)" Button (PRD principle: exception-based inspection drops taps by 90%) -->
          <button
            @click.stop="markSectionAllGood(section)"
            class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0 transition active:scale-95"
            title="Tandai semua item sub-bagian ini bernilai Bagus (2)"
          >
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>Semua Sesuai (2)</span>
          </button>
        </div>

        <!-- Section Items (if not collapsed) -->
        <div v-show="!collapsedSections[section.id]" class="divide-y divide-slate-800/60 p-2">
          <div
            v-for="item in getSectionItems(section)"
            :key="item.id"
            class="p-2.5 rounded-xl transition"
            :class="ratings[item.id] === 0 ? 'bg-rose-500/5' : ratings[item.id] === 1 ? 'bg-amber-500/5' : ''"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-mono font-bold text-slate-400">{{ item.code }}</span>
                  <span
                    v-if="item.is_key_item"
                    class="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    ITEM KUNCI
                  </span>
                  <span
                    v-if="item.is_supply"
                    class="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  >
                    PERSEDIAAN
                  </span>
                </div>
                <p class="text-xs font-medium text-slate-200 mt-1 leading-snug">{{ item.text }}</p>

                <!-- Saved Note Preview -->
                <p v-if="itemNotes[item.id]" class="text-[11px] text-amber-300/90 mt-1 italic flex items-center gap-1">
                  <FileText class="w-3 h-3 shrink-0" /> {{ itemNotes[item.id] }}
                </p>
              </div>

              <!-- Note button -->
              <button
                @click="openNote(item.id)"
                class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white shrink-0 mt-0.5"
                :class="itemNotes[item.id] ? 'text-amber-400 border border-amber-500/30' : ''"
                title="Tambah Catatan"
              >
                <FileText class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Supply quick buttons if item is replenishment stock -->
            <div v-if="item.is_supply" class="mb-2 flex gap-1.5">
              <button
                v-for="st in (['Cukup', 'Menipis', 'Habis'] as SupplyStatus[])"
                :key="st"
                @click="setSupplyStatus(item.id, st)"
                class="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition"
                :class="
                  itemNotes[item.id]?.includes(st)
                    ? st === 'Cukup' ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300' : st === 'Menipis' ? 'bg-amber-500/25 border-amber-500 text-amber-300' : 'bg-rose-500/25 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                "
              >
                {{ st }}
              </button>
            </div>

            <!-- Big 3-Color Buttons (PRD: Nilai tanpa angka, Bagus-Hijau, Kurang-Kuning, Kotor-Merah) -->
            <!-- Minimum height 48px-56px per PRD -->
            <div class="grid grid-cols-3 gap-2">
              <!-- Bagus (2) -->
              <button
                @click="setItemRating(item.id, 2)"
                class="h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border"
                :class="ratings[item.id] === 2 ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'"
              >
                <Check class="w-4 h-4" v-if="ratings[item.id] === 2" />
                <span>Bagus (2)</span>
              </button>

              <!-- Kurang (1) -->
              <button
                @click="setItemRating(item.id, 1)"
                class="h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border"
                :class="ratings[item.id] === 1 ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'"
              >
                <AlertTriangle class="w-4 h-4" v-if="ratings[item.id] === 1" />
                <span>Kurang (1)</span>
              </button>

              <!-- Kotor (0) -->
              <button
                @click="setItemRating(item.id, 0)"
                class="h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border"
                :class="ratings[item.id] === 0 ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'"
              >
                <AlertTriangle class="w-4 h-4" v-if="ratings[item.id] === 0" />
                <span>Kotor (0)</span>
              </button>
            </div>

            <!-- Before/After Photo section if marked 0 or 1 -->
            <div v-if="ratings[item.id] === 0 || ratings[item.id] === 1" class="mt-2.5 p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Camera class="w-3 h-3" /> Foto Bukti Masalah (Sebelum / Sesudah)
                </span>
                <span class="text-[9px] text-slate-400">Wajib untuk nilai 0/1</span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <!-- Foto Sebelum -->
                <button
                  @click="activeCameraItemId = item.id; cameraModalMode = 'before'; showCamera = true"
                  class="py-2 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border"
                  :class="itemPhotos[item.id]?.before ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'"
                >
                  <Camera class="w-3.5 h-3.5" />
                  <span>{{ itemPhotos[item.id]?.before ? '✓ Foto Sebelum' : '+ Foto Sebelum' }}</span>
                </button>

                <!-- Foto Sesudah -->
                <button
                  @click="activeCameraItemId = item.id; cameraModalMode = 'after'; showCamera = true"
                  class="py-2 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border"
                  :class="itemPhotos[item.id]?.after ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'"
                >
                  <Camera class="w-3.5 h-3.5" />
                  <span>{{ itemPhotos[item.id]?.after ? '✓ Foto Sesudah' : '+ Foto Sesudah' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Bottom Save Area Action (>= 56px height) -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30">
      <div class="max-w-md mx-auto flex items-center gap-3">
        <div class="text-left">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Skor Area</p>
          <p class="text-lg font-black text-emerald-400 leading-none">{{ areaMetrics.score }}%</p>
        </div>

        <button
          @click="handleSaveArea"
          class="flex-1 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition"
        >
          <Check class="w-5 h-5" />
          <span>Simpan Area & Kembali</span>
        </button>
      </div>
    </div>

    <!-- Camera Modal -->
    <CameraModal
      v-if="showCamera"
      :title="cameraModalMode === 'ready' ? 'Foto Ready to Use' : cameraModalMode === 'before' ? 'Foto Sebelum Perbaikan' : 'Foto Sesudah Perbaikan'"
      :subtitle="cameraModalMode === 'ready' ? 'Bukti Kerapian & Kebersihan' : 'Bukti Temuan & Tindakan'"
      :area-name="area.name"
      :officer-name="officerName"
      :slot-name="slot"
      @close="showCamera = false"
      @captured="handleCapturedPhoto"
    />

    <!-- Note Modal -->
    <div v-if="showNoteModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
        <h4 class="font-bold text-white text-sm mb-2">Catatan Pemeriksaan Item</h4>
        <textarea
          v-model="tempNoteText"
          rows="3"
          placeholder="Tuliskan catatan kondisi spesifik (mis. Baut sedikit kendor, noda oli membandel)..."
          class="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-3"
        ></textarea>
        <div class="flex gap-2">
          <button
            @click="showNoteModal = false"
            class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            Batal
          </button>
          <button
            @click="saveNote"
            class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Simpan Catatan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
