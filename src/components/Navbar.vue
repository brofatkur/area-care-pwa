<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { User, Role } from '../types';
import { getPendingSyncQueue, processSyncQueue } from '../services/offlineQueue';
import { Wifi, WifiOff, RefreshCw, UserCheck, Shield, ChevronDown, Check } from 'lucide-vue-next';

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
  <header class="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <!-- Brand & Location -->
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
          AC
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h1 class="font-bold text-sm tracking-tight text-white leading-tight">Area Care Officer</h1>
            <span class="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PWA</span>
          </div>
          <p class="text-[11px] text-slate-400 font-mono">care.boffice.co.id · WITA</p>
        </div>
      </div>

      <!-- Right status & Role trigger -->
      <div class="flex items-center gap-2">
        <!-- Online/Offline & Sync button -->
        <button
          @click="handleSync"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition"
          :class="[
            !isOnline
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : pendingCount > 0
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'bg-slate-800/80 text-emerald-400 border border-slate-700'
          ]"
          :title="isOnline ? 'Online - Klik untuk sinkron' : 'Offline - Menunggu jaringan'"
        >
          <component :is="isOnline ? Wifi : WifiOff" class="w-3.5 h-3.5" />
          <span v-if="!isOnline" class="font-medium text-[11px]">Offline</span>
          <span v-else-if="pendingCount > 0" class="font-medium text-[11px] flex items-center gap-1">
            <RefreshCw class="w-3 h-3 animate-spin" v-if="isSyncing" />
            <span v-else>{{ pendingCount }} antrian</span>
          </span>
          <span v-else class="text-[11px] font-medium hidden sm:inline">Online</span>
        </button>

        <!-- Role selector button -->
        <div class="relative">
          <button
            @click="showRoleMenu = !showRoleMenu"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition"
          >
            <div class="w-2 h-2 rounded-full" :class="currentUser.role === 'management' ? 'bg-purple-400' : currentUser.role === 'supervisor' ? 'bg-blue-400' : 'bg-emerald-400'"></div>
            <span class="font-medium max-w-[85px] sm:max-w-[120px] truncate">{{ currentUser.name }}</span>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="showRoleMenu"
            class="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
          >
            <div class="px-2.5 py-2 border-b border-slate-800 mb-1">
              <p class="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Pilih Akun / Peran Uji Coba</p>
              <p class="text-xs text-slate-300 font-medium">Beralih peran secara instan untuk verifikasi</p>
            </div>

            <div class="space-y-1">
              <button
                v-for="item in availableUsers"
                :key="item.user.id"
                @click="selectUser(item.user, item.isSub)"
                class="w-full text-left p-2 rounded-lg flex items-start justify-between transition"
                :class="currentUser.id === item.user.id ? 'bg-emerald-500/15 border border-emerald-500/30 text-white' : 'hover:bg-slate-800 text-slate-300'"
              >
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="font-semibold text-xs text-white">{{ item.user.name }}</span>
                    <span
                      class="text-[10px] px-1.5 py-0.2 rounded font-medium"
                      :class="item.user.role === 'management' ? 'bg-purple-900/50 text-purple-300' : item.user.role === 'supervisor' ? 'bg-blue-900/50 text-blue-300' : 'bg-emerald-900/50 text-emerald-300'"
                    >
                      {{ item.user.role }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ item.desc }}</p>
                </div>
                <Check v-if="currentUser.id === item.user.id" class="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
              </button>
            </div>

            <div class="mt-2 pt-2 border-t border-slate-800">
              <button
                @click="emit('openTour'); showRoleMenu = false"
                class="w-full text-center py-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
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
