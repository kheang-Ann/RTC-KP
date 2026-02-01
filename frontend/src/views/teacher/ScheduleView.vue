<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  schedulesService,
  type Schedule,
  type DayOfWeek,
  type TimeSlot,
  type ScheduleType,
  type Semester,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  SCHEDULE_TYPES,
  SEMESTERS,
  getSlotIndex,
} from '@/services/schedules'

const schedules = ref<Schedule[]>([])
const loading = ref(false)
const error = ref('')
const selectedSemester = ref<Semester>(1)

// Helper to get schedule for a specific day and time slot
function getScheduleAt(day: DayOfWeek, slotValue: TimeSlot): Schedule | null {
  return schedules.value.find((s) => {
    if (s.dayOfWeek !== day) return false
    const scheduleStart = getSlotIndex(s.startSlot)
    const scheduleEnd = scheduleStart + s.duration - 1
    const currentSlot = getSlotIndex(slotValue)
    return currentSlot >= scheduleStart && currentSlot <= scheduleEnd
  }) || null
}

// Check if this is the first slot of a schedule (to render the cell)
function isFirstSlot(day: DayOfWeek, slotValue: TimeSlot): boolean {
  const schedule = getScheduleAt(day, slotValue)
  return schedule ? schedule.startSlot === slotValue : false
}

// Get rowspan for a schedule cell
function getRowSpan(schedule: Schedule): number {
  return schedule.duration
}

// Get the type label
function getTypeLabel(type: ScheduleType): string {
  return SCHEDULE_TYPES.find((t) => t.value === type)?.label || type
}

// Get group info
function getGroupInfo(schedule: Schedule): string {
  if (!schedule.group) return ''
  const group = schedule.group
  return `${group.program?.name || ''} Y${group.academicYear} - ${group.name}`
}

const morningSlots = TIME_SLOTS.filter((s) => s.period === 'morning')
const afternoonSlots = TIME_SLOTS.filter((s) => s.period === 'afternoon')

onMounted(async () => {
  await loadSchedule()
})

// Reload when semester changes
watch(selectedSemester, () => {
  loadSchedule()
})

async function loadSchedule() {
  loading.value = true
  error.value = ''
  try {
    // Get the teacher's own schedule based on their teacherId from JWT
    schedules.value = await schedulesService.getMyTeachingSchedule(selectedSemester.value)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">My Teaching Schedule</h1>
      <div class="page-filters">
        <div class="filter-group">
          <label>Semester:</label>
          <select v-model="selectedSemester">
            <option v-for="sem in SEMESTERS" :key="sem.value" :value="sem.value">
              {{ sem.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Schedule Table -->
    <div v-if="schedules.length" class="schedule-wrapper">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="time-header">Time</th>
            <th v-for="day in DAYS_OF_WEEK" :key="day.value" class="day-header">
              {{ day.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Morning slots -->
          <template v-for="slot in morningSlots" :key="slot.value">
            <tr>
              <td class="time-cell">{{ slot.label }}</td>
              <template v-for="day in DAYS_OF_WEEK" :key="day.value">
                <template v-if="isFirstSlot(day.value, slot.value)">
                  <td
                    class="schedule-cell"
                    :rowspan="getRowSpan(getScheduleAt(day.value, slot.value)!)"
                    :style="{ backgroundColor: getScheduleAt(day.value, slot.value)?.color || '#e0e0e0' }"
                  >
                    <div class="schedule-content">
                      <div class="course-name">{{ getScheduleAt(day.value, slot.value)?.course?.name }}</div>
                      <div class="course-code">{{ getScheduleAt(day.value, slot.value)?.course?.code }}</div>
                      <div class="group-info">{{ getGroupInfo(getScheduleAt(day.value, slot.value)!) }}</div>
                      <div class="room-type">
                        <span class="room">{{ getScheduleAt(day.value, slot.value)?.roomNumber }}</span>
                        <span class="type-badge">{{ getTypeLabel(getScheduleAt(day.value, slot.value)!.type) }}</span>
                      </div>
                    </div>
                  </td>
                </template>
                <template v-else-if="!getScheduleAt(day.value, slot.value)">
                  <td class="empty-cell"></td>
                </template>
              </template>
            </tr>
          </template>

          <!-- Break row -->
          <tr class="break-row">
            <td colspan="8" class="break-cell">Lunch Break (11:00 - 13:00)</td>
          </tr>

          <!-- Afternoon slots -->
          <template v-for="slot in afternoonSlots" :key="slot.value">
            <tr>
              <td class="time-cell">{{ slot.label }}</td>
              <template v-for="day in DAYS_OF_WEEK" :key="day.value">
                <template v-if="isFirstSlot(day.value, slot.value)">
                  <td
                    class="schedule-cell"
                    :rowspan="getRowSpan(getScheduleAt(day.value, slot.value)!)"
                    :style="{ backgroundColor: getScheduleAt(day.value, slot.value)?.color || '#e0e0e0' }"
                  >
                    <div class="schedule-content">
                      <div class="course-name">{{ getScheduleAt(day.value, slot.value)?.course?.name }}</div>
                      <div class="course-code">{{ getScheduleAt(day.value, slot.value)?.course?.code }}</div>
                      <div class="group-info">{{ getGroupInfo(getScheduleAt(day.value, slot.value)!) }}</div>
                      <div class="room-type">
                        <span class="room">{{ getScheduleAt(day.value, slot.value)?.roomNumber }}</span>
                        <span class="type-badge">{{ getTypeLabel(getScheduleAt(day.value, slot.value)!.type) }}</span>
                      </div>
                    </div>
                  </td>
                </template>
                <template v-else-if="!getScheduleAt(day.value, slot.value)">
                  <td class="empty-cell"></td>
                </template>
              </template>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-else-if="!loading" class="page-empty">
      No teaching schedule found.
    </div>
  </div>
</template>

<style scoped>
/* Schedule-specific styles */
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.filter-group select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.schedule-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: center;
  vertical-align: top;
}

.time-header {
  width: 100px;
  background: #f5f5f5;
  font-weight: 600;
}

.day-header {
  background: #7c3aed;
  color: white;
  font-weight: 600;
  padding: 12px 8px;
}

.time-cell {
  background: #f9fafb;
  font-weight: 500;
  font-size: 13px;
  color: #374151;
}

.schedule-cell {
  padding: 8px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.schedule-content {
  text-align: left;
}

.course-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-code {
  font-size: 11px;
  opacity: 0.9;
}

.group-info {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.9;
}

.room-type {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 10px;
}

.room {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
}

.type-badge {
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  font-size: 9px;
}

.empty-cell {
  background: #fafafa;
}

.break-row {
  background: #fef3c7;
}

.break-cell {
  padding: 10px;
  font-style: italic;
  color: #92400e;
  text-align: center;
}

</style>
