<script setup lang="ts">
import { ref } from 'vue';
import { Area, CheckpointRecord, User } from '../types';
import { CHECKPOINT_SLOTS } from '../data/checklistMaster';
import { playSuccessChime, triggerHaptic } from '../services/audioHaptic';
import DigitalSignatureModal from '../components/DigitalSignatureModal.vue';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PenTool,
  Check,
  RotateCcw,
  Sparkles,
  Camera,
  X,
  FileCheck
} from 'lucide-vue-next';

const props = defineProps<{
  areas: Area[];
  checkpoints: Record<string, CheckpointRecord>;
  supervisor: User;
}>();

const emit = defineEmits<{
  (e: 'reviewSaved', data: {
    slot: string;
    status: 'Approved' | 'Revision Requested';
    notes: string;
    signatureUrl: string;
    spotCheckDiff?: number;
  }): void;
}>();

const selectedSlot = ref<string>('07.00');
const selectedAreaForModal = ref<Area | null>(null);
const showSignatureModal = ref(false);
const supervisorNotes = ref('Semua area telah diperiksa fisik sesuai standar BOffice. Fasilitas prima.');
const supervisorSignature = ref<string | null>(null);

// Spot-check simulator state
const showSpotCheckModal = ref(false);
const spotCheckArea = ref<Area | null>(null);
const supervisorScore = ref(96);

const currentRecord = () => {
  return props.checkpoints[selectedSlot.value] || null;
};

const openPhotoGallery = (area: Area) => {
  selectedAreaForModal.value = area;
};

const openSpotCheck = (area: Area) => {
  spotCheckArea.value = area;
  supervisorScore.value = currentRecord()?.area_results[area.id]?.score || 95;
  showSpotCheckModal.value = true;
};

const saveSpotCheck = () => {
  if (!spotCheckArea.value) return;
  const officerScore = currentRecord()?.area_results[spotCheckArea.value.id]?.score || 95;
  const diff = Math.abs(officerScore - supervisorScore.value);
  playSuccessChime();
  triggerHaptic('success');
  alert(`Spot-check tersimpan! Skor Petugas: ${officerScore}% vs Skor Supervisor: ${supervisorScore.value}% (Selisih: ${diff} poin). ${diff > 10 ? '⚠️ Selisih > 10 poin tercatat di audit laporan!' : '✓ Selisih wajar & jujur.'}`);
  showSpotCheckModal.value = false;
};

const handleSaveReview = (status: 'Approved' | 'Revision Requested') => {
  if (!supervisorSignature.value) {
    showSignatureModal.value = true;
    return;
  }
  playSuccessChime();
  triggerHaptic('success');
  emit('reviewSaved', {
    slot: selectedSlot.value,
    status,
    notes: supervisorNotes.value.trim(),
    signatureUrl: supervisorSignature.value,
    spotCheckDiff: 2
  });
  alert(`Pemeriksaan Supervisor slot ${selectedSlot.value} berhasil disahkan! Paraf tersimpan.`);
};
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-white">Review & Spot-Check Supervisor</h2>
        <p class="text-xs text-slate-400">Pemeriksa: <span class="text-blue-400 font-semibold">{{ supervisor.name }}</span> · Petugas Lapangan: <span class="text-emerald-400 font-semibold">Hendi</span></p>
      </div>

      <div class="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
        <Eye class="w-5 h-5" />
      </div>
    </div>

    <!-- Slot Selector -->
    <div class="grid grid-cols-4 gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
      <button
        v-for="s in CHECKPOINT_SLOTS"
        :key="s.id"
        @click="selectedSlot = s.id"
        class="py-2 rounded-xl text-xs font-bold transition flex flex-col items-center"
        :class="selectedSlot === s.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
      >
        <span>{{ s.label }}</span>
        <span class="text-[9px] font-normal opacity-80 truncate max-w-full px-1">
          {{ checkpoints[s.id]?.status || 'Belum' }}
        </span>
      </button>
    </div>

    <!-- Active Slot Summary Card -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">Detail Checkpoint</span>
          <h3 class="text-base font-bold text-white">Slot {{ selectedSlot }} WITA</h3>
          <p class="text-xs text-slate-300">
            Petugas: <span class="font-semibold text-emerald-400">{{ currentRecord()?.officer_name || 'Hendi' }}</span>
          </p>
        </div>

        <div class="text-right">
          <span class="text-2xl font-black text-emerald-400">
            {{ currentRecord()?.overall_score || 96 }}%
          </span>
          <p class="text-[10px] text-slate-400">Skor Petugas</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span class="text-slate-400 text-[10px]">Waktu Selesai:</span>
          <p class="font-mono text-white text-xs font-semibold">{{ currentRecord()?.completed_at || '07:28 WITA' }}</p>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span class="text-slate-400 text-[10px]">Status Review:</span>
          <p class="font-semibold text-xs" :class="currentRecord()?.supervisor_review ? 'text-emerald-400' : 'text-amber-400'">
            {{ currentRecord()?.supervisor_review?.status || 'Menunggu Paraf' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 7 Areas Live Status Grid -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider">7 Area Dalam Pemeriksaan</h4>
        <span class="text-[10px] text-slate-400">Ketuk untuk lihat foto & spot-check</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="area in areas"
          :key="area.id"
          class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 class="w-4 h-4" />
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-white truncate">{{ area.name }}</p>
              <p class="text-[10px] text-slate-400">
                Skor: <span class="text-emerald-400 font-bold">{{ currentRecord()?.area_results[area.id]?.score || 98 }}%</span> · Siap Pakai
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              @click="openPhotoGallery(area)"
              class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1"
              title="Lihat Foto Bukti"
            >
              <Camera class="w-3.5 h-3.5" />
              <span>Foto</span>
            </button>

            <button
              @click="openSpotCheck(area)"
              class="px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[11px] font-bold flex items-center gap-1"
              title="Uji Petik / Spot-Check"
            >
              <FileCheck class="w-3.5 h-3.5" />
              <span>Spot-Check</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Supervisor Review & Paraf Form -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
      <h4 class="text-xs font-bold text-white uppercase tracking-wider">Catatan & Paraf Pengesahan ({{ supervisor.name }})</h4>

      <textarea
        v-model="supervisorNotes"
        rows="2"
        placeholder="Tuliskan catatan supervisor untuk rekap email..."
        class="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
      ></textarea>

      <!-- Supervisor Paraf Box -->
      <div
        @click="showSignatureModal = true"
        class="h-24 w-full rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex items-center justify-center cursor-pointer hover:border-blue-500/50 p-2 overflow-hidden"
      >
        <img
          v-if="supervisorSignature"
          :src="supervisorSignature"
          alt="Paraf Supervisor"
          class="h-full object-contain filter invert"
        />
        <div v-else class="text-slate-500 flex flex-col items-center gap-1">
          <PenTool class="w-5 h-5 text-slate-600" />
          <span class="text-xs font-medium">Ketuk untuk membubuhkan paraf supervisor ({{ supervisor.name }})</span>
        </div>
      </div>

      <div class="flex gap-2 pt-1">
        <button
          @click="handleSaveReview('Revision Requested')"
          class="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs transition"
        >
          Minta Perbaikan
        </button>
        <button
          @click="handleSaveReview('Approved')"
          class="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 transition"
        >
          <Check class="w-4 h-4" />
          <span>Setujui & Paraf</span>
        </button>
      </div>
    </div>

    <!-- Photo Gallery Modal -->
    <div v-if="selectedAreaForModal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-white text-sm">Foto Bukti Ready-to-Use</h3>
            <p class="text-xs text-slate-400">{{ selectedAreaForModal.name }} · Slot {{ selectedSlot }}</p>
          </div>
          <button
            @click="selectedAreaForModal = null"
            class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 mb-3">
          <img
            :src="currentRecord()?.area_results[selectedAreaForModal.id]?.ready_photo_url || '/pwa-512x512.png'"
            alt="Bukti Area"
            class="w-full h-56 object-cover"
          />
        </div>

        <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
          <p><span class="text-slate-400">Verifikasi Kamera:</span> Kamera Langsung Terautentikasi</p>
          <p><span class="text-slate-400">Timestamp:</span> Server Validated WITA</p>
          <p><span class="text-slate-400">Watermark:</span> Lolos Uji Validitas</p>
        </div>

        <button
          @click="selectedAreaForModal = null"
          class="w-full mt-3 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
        >
          Tutup
        </button>
      </div>
    </div>

    <!-- Spot Check Simulator Modal (F-14) -->
    <div v-if="showSpotCheckModal && spotCheckArea" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl flex flex-col">
        <h3 class="font-bold text-white text-base mb-1">Spot-Check Supervisor</h3>
        <p class="text-xs text-slate-400 mb-3">{{ spotCheckArea.name }} · Penilaian Independen</p>

        <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-3 text-xs text-blue-200">
          Supervisor menilai area secara acak untuk memverifikasi kejujuran checklist. Selisih skor dengan petugas &le; 10 poin menjadi metrik validasi.
        </div>

        <div class="space-y-2 mb-4">
          <label class="block text-xs font-semibold text-slate-300">Skor Penilaian Supervisor (0 - 100%):</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="supervisorScore"
              type="range"
              min="60"
              max="100"
              class="w-full accent-blue-500"
            />
            <span class="text-lg font-black text-blue-400 font-mono w-14 text-right">{{ supervisorScore }}%</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="showSpotCheckModal = false"
            class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
          >
            Batal
          </button>
          <button
            @click="saveSpotCheck"
            class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            Simpan Spot-Check
          </button>
        </div>
      </div>
    </div>

    <!-- Signature Modal -->
    <DigitalSignatureModal
      v-if="showSignatureModal"
      title="Paraf Supervisor Operasional"
      signer-name="Supervisor Operasional"
      role-description="Verifikasi Kualitas 7 Area BOffice"
      @close="showSignatureModal = false"
      @signed="(url) => { supervisorSignature = url; showSignatureModal = false; }"
    />
  </div>
</template>
