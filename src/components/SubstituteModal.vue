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
  <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <UserCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-white text-base leading-tight">Saya Pengganti Hari Ini</h3>
            <p class="text-xs text-slate-400">Relief Officer On-Duty</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 text-xs text-amber-200 flex items-start gap-2">
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p>
          Petugas dari tim lain dapat langsung mulai tanpa menunggu konfirmasi manual. Supervisor akan menerima notifikasi otomatis.
        </p>
      </div>

      <div class="space-y-3 mb-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Petugas Pengganti *</label>
          <input
            v-model="name"
            type="text"
            placeholder="mis. Budi Santoso"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp Aktif *</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="mis. 08123456789"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Divisi / Tim Asal</label>
          <input
            v-model="originTeam"
            type="text"
            placeholder="mis. Customer Service, IT Support"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Alasan Penugasan</label>
          <input
            v-model="reason"
            type="text"
            placeholder="mis. Petugas utama izin sakit"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <p v-if="errorMsg" class="text-xs text-rose-400 font-medium">{{ errorMsg }}</p>
      </div>

      <div class="flex gap-2">
        <button
          @click="emit('close')"
          class="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          <Check class="w-4 h-4" /> Mulai Bertugas
        </button>
      </div>
    </div>
  </div>
</template>
