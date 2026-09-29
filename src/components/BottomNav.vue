<script setup lang="ts">
import { Role } from '../types';
import { CalendarCheck2, AlertCircle, Award, Eye, LayoutDashboard, Mail } from 'lucide-vue-next';

defineProps<{
  activeTab: string;
  role: Role;
  openFindingsCount: number;
}>();

const emit = defineEmits<{
  (e: 'changeTab', tab: string): void;
}>();
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
    <div class="max-w-md mx-auto grid" :class="role === 'officer' ? 'grid-cols-3' : 'grid-cols-5'">
      <!-- Tab 1: Hari Ini -->
      <button
        @click="emit('changeTab', 'today')"
        class="flex flex-col items-center justify-center py-2.5 px-1 relative transition"
        :class="activeTab === 'today' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
      >
        <CalendarCheck2 class="w-5 h-5 mb-1" :class="activeTab === 'today' ? 'stroke-[2.5]' : ''" />
        <span class="text-[11px] leading-tight">Hari Ini</span>
        <div v-if="activeTab === 'today'" class="absolute bottom-1 w-6 h-0.5 bg-emerald-600 rounded-full"></div>
      </button>

      <!-- Tab 2: Temuan -->
      <button
        @click="emit('changeTab', 'findings')"
        class="flex flex-col items-center justify-center py-2.5 px-1 relative transition"
        :class="activeTab === 'findings' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
      >
        <div class="relative">
          <AlertCircle class="w-5 h-5 mb-1" :class="activeTab === 'findings' ? 'stroke-[2.5]' : ''" />
          <span
            v-if="openFindingsCount > 0"
            class="absolute -top-1 -right-2 px-1.5 py-0.2 bg-rose-600 text-white font-black text-[9px] rounded-full border border-white shadow-xs animate-pulse"
          >
            {{ openFindingsCount }}
          </span>
        </div>
        <span class="text-[11px] leading-tight">Temuan</span>
        <div v-if="activeTab === 'findings'" class="absolute bottom-1 w-6 h-0.5 bg-emerald-600 rounded-full"></div>
      </button>

      <!-- Tab 3: Skor Saya -->
      <button
        @click="emit('changeTab', 'score')"
        class="flex flex-col items-center justify-center py-2.5 px-1 relative transition"
        :class="activeTab === 'score' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
      >
        <Award class="w-5 h-5 mb-1" :class="activeTab === 'score' ? 'stroke-[2.5]' : ''" />
        <span class="text-[11px] leading-tight">Skor Saya</span>
        <div v-if="activeTab === 'score'" class="absolute bottom-1 w-6 h-0.5 bg-emerald-600 rounded-full"></div>
      </button>

      <!-- Tab 4: Supervisor (only for supervisor/management) -->
      <button
        v-if="role !== 'officer'"
        @click="emit('changeTab', 'supervisor')"
        class="flex flex-col items-center justify-center py-2.5 px-1 relative transition"
        :class="activeTab === 'supervisor' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
      >
        <Eye class="w-5 h-5 mb-1" :class="activeTab === 'supervisor' ? 'stroke-[2.5]' : ''" />
        <span class="text-[11px] leading-tight">Review</span>
        <div v-if="activeTab === 'supervisor'" class="absolute bottom-1 w-6 h-0.5 bg-blue-600 rounded-full"></div>
      </button>

      <!-- Tab 5: Dashboard Manajemen (only for supervisor/management) -->
      <button
        v-if="role !== 'officer'"
        @click="emit('changeTab', 'dashboard')"
        class="flex flex-col items-center justify-center py-2.5 px-1 relative transition"
        :class="activeTab === 'dashboard' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
      >
        <LayoutDashboard class="w-5 h-5 mb-1" :class="activeTab === 'dashboard' ? 'stroke-[2.5]' : ''" />
        <span class="text-[11px] leading-tight">Dashboard</span>
        <div v-if="activeTab === 'dashboard'" class="absolute bottom-1 w-6 h-0.5 bg-purple-600 rounded-full"></div>
      </button>
    </div>
  </nav>
</template>
