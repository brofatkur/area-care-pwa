<script setup lang="ts">
import { ref } from 'vue';
import { playTapSound, playSuccessChime } from '../services/audioHaptic';
import { ClipboardList, CheckCircle2, Camera, Award, ChevronRight, X } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const currentStep = ref(0);

const steps = [
  {
    title: '1. Check-In & Langsung Pilih Area',
    subtitle: 'Mudah Tanpa Perlu Scan QR',
    icon: ClipboardList,
    color: 'emerald',
    description: 'Cukup tekan tombol Check-In saat mulai shift. Timer kerja otomatis berjalan. Untuk mengisi checklist, langsung ketuk nama area tanpa perlu repot scan QR.'
  },
  {
    title: '2. Isi Berbasis Pengecualian',
    subtitle: 'Hemat 90% Ketukan',
    icon: CheckCircle2,
    color: 'green',
    description: 'Cukup tekan tombol hijau "Semua Sesuai (2)" per sub-bagian bila semua item beres. Anda hanya perlu menandai item yang bernilai Kurang (1) atau Kotor (0).'
  },
  {
    title: '3. Foto Bukti Ber-Watermark',
    subtitle: 'Otomatis Validasi Waktu & Lokasi',
    icon: Camera,
    color: 'blue',
    description: 'Ambil 1 foto kondisi "Ready to Use" per area. Bila ada item 0/1, sertakan foto sebelum & sesudah perbaikan langsung dari kamera HP.'
  },
  {
    title: '4. Paraf & Raih Poin',
    subtitle: 'Penghargaan Kerja Nyata',
    icon: Award,
    color: 'amber',
    description: 'Bubuhkan paraf digital lalu submit. Dapatkan +10 poin tepat waktu, +10 foto lengkap, +5 perbaikan temuan, dan pertahankan streak harian!'
  }
];

const nextStep = () => {
  playTapSound();
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  } else {
    playSuccessChime();
    emit('close');
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 text-slate-900">
      <!-- Top indicators -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex gap-1.5">
          <div
            v-for="(_, idx) in steps"
            :key="idx"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="idx === currentStep ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-200'"
          ></div>
        </div>
        <button
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Icon & Step Details -->
      <div class="text-center py-4">
        <div class="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto mb-4 shadow-sm">
          <component :is="steps[currentStep].icon" class="w-10 h-10" />
        </div>

        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          {{ steps[currentStep].subtitle }}
        </span>
        <h3 class="text-xl font-black text-slate-900 mt-1 mb-2">
          {{ steps[currentStep].title }}
        </h3>
        <p class="text-xs text-slate-600 leading-relaxed px-2 font-medium">
          {{ steps[currentStep].description }}
        </p>
      </div>

      <!-- Bottom action button -->
      <div class="mt-4 pt-2">
        <button
          @click="nextStep"
          class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-95"
        >
          <span>{{ currentStep === steps.length - 1 ? 'Mulai Sekarang' : 'Lanjut' }}</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
