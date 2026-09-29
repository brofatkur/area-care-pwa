<script setup lang="ts">
import { ref } from 'vue';
import { playSuccessChime, triggerHaptic } from '../services/audioHaptic';
import { UserCheck, X, Check, AlertCircle } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'registerSubstitute', data: { name: string; phone: string; originTeam: string; reason: string }): void;
}>();

const name = ref('');
const phone = ref('');
const originTeam = ref('Customer Support Tim 2');
const reason = ref('Menggantikan Hendi (Cuti / Izin)');
const errorMsg = ref('');

const handleSubmit = () => {
  if (!name.value.trim() || !phone.value.trim()) {
    errorMsg.value = 'Harap isi Nama Lengkap dan Nomor WhatsApp Anda.';
    return;
  }
  playSuccessChime();
  triggerHaptic('success');
  emit('registerSubstitute', {
    name: name.value.trim(),
    phone: phone.value.trim(),
    originTeam: originTeam.value.trim(),
    reason: reason.value.trim()
  });
};
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 text-slate-900">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <UserCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-black text-slate-900 text-base leading-tight">Saya Pengganti Hari Ini</h3>
            <p class="text-xs text-slate-500 font-medium">Relief Officer On-Duty</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-3 bg-amber-50 border border-amber-300 rounded-2xl mb-4 text-xs text-amber-900 flex items-start gap-2 font-medium">
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
        <p>
          Petugas dari tim lain dapat langsung mulai tanpa menunggu konfirmasi manual. Supervisor akan menerima notifikasi otomatis.
        </p>
      </div>

      <div class="space-y-3 mb-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Petugas Pengganti *</label>
          <input
            v-model="name"
            type="text"
            placeholder="mis. Budi Santoso"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif *</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="mis. 08123456789"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Divisi / Tim Asal</label>
          <input
            v-model="originTeam"
            type="text"
            placeholder="mis. Customer Service, IT Support"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Alasan Penugasan</label>
          <input
            v-model="reason"
            type="text"
            placeholder="mis. Petugas utama izin sakit"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white"
          />
        </div>

        <p v-if="errorMsg" class="text-xs text-rose-600 font-bold">{{ errorMsg }}</p>
      </div>

      <div class="flex gap-2">
        <button
          @click="emit('close')"
          class="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 transition"
        >
          <Check class="w-4 h-4" /> Mulai Tugas Pengganti
        </button>
      </div>
    </div>
  </div>
</template>
