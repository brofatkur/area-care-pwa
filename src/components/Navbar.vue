<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { User, Role } from '../types';
import { getPendingSyncQueue, processSyncQueue } from '../services/offlineQueue';
import { Wifi, WifiOff, RefreshCw, UserCheck, Shield, ChevronDown, Check, Award } from 'lucide-vue-next';

const props = defineProps<{
  currentUser: User;
  isSubstitute: boolean;
}>();

const emit = defineEmits<{
  (e: 'switchUser', user: User, isSub?: boolean): void;
  (e: 'openTour'): void;
}>();

const isOnline = ref(navigator.onLine);
const pendingCount = ref(0);
const isSyncing = ref(false);
const showRoleMenu = ref(false);

const availableUsers: Array<{ user: User; isSub?: boolean; desc: string }> = [
  {
    user: {
      id: 'usr_hendi',
      name: 'Hendi',
      role: 'officer',
      title: 'Petugas Area Care (Eksekutor)',
      origin_team: 'Facility & Care Team',
      phone: '081234567890',
      pin: '123456'
    },
    desc: 'Eksekusi checklist & centang tugas yang sudah dikerjakan'
  },
  {
    user: {
      id: 'usr_pasek',
      name: 'Pasek',
      role: 'supervisor',
      title: 'Supervisor Operasional (Pemeriksa)',
      origin_team: 'Operations Management',
      phone: '082222222222',
      pin: '123456'
    },
    desc: 'Pemeriksa pekerjaan Hendi, spot-check, & paraf digital'
  },
  {
    user: {
      id: 'usr_bagus',
      name: 'Bagus',
      role: 'management',
      title: 'Direktur',
      origin_team: 'Board of Directors',
      phone: '081111111111',
      pin: '123456'
    },
    desc: 'Dashboard eksekutif & monitoring KPI'
  },
  {
    user: {
      id: 'usr_substitute',
      name: 'Budi Santoso',
      role: 'officer',
      title: 'Petugas Pengganti (Relief)',
      origin_team: 'Customer Support Tim 2',
      phone: '081388776655',
      pin: '123456'
    },
    isSub: true,
    desc: 'Pengganti jika Hendi berhalangan'
  }
];

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
  refreshPendingCount();
};

const refreshPendingCount = async () => {
  const queue = await getPendingSyncQueue();
  pendingCount.value = queue.length;
};

const handleSync = async () => {
  if (isSyncing.value || !isOnline.value) return;
  isSyncing.value = true;
  try {
    await processSyncQueue();
    await refreshPendingCount();
  } finally {
    isSyncing.value = false;
  }
};

let syncInterval: any = null;

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  refreshPendingCount();
  syncInterval = setInterval(() => {
    refreshPendingCount();
    if (navigator.onLine && pendingCount.value > 0) {
      handleSync();
    }
  }, 10000);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
  if (syncInterval) clearInterval(syncInterval);
});

const selectUser = (u: User, isSub?: boolean) => {
  emit('switchUser', u, isSub);
  showRoleMenu.value = false;
};
</script>

<template>
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
    <!-- Top Authority & Trust Bar -->
    <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-1.5 px-3 sm:px-4 text-[10px] sm:text-[11px] border-b border-blue-900/40">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shadow-xs">
            <Award class="w-3 h-3 text-slate-950" />
            Sejak 2004
          </span>
          <span class="text-slate-200 font-medium truncate">
            <strong class="text-white font-black tracking-tight">PT Wahana Manuskrip Semesta</strong>
            <span class="text-blue-300 mx-1">·</span>
            <span class="text-blue-100 font-semibold">20+ Tahun Pengalaman Terpercaya</span>
          </span>
        </div>

        <div class="hidden md:flex items-center gap-1.5 text-blue-200 text-[10px] font-medium shrink-0">
          <Shield class="w-3 h-3 text-emerald-400" />
          <span>Layanan Resmi & Tersumpah Terdaftar</span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
      <!-- Brand & Location -->
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-xs sm:text-sm tracking-wider shrink-0 border border-white/20">
          JT
        </div>
        <div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <h1 class="font-black text-sm sm:text-base tracking-tight text-slate-900 leading-tight">Jakarta Translator</h1>
            <span class="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">EST. 2004</span>
          </div>
          <p class="text-[11px] text-slate-600 font-semibold leading-tight mt-0.5 flex items-center gap-1">
            <span>PT Wahana Manuskrip Semesta</span>
            <span class="text-slate-400">·</span>
            <span class="text-emerald-700 font-bold">Area Care Officer</span>
          </p>
        </div>
      </div>

      <!-- Right status & Role trigger -->
      <div class="flex items-center gap-2">
        <!-- Online/Offline & Sync button -->
        <button
          @click="handleSync"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition"
          :class="[
            !isOnline
              ? 'bg-rose-100 text-rose-700 border border-rose-300'
              : pendingCount > 0
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          ]"
          :title="isOnline ? 'Online - Klik untuk sinkron' : 'Offline - Menunggu jaringan'"
        >
          <component :is="isOnline ? Wifi : WifiOff" class="w-3.5 h-3.5" />
          <span v-if="!isOnline" class="font-bold text-[11px]">Offline</span>
          <span v-else-if="pendingCount > 0" class="font-bold text-[11px] flex items-center gap-1">
            <RefreshCw class="w-3 h-3 animate-spin" v-if="isSyncing" />
            <span v-else>{{ pendingCount }} antrian</span>
          </span>
          <span v-else class="text-[11px] font-bold hidden sm:inline">Online</span>
        </button>

        <!-- Role selector button -->
        <div class="relative">
          <button
            @click="showRoleMenu = !showRoleMenu"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs text-slate-800 font-bold transition shadow-xs"
          >
            <div class="w-2.5 h-2.5 rounded-full" :class="currentUser.role === 'management' ? 'bg-purple-600' : currentUser.role === 'supervisor' ? 'bg-blue-600' : 'bg-emerald-600'"></div>
            <span class="font-bold max-w-[85px] sm:max-w-[120px] truncate">{{ currentUser.name }}</span>
            <ChevronDown class="w-3.5 h-3.5 text-slate-500" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="showRoleMenu"
            class="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95"
          >
            <div class="px-2.5 py-2 border-b border-slate-100 mb-1">
              <p class="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pilih Akun / Peran Uji Coba</p>
              <p class="text-xs text-slate-700 font-semibold">Beralih peran secara instan untuk verifikasi</p>
            </div>

            <div class="space-y-1">
              <button
                v-for="item in availableUsers"
                :key="item.user.id"
                @click="selectUser(item.user, item.isSub)"
                class="w-full text-left p-2 rounded-xl flex items-start justify-between transition"
                :class="currentUser.id === item.user.id ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold' : 'hover:bg-slate-100 text-slate-700 font-medium'"
              >
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-xs" :class="currentUser.id === item.user.id ? 'text-blue-900' : 'text-slate-900'">{{ item.user.name }}</span>
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                      :class="item.user.role === 'management' ? 'bg-purple-100 text-purple-800 border border-purple-200' : item.user.role === 'supervisor' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'"
                    >
                      {{ item.user.role }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">{{ item.desc }}</p>
                </div>
                <Check v-if="currentUser.id === item.user.id" class="w-4 h-4 text-blue-600 shrink-0 mt-1" />
              </button>
            </div>

            <div class="mt-2 pt-2 border-t border-slate-100">
              <button
                @click="emit('openTour'); showRoleMenu = false"
                class="w-full text-center py-2 text-xs text-blue-600 hover:text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition"
              >
                📖 Buka Panduan & Tur 60 Detik
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
