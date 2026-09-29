<script setup lang="ts">
import { ref, computed } from 'vue';
import { Area, CheckpointSlot, CheckpointRecord, User } from '../types';
import { playSuccessChime, triggerHaptic } from '../services/audioHaptic';
import confetti from 'canvas-confetti';
import DigitalSignatureModal from '../components/DigitalSignatureModal.vue';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  PenTool,
  Check,
  Send
} from 'lucide-vue-next';

const props = defineProps<{
  slot: CheckpointSlot;
  areas: Area[];
  officer: User;
  record: CheckpointRecord;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'submitted', data: { score: number; signatureUrl: string; pointsEarned: number }): void;
}>();

const showSignatureModal = ref(false);
const officerSignature = ref<string | null>(props.record.signature_url || null);
const isSubmitting = ref(false);

// Calculate overall checkpoint score: weighted average of the 7 areas
const overallScore = computed(() => {
  const areaResults = props.record.area_results || {};
  let totalScore = 0;
  let count = 0;
  props.areas.forEach(a => {
    const res = areaResults[a.id];
    if (res && res.score !== undefined) {
      totalScore += res.score;
      count++;
    }
  });
  return count > 0 ? Math.round(totalScore / count) : 0;
});

// Gamification points calculation for this submission
const calculatedPoints = computed(() => {
  let pts = 0;
  // +10 on time
  pts += 10;
  // +10 all photos complete
  const allPhotos = props.areas.every(a => props.record.area_results[a.id]?.ready_photo_url);
  if (allPhotos) pts += 10;
  // +20 bonus if 100% complete
  if (props.areas.length === Object.keys(props.record.area_results).length) {
    pts += 20;
  }
  return pts;
});

const onSigned = (dataUrl: string) => {
  officerSignature.value = dataUrl;
  showSignatureModal.value = false;
};

const handleSubmitFinal = () => {
  if (!officerSignature.value) {
    showSignatureModal.value = true;
    return;
  }

  isSubmitting.value = true;
  playSuccessChime();
  triggerHaptic('success');

  // Trigger celebration confetti
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch (e) {
    // Ignore
  }

  setTimeout(() => {
    emit('submitted', {
      score: overallScore.value,
      signatureUrl: officerSignature.value!,
      pointsEarned: calculatedPoints.value
    });
    isSubmitting.value = false;
  }, 600);
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 pb-28">
    <!-- Header -->
    <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div class="max-w-md mx-auto flex items-center justify-between">
        <button
          @click="emit('back')"
          class="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali
        </button>

        <div class="text-right">
          <span class="text-xs font-bold text-white">Ringkasan Checkpoint {{ slot }}</span>
          <p class="text-[10px] text-slate-400">Verifikasi & Paraf Digital</p>
        </div>
      </div>
    </div>

    <div class="max-w-md mx-auto p-4 space-y-4">
      <!-- Overall Score Showcase -->
      <div class="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Skor Rata-Rata Checkpoint {{ slot }}
        </span>
        <div class="text-5xl font-black text-white mt-1 tracking-tight">
          {{ overallScore }}%
        </div>
        <p class="text-xs text-emerald-300/80 mt-1">
          {{ overallScore >= 95 ? 'Memenuhi Standar Prima (Grade A)' : overallScore >= 85 ? 'Memenuhi Standar Baik (Grade B)' : 'Perlu Perbaikan Segera' }}
        </p>

        <!-- Gamification points highlight -->
        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs font-semibold text-slate-300">
          <span class="flex items-center gap-1 text-amber-300">
            <Award class="w-4 h-4" /> +{{ calculatedPoints }} Poin Gamifikasi
          </span>
          <span class="text-slate-600">·</span>
          <span class="text-emerald-400 font-mono">Streak +1 Hari</span>
        </div>
      </div>

      <!-- Area Breakdown Matrix -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">7 Area Terperiksa</h4>

        <div class="space-y-2">
          <div
            v-for="area in areas"
            :key="area.id"
            class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
          >
            <div class="flex items-center gap-2.5">
              <CheckCircle2
                v-if="record.area_results[area.id]?.ready_photo_url"
                class="w-5 h-5 text-emerald-400"
              />
              <AlertTriangle v-else class="w-5 h-5 text-amber-400" />

              <div>
                <p class="text-xs font-bold text-white">{{ area.name }}</p>
                <p class="text-[10px] text-slate-400">
                  {{ record.area_results[area.id]?.ready_photo_url ? 'Foto Ready terverifikasi' : 'Foto belum diambil' }}
                </p>
              </div>
            </div>

            <div class="text-right">
              <span class="text-xs font-black text-emerald-400">
                {{ record.area_results[area.id]?.score ?? 100 }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Digital Signature Section (Paraf Digital Petugas) -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg text-center">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-1">Paraf Digital Petugas Bertugas</h4>
        <p class="text-xs text-slate-400 mb-3">
          Atas nama: <span class="text-emerald-400 font-semibold">{{ officer.name }}</span> ({{ officer.title }})
        </p>

        <div
          @click="showSignatureModal = true"
          class="relative h-28 w-full rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition p-2 overflow-hidden"
        >
          <img
            v-if="officerSignature"
            :src="officerSignature"
            alt="Paraf Digital"
            class="h-full object-contain filter invert"
          />
          <div v-else class="text-slate-500 flex flex-col items-center gap-1">
            <PenTool class="w-6 h-6 text-slate-600" />
            <span class="text-xs font-medium">Ketuk di sini untuk membubuhkan paraf</span>
          </div>
        </div>

        <button
          v-if="officerSignature"
          @click="showSignatureModal = true"
          class="mt-2 text-xs text-slate-400 hover:text-emerald-400 font-medium underline"
        >
          Ubah Paraf
        </button>
      </div>
    </div>

    <!-- Sticky Bottom Submit Action -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30">
      <div class="max-w-md mx-auto">
        <button
          @click="handleSubmitFinal"
          :disabled="isSubmitting"
          class="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-95 transition"
        >
          <Send class="w-5 h-5" />
          <span>{{ officerSignature ? 'KIRIM CHECKPOINT KE SUPERVISOR (PASEK)' : 'BUBUHKAN PARAF & KIRIM KE PASEK' }}</span>
        </button>
      </div>
    </div>

    <!-- Signature Modal -->
    <DigitalSignatureModal
      v-if="showSignatureModal"
      title="Paraf Digital Petugas"
      :signer-name="officer.name"
      :role-description="officer.title"
      @close="showSignatureModal = false"
      @signed="onSigned"
    />
  </div>
</template>
