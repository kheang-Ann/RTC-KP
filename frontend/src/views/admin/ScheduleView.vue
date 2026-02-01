<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  schedulesService,
  type Schedule,
  type CreateScheduleDto,
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
import { groupsService, type Group } from '@/services/groups'
import { programsService, type Program } from '@/services/programs'
import { coursesService, type Course } from '@/services/courses'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const schedules = ref<Schedule[]>([])
const groups = ref<Group[]>([])
const programs = ref<Program[]>([])
const courses = ref<Course[]>([])
const loading = ref(false)
const error = ref('')
const modalError = ref('')
const showModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)
const draggedSchedule = ref<Schedule | null>(null)
const dragOverSlot = ref<{ day: DayOfWeek; slot: TimeSlot } | null>(null)

// Filters for schedule view
const selectedProgramId = ref<number | null>(null)
const selectedYear = ref<number | null>(null)
const selectedGroupId = ref<number | null>(null)
const selectedSemester = ref<Semester>(1)

// Form for creating/editing schedule
const form = ref<CreateScheduleDto>({
  courseId: '',
  groupId: 0,
  dayOfWeek: 'monday' as DayOfWeek,
  startSlot: '07:00-08:00' as TimeSlot,
  duration: 1,
  type: 'lecture' as ScheduleType,
  roomNumber: '',
  color: undefined,
  semester: 1,
  semesterWeeks: 16,
})

// Computed: filtered groups based on program and year
const filteredGroups = computed(() => {
  let result = groups.value
  if (selectedProgramId.value) {
    result = result.filter((g) => g.programId === selectedProgramId.value)
  }
  if (selectedYear.value) {
    result = result.filter((g) => g.academicYear === selectedYear.value)
  }
  return result
})

// Computed: available years based on selected program
const availableYears = computed(() => {
  const program = programs.value.find((p) => p.id === selectedProgramId.value)
  if (!program) return [1, 2, 3, 4]
  return Array.from({ length: program.duration }, (_, i) => i + 1)
})

// Computed: schedules for the selected group
const groupSchedules = computed(() => {
  if (!selectedGroupId.value) return []
  return schedules.value.filter((s) => s.groupId === selectedGroupId.value)
})

// Helper to get schedule for a specific day and time slot
function getScheduleAt(day: DayOfWeek, slotValue: TimeSlot): Schedule | null {
  return groupSchedules.value.find((s) => {
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

// Get teacher name
function getTeacherName(schedule: Schedule): string {
  if (!schedule.course?.teacher) return 'TBA'
  const teacher = schedule.course.teacher
  return teacher.nameLatin || teacher.nameKhmer || teacher.email || 'TBA'
}

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [schedulesData, groupsData, programsData, coursesData] = await Promise.all([
      schedulesService.getAll(selectedSemester.value),
      groupsService.getAll(),
      programsService.getAll(),
      coursesService.getAll(),
    ])
    schedules.value = schedulesData
    groups.value = groupsData
    programs.value = programsData
    courses.value = coursesData
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingSchedule.value = null
  modalError.value = ''
  // Pre-select the filtered group if available, otherwise first group or 0
  const defaultGroupId = selectedGroupId.value || (groups.value[0]?.id ?? 0)
  form.value = {
    courseId: '',
    groupId: defaultGroupId,
    dayOfWeek: 'monday',
    startSlot: '07:00-08:00',
    duration: 1,
    type: 'lecture',
    roomNumber: '',
    color: undefined,
    semester: selectedSemester.value,
    semesterWeeks: 16,
  }
  showModal.value = true
}

function openEdit(schedule: Schedule) {
  editingSchedule.value = schedule
  modalError.value = ''
  form.value = {
    courseId: schedule.courseId,
    groupId: schedule.groupId,
    dayOfWeek: schedule.dayOfWeek,
    startSlot: schedule.startSlot,
    duration: schedule.duration,
    type: schedule.type,
    roomNumber: schedule.roomNumber,
    color: schedule.color || undefined,
    semester: schedule.semester,
    semesterWeeks: schedule.semesterWeeks,
  }
  showModal.value = true
}

async function saveSchedule() {
  loading.value = true
  modalError.value = ''
  try {
    if (editingSchedule.value) {
      await schedulesService.update(editingSchedule.value.id, form.value)
    } else {
      await schedulesService.create(form.value)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    modalError.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function deleteSchedule(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  showDeleteConfirm.value = false
  showModal.value = false
  loading.value = true
  try {
    await schedulesService.delete(deleteTargetId.value)
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
    deleteTargetId.value = null
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

// Drag and drop functions
function onDragStart(schedule: Schedule, event: DragEvent) {
  draggedSchedule.value = schedule
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', event.target?.toString() || '')
  }
}

function onDragEnd() {
  draggedSchedule.value = null
  dragOverSlot.value = null
}

function onDragOver(day: DayOfWeek, slot: TimeSlot, event: DragEvent) {
  if (!draggedSchedule.value) return
  
  // Validate the drop target
  const isValid = canDropSchedule(draggedSchedule.value, slot)
  if (!isValid) {
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'none'
    }
    return
  }
  
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverSlot.value = { day, slot }
}

function onDragLeave() {
  dragOverSlot.value = null
}

// Validate if schedule can be dropped at the target slot
function canDropSchedule(schedule: Schedule, targetSlot: TimeSlot): boolean {
  const startIndex = getSlotIndex(targetSlot)
  const endIndex = startIndex + schedule.duration - 1
  
  // Check if the slot would cross lunch break
  const morningSlots = TIME_SLOTS.filter((s) => s.period === 'morning')
  const afternoonSlots = TIME_SLOTS.filter((s) => s.period === 'afternoon')
  
  const isMorningSlot = morningSlots.some((s) => s.value === targetSlot)
  const isAfternoonSlot = afternoonSlots.some((s) => s.value === targetSlot)
  
  // Check if duration would overflow the period
  if (isMorningSlot) {
    const lastMorningSlot = morningSlots[morningSlots.length - 1]
    if (!lastMorningSlot) return false
    const morningEndIndex = getSlotIndex(lastMorningSlot.value)
    if (endIndex > morningEndIndex) {
      return false // Would cross into lunch break
    }
  } else if (isAfternoonSlot) {
    const lastAfternoonSlot = afternoonSlots[afternoonSlots.length - 1]
    if (!lastAfternoonSlot) return false
    const afternoonEndIndex = getSlotIndex(lastAfternoonSlot.value)
    if (endIndex > afternoonEndIndex) {
      return false // Would overflow afternoon period
    }
  }
  
  return true
}

async function onDrop(day: DayOfWeek, slot: TimeSlot, event: DragEvent) {
  event.preventDefault()
  dragOverSlot.value = null
  
  if (!draggedSchedule.value) return
  
  const schedule = draggedSchedule.value
  draggedSchedule.value = null
  
  // Check if dropped on same position
  if (schedule.dayOfWeek === day && schedule.startSlot === slot) {
    return
  }
  
  // Validate the drop
  if (!canDropSchedule(schedule, slot)) {
    error.value = 'Cannot move schedule: Would cross lunch break or overflow time period'
    setTimeout(() => { error.value = '' }, 3000)
    return
  }
  
  // Check for conflicts with existing schedules in the same group
  const existingSchedule = getScheduleAt(day, slot)
  if (existingSchedule && existingSchedule.id !== schedule.id) {
    error.value = 'Cannot move schedule: Time slot already occupied'
    setTimeout(() => { error.value = '' }, 3000)
    return
  }
  
  // Check if any slots in the duration are occupied
  const startIndex = getSlotIndex(slot)
  let hasConflict = false
  for (let i = 0; i < schedule.duration; i++) {
    const checkSlot = TIME_SLOTS[startIndex + i]?.value
    if (checkSlot) {
      const existing = getScheduleAt(day, checkSlot)
      if (existing && existing.id !== schedule.id) {
        hasConflict = true
        break
      }
    }
  }
  
  if (hasConflict) {
    error.value = 'Cannot move schedule: Conflicts with existing schedule'
    setTimeout(() => { error.value = '' }, 3000)
    return
  }
  
  // Update schedule with new day and time
  loading.value = true
  error.value = ''
  try {
    await schedulesService.update(schedule.id, {
      dayOfWeek: day,
      startSlot: slot,
    })
    await loadData()
  } catch (e) {
    error.value = (e as Error).message
    setTimeout(() => { error.value = '' }, 5000)
  } finally {
    loading.value = false
  }
}

function isDragOver(day: DayOfWeek, slot: TimeSlot): boolean {
  return dragOverSlot.value?.day === day && dragOverSlot.value?.slot === slot
}

// Reset selections when program changes
watch(selectedProgramId, () => {
  selectedYear.value = null
  selectedGroupId.value = null
})

watch(selectedYear, () => {
  selectedGroupId.value = null
})

// Reload schedules when semester changes
watch(selectedSemester, () => {
  loadData()
})

// Available slots calculation for form
const morningSlots = TIME_SLOTS.filter((s) => s.period === 'morning')
const afternoonSlots = TIME_SLOTS.filter((s) => s.period === 'afternoon')

const maxDuration = computed(() => {
  const slot = TIME_SLOTS.find((s) => s.value === form.value.startSlot)
  if (!slot) return 4
  const slotsInPeriod = slot.period === 'morning' ? morningSlots : afternoonSlots
  const currentIndex = slotsInPeriod.findIndex((s) => s.value === form.value.startSlot)
  return slotsInPeriod.length - currentIndex
})
</script>

<template>
  <div class="page-container">
    <div class="page-header-row">
      <h1 class="page-title">Schedule Management</h1>
      <button class="btn btn-primary" @click="openCreate">
        + Add Schedule
      </button>
    </div>

    <!-- Filters -->
    <div class="page-filters">
      <div class="filter-group">
        <label>Semester:</label>
        <select v-model="selectedSemester">
          <option v-for="sem in SEMESTERS" :key="sem.value" :value="sem.value">
            {{ sem.label }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Program:</label>
        <select v-model="selectedProgramId">
          <option :value="null">Select Program</option>
          <option v-for="program in programs" :key="program.id" :value="program.id">
            {{ program.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Year:</label>
        <select v-model="selectedYear" :disabled="!selectedProgramId">
          <option :value="null">Select Year</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            Year {{ year }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Group:</label>
        <select v-model="selectedGroupId" :disabled="!selectedYear">
          <option :value="null">Select Group</option>
          <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="error" class="page-alert page-alert-error">{{ error }}</div>
    <div v-if="loading" class="page-loading">Loading...</div>

    <!-- Schedule Table -->
    <div v-if="selectedGroupId" class="schedule-wrapper">
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
                    :class="{ 'drag-over': isDragOver(day.value, slot.value) }"
                    :rowspan="getRowSpan(getScheduleAt(day.value, slot.value)!)"
                    :style="{ backgroundColor: getScheduleAt(day.value, slot.value)?.color || '#e0e0e0' }"
                    draggable="true"
                    @dragstart="onDragStart(getScheduleAt(day.value, slot.value)!, $event)"
                    @dragend="onDragEnd"
                    @dragover="onDragOver(day.value, slot.value, $event)"
                    @dragleave="onDragLeave"
                    @drop="onDrop(day.value, slot.value, $event)"
                    @click="openEdit(getScheduleAt(day.value, slot.value)!)"
                  >
                    <div class="schedule-content">
                      <div class="course-name">{{ getScheduleAt(day.value, slot.value)?.course?.name }}</div>
                      <div class="course-code">{{ getScheduleAt(day.value, slot.value)?.course?.code }}</div>
                      <div class="teacher-name">{{ getTeacherName(getScheduleAt(day.value, slot.value)!) }}</div>
                      <div class="room-type">
                        <span class="room">{{ getScheduleAt(day.value, slot.value)?.roomNumber }}</span>
                        <span class="type-badge">{{ getTypeLabel(getScheduleAt(day.value, slot.value)!.type) }}</span>
                      </div>
                    </div>
                  </td>
                </template>
                <template v-else-if="!getScheduleAt(day.value, slot.value)">
                  <td 
                    class="empty-cell"
                    :class="{ 'drag-over': isDragOver(day.value, slot.value) }"
                    @dragover="onDragOver(day.value, slot.value, $event)"
                    @dragleave="onDragLeave"
                    @drop="onDrop(day.value, slot.value, $event)"
                  ></td>
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
                    :class="{ 'drag-over': isDragOver(day.value, slot.value) }"
                    :rowspan="getRowSpan(getScheduleAt(day.value, slot.value)!)"
                    :style="{ backgroundColor: getScheduleAt(day.value, slot.value)?.color || '#e0e0e0' }"
                    draggable="true"
                    @dragstart="onDragStart(getScheduleAt(day.value, slot.value)!, $event)"
                    @dragend="onDragEnd"
                    @dragover="onDragOver(day.value, slot.value, $event)"
                    @dragleave="onDragLeave"
                    @drop="onDrop(day.value, slot.value, $event)"
                    @click="openEdit(getScheduleAt(day.value, slot.value)!)"
                  >
                    <div class="schedule-content">
                      <div class="course-name">{{ getScheduleAt(day.value, slot.value)?.course?.name }}</div>
                      <div class="course-code">{{ getScheduleAt(day.value, slot.value)?.course?.code }}</div>
                      <div class="teacher-name">{{ getTeacherName(getScheduleAt(day.value, slot.value)!) }}</div>
                      <div class="room-type">
                        <span class="room">{{ getScheduleAt(day.value, slot.value)?.roomNumber }}</span>
                        <span class="type-badge">{{ getTypeLabel(getScheduleAt(day.value, slot.value)!.type) }}</span>
                      </div>
                    </div>
                  </td>
                </template>
                <template v-else-if="!getScheduleAt(day.value, slot.value)">
                  <td 
                    class="empty-cell"
                    :class="{ 'drag-over': isDragOver(day.value, slot.value) }"
                    @dragover="onDragOver(day.value, slot.value, $event)"
                    @dragleave="onDragLeave"
                    @drop="onDrop(day.value, slot.value, $event)"
                  ></td>
                </template>
              </template>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-else-if="!loading" class="page-empty">
      Select a program, year, and group to view the schedule.
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingSchedule ? 'Edit Schedule' : 'Create Schedule' }}</h2>
        <div v-if="modalError" class="page-alert page-alert-error">{{ modalError }}</div>
        <form @submit.prevent="saveSchedule">
          <div class="form-group">
            <label>Group</label>
            <select v-model.number="form.groupId" required>
              <option :value="0" disabled>Select group</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.program?.name }} - Year {{ group.academicYear }} - {{ group.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Course</label>
            <select v-model="form.courseId" required>
              <option value="" disabled>Select course</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.code }} - {{ course.name }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Day of Week</label>
              <select v-model="form.dayOfWeek" required>
                <option v-for="day in DAYS_OF_WEEK" :key="day.value" :value="day.value">
                  {{ day.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Start Time</label>
              <select v-model="form.startSlot" required>
                <optgroup label="Morning">
                  <option v-for="slot in morningSlots" :key="slot.value" :value="slot.value">
                    {{ slot.label }}
                  </option>
                </optgroup>
                <optgroup label="Afternoon">
                  <option v-for="slot in afternoonSlots" :key="slot.value" :value="slot.value">
                    {{ slot.label }}
                  </option>
                </optgroup>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Duration (hours)</label>
              <select v-model.number="form.duration" required>
                <option v-for="d in maxDuration" :key="d" :value="d">{{ d }} hour{{ d > 1 ? 's' : '' }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Type</label>
              <select v-model="form.type" required>
                <option v-for="type in SCHEDULE_TYPES" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Room Number</label>
              <input v-model="form.roomNumber" type="text" required placeholder="e.g., A101" />
            </div>
            <div class="form-group">
              <label>Color (optional)</label>
              <input v-model="form.color" type="color" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Semester</label>
              <select v-model.number="form.semester" required>
                <option v-for="sem in SEMESTERS" :key="sem.value" :value="sem.value">
                  {{ sem.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Semester Duration (weeks)</label>
              <input
                v-model.number="form.semesterWeeks"
                type="number"
                min="1"
                max="52"
                placeholder="16"
              />
            </div>
          </div>
          <div class="modal-actions">
            <button
              v-if="editingSchedule"
              type="button"
              class="btn btn-danger"
              @click="deleteSchedule(editingSchedule.id)"
            >
              Delete
            </button>
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ editingSchedule ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="showDeleteConfirm"
    title="Delete Schedule"
    message="Are you sure you want to delete this schedule entry?"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<style scoped>
/* Filter group styles */
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

/* Schedule table specific styles */
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
  background: var(--color-primary);
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
  cursor: move;
  user-select: none;
  transition: opacity 0.2s, transform 0.1s;
  padding: 8px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.schedule-cell:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.schedule-cell:active {
  cursor: grabbing;
  opacity: 0.7;
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

.teacher-name {
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
  min-height: 40px;
  transition: background-color 0.2s;
}

.empty-cell:hover {
  background: #f0f0f0;
}

.drag-over {
  background: #e3f2fd !important;
  border: 2px dashed #2196F3 !important;
  box-shadow: inset 0 0 8px rgba(33, 150, 243, 0.3);
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

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-sizing: border-box;
}

.modal * {
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

/* Form styles */
.form-group {
  margin-bottom: 16px;
  flex: 1;
  min-width: 0;
}

.form-row {
  display: flex;
  gap: 16px;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group input[type='color'] {
  height: 38px;
  padding: 4px;
}
</style>
