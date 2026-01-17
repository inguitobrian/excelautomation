<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'
import AppLayout from '@/components/layout/AppLayout.vue'
import dayjs from 'dayjs'
import { supabase } from '@/utils/supabase'

const selectedSheet = ref('')
const sheetOptions = ref([])

const tableData = ref([])
const loading = ref(true)
const isUpdating = ref(false)
const searchQuery = ref('')
const selectedFilter = ref('All')

// Calendar related
const today = ref(dayjs().format('YYYY-MM-DD'))
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDateDetails = ref(null)
const showDetailsDialog = ref(false)

function formatCell(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value)
    if (!isNaN(date)) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  return value
}

// Enhanced formatDateForCalendar to handle more date formats
function formatDateForCalendar(value) {
  if (!value) return null

  // Handle ISO strings (e.g., 2025-07-18T00:00:00)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.split('T')[0]
  }
  // Handle YYYY-MM-DD format
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  // Handle Excel date format (M/D/YYYY H:MM:SS or MM/DD/YYYY H:MM:SS)
  if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)) {
    const parsedDate = dayjs(value)
    if (parsedDate.isValid()) {
      return parsedDate.format('YYYY-MM-DD')
    }
  }
  // Handle other date formats via dayjs
  const parsedDate = dayjs(value)
  if (parsedDate.isValid()) {
    return parsedDate.format('YYYY-MM-DD')
  }
  console.warn(`Invalid date format: ${value}`)
  return null
}

// Computed property for filtered data
const filteredData = computed(() => {
  let filtered = tableData.value

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase()),
      ),
    )
  }

  // Filter by remarks status
  if (selectedFilter.value !== 'All') {
    filtered = filtered.filter((row) => row['Remarks'] === selectedFilter.value)
  }

  return filtered
})

// Calendar computed properties
const calendarDates = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const dates = []
  const current = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    const dateString = current.toISOString().split('T')[0]
    const dateEntries = getDateEntries(dateString)

    dates.push({
      date: new Date(current),
      isCurrentMonth: current.getMonth() === month,
      day: current.getDate(),
      dateString: dateString,
      entries: dateEntries,
      hasEntries: dateEntries.length > 0,
    })
    current.setDate(current.getDate() + 1)
  }

  return dates
})

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function getDateEntries(dateString) {
  const entries = []

  filteredData.value.forEach((row, index) => {
    const status = row['Remarks']
    const projectedDate = formatDateForCalendar(row['Projected Delivery Date'])
    const actualDate = formatDateForCalendar(row['Actual Delivered Date'])

    // Log for debugging
    console.log(`Row ${index}:`, { status, projectedDate, actualDate, dateString })

    // If status is "Delivered", show on actual delivered date
    if (status === 'Delivered' && actualDate && actualDate === dateString) {
      entries.push({
        ...row,
        isProjected: false,
        isActual: true,
        type: 'actual',
      })
    }
    // If status is NOT "Delivered" (Pending/On-going), show on projected date
    else if (status !== 'Delivered' && projectedDate && projectedDate === dateString) {
      entries.push({
        ...row,
        isProjected: true,
        isActual: false,
        type: 'projected',
      })
    }
  })

  return entries
}

function getDateClass(dateInfo) {
  if (!dateInfo.hasEntries) return ''

  const hasProjected = dateInfo.entries.some((entry) => entry.isProjected)
  const hasActual = dateInfo.entries.some((entry) => entry.isActual)

  if (hasProjected && hasActual) return 'mixed-date'
  if (hasProjected) return 'projected-date'
  if (hasActual) return 'actual-date'

  return ''
}

function onDateClick(dateInfo) {
  if (dateInfo.hasEntries) {
    selectedDateDetails.value = {
      ...dateInfo,
      dateString: dayjs(dateInfo.date).format('YYYY-MM-DD'),
    }
    showDetailsDialog.value = true
  }
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToToday() {
  const today = new Date()
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
}

const remarkOptions = ['Pending', 'On-going', 'Delivered']
const filterOptions = ['All', ...remarkOptions]

const fetchSheetData = async () => {
  if (!selectedSheet.value) return

  loading.value = true
  try {
    // Fetch transactions for selected sheet from Supabase
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('sheet_id', selectedSheet.value)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data to match the expected format for calendar
    tableData.value = (data || []).map((row) => ({
      id: row.id,
      'Transaction ID': row.transaction_id,
      'Date Requested': row.date_requested,
      'Equipment Activity': row.equipment_activity,
      'RS Number': row.rs_number,
      'PO Number': row.po_number,
      ATW: row.atw,
      'Schedule From': row.schedule_date_from,
      'Schedule To': row.schedule_date_to,
      'Requested By': row.requested_by,
      From: row.from_location,
      To: row.to_location,
      'Assigned SL/PM': row.assigned_sl_pm,
      Remarks: row.remarks,
      'Delivery Start': row.delivery_start,
      'Projected Delivery Date': row.projected_delivery_date,
      'Actual Delivered Date': row.actual_delivered_date,
    }))
  } catch (err) {
    console.error('Fetch error:', err)
    Swal.fire('Error', 'Failed to load sheet data. Please try again.', 'error')
  } finally {
    loading.value = false
  }
}

const fetchSheetNames = async () => {
  try {
    // Fetch sheets from Supabase
    const { data, error } = await supabase.from('sheets').select('id, name').order('name')

    if (error) throw error

    sheetOptions.value = (data || []).map((sheet) => ({
      title: sheet.name,
      value: sheet.id,
    }))

    // Auto-select the first one
    if (sheetOptions.value.length) {
      selectedSheet.value = sheetOptions.value[0].value
      await fetchSheetData()
    }
  } catch (err) {
    console.error('Failed to fetch sheets:', err)
    Swal.fire('Error', 'Failed to load sheet list.', 'error')
  }
}

onMounted(() => {
  fetchSheetNames()
})
</script>

<template>
  <AppLayout>
    <template #content>
      <v-card elevation="4" class="pa-4">
        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedSheet"
              :items="sheetOptions"
              item-title="title"
              item-value="value"
              label="Select Sheet"
              variant="outlined"
              density="compact"
              @update:modelValue="fetchSheetData"
            />
          </v-col>
        </v-row>

        <!-- Search and Filter Controls -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Search..."
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedFilter"
              :items="filterOptions"
              label="Filter by Status"
              hide-details
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="secondary" @click="fetchSheetData" :loading="loading" block>
              <v-icon left>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>

        <!-- Loading indicator -->
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

        <!-- Calendar View -->
        <v-card v-if="!loading" class="mb-4" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Delivery Calendar</span>
            <div class="d-flex gap-2">
              <v-chip color="red" size="small" class="mx-1">
                <v-icon start>mdi-circle</v-icon>
                Scheduled (Pending/On-going)
              </v-chip>
              <v-chip color="green" size="small" class="mx-1">
                <v-icon start>mdi-circle</v-icon>
                Delivered
              </v-chip>
              <v-chip color="orange" size="small" class="mx-1">
                <v-icon start>mdi-circle</v-icon>
                Mixed
              </v-chip>
            </div>
          </v-card-title>

          <v-card-text>
            <!-- Calendar Header -->
            <div class="d-flex justify-space-between align-center mb-4">
              <v-btn icon @click="previousMonth" size="small">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>

              <h3 class="text-center">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>

              <v-btn icon @click="nextMonth" size="small">
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>

            <div class="d-flex justify-center mb-2">
              <v-btn @click="goToToday" size="small" color="primary" variant="outlined">
                Today
              </v-btn>
            </div>

            <!-- Calendar Grid -->
            <div class="calendar-grid">
              <!-- Day headers -->
              <div class="calendar-header">
                <div class="day-header">Sun</div>
                <div class="day-header">Mon</div>
                <div class="day-header">Tue</div>
                <div class="day-header">Wed</div>
                <div class="day-header">Thu</div>
                <div class="day-header">Fri</div>
                <div class="day-header">Sat</div>
              </div>

              <!-- Calendar days -->
              <div class="calendar-body">
                <div
                  v-for="dateInfo in calendarDates"
                  :key="dateInfo.dateString"
                  class="calendar-day"
                  :class="{
                    'other-month': !dateInfo.isCurrentMonth,
                    today: dateInfo.dateString === today,
                    [getDateClass(dateInfo)]: true,
                    'has-entries': dateInfo.hasEntries,
                  }"
                  @click="onDateClick(dateInfo)"
                >
                  <div class="day-number">{{ dateInfo.day }}</div>
                  <div v-if="dateInfo.hasEntries" class="entries-preview">
                    <div
                      v-for="(entry, index) in dateInfo.entries.slice(0, 2)"
                      :key="index"
                      class="entry-preview"
                      :class="entry.type"
                    >
                      <div class="entry-text">{{ entry['Requested By'] || 'N/A' }}</div>
                      <div class="entry-status">{{ entry['Remarks'] }}</div>
                    </div>
                    <div v-if="dateInfo.entries.length > 2" class="more-entries">
                      +{{ dateInfo.entries.length - 2 }} more
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Summary -->
        <v-card-text v-if="!loading && tableData.length > 0" class="pt-4">
          <strong>Summary:</strong>
          {{ filteredData.length }} of {{ tableData.length }} items shown
        </v-card-text>
      </v-card>

      <!-- Details Dialog -->
      <v-dialog v-model="showDetailsDialog" max-width="800px">
        <v-card v-if="selectedDateDetails">
          <v-card-title class="d-flex justify-space-between align-center">
            <v-btn icon @click="showDetailsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div v-for="(entry, index) in selectedDateDetails.entries" :key="index" class="mb-4">
              <v-card variant="outlined" class="pa-3">
                <v-row>
                  <v-col cols="12" md="6">
                    <strong>Equipment Activity:</strong> {{ entry['Equipment Activity'] || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>RS Number:</strong> {{ entry['RS Number'] || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>PO Number:</strong> {{ entry['PO Number'] || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>ATW:</strong> {{ entry['ATW'] || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Location From:</strong> {{ entry['From'] || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Location To:</strong> {{ entry['To'] || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Date Of Schedule - From:</strong>
                    {{ formatCell(entry['Date Of Schedule - From']) || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Date Of Schedule - To:</strong>
                    {{ formatCell(entry['Date Of Schedule - To']) || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Status:</strong>
                    <v-chip :color="getRemarkColor(entry['Remarks'])" size="small">
                      {{ entry['Remarks'] }}
                    </v-chip>
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Display Type:</strong>
                    <v-chip :color="entry.isProjected ? 'red' : 'green'" size="small">
                      {{ entry.isProjected ? 'Scheduled' : 'Delivered' }}
                    </v-chip>
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Projected Date:</strong>
                    {{ formatCell(entry['Projected Delivery Date']) || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6">
                    <strong>Actual Date:</strong>
                    {{ formatCell(entry['Actual Delivered Date']) || 'N/A' }}
                  </v-col>
                  <v-col cols="12" md="6" v-if="entry['Product']">
                    <strong>Product:</strong> {{ entry['Product'] }}
                  </v-col>
                  <v-col cols="12" md="6" v-if="entry['Quantity']">
                    <strong>Quantity:</strong> {{ formatCell(entry['Quantity']) }}
                  </v-col>
                  <v-col cols="12" md="6" v-if="entry['Amount']">
                    <strong>Amount:</strong> {{ formatCell(entry['Amount']) }}
                  </v-col>
                </v-row>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>
    </template>
  </AppLayout>
</template>

<script>
export default {
  methods: {
    getRemarkColor(status) {
      const colors = {
        Pending: 'red',
        'On-going': 'orange',
        Delivered: 'green',
      }
      return colors[status] || 'primary'
    },
  },
}
</script>

<style scoped>
/* Calendar Styles */
.calendar-grid {
  max-width: 100%;
  margin: 0 auto;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
}

.day-header {
  padding: 8px;
  text-align: center;
  font-weight: bold;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.calendar-day {
  min-height: 100px;
  padding: 4px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  position: relative;
}

.calendar-day:hover {
  background-color: #f0f0f0;
}

.calendar-day.other-month {
  color: #ccc;
  background-color: #fafafa;
}

.calendar-day.has-entries {
  cursor: pointer;
}

.calendar-day.has-entries:hover {
  background-color: #f5f5f5;
  transform: scale(1.02);
}

.calendar-day.projected-date {
  background-color: #ffebee !important;
  border: 2px solid #f44336;
}

.calendar-day.actual-date {
  background-color: #e8f5e8 !important;
  border: 2px solid #4caf50;
}

.calendar-day.mixed-date {
  background: linear-gradient(45deg, #ffebee 50%, #e8f5e8 50%) !important;
  border: 2px solid #ff9800;
}

.day-number {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.entries-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry-preview {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 1.2;
}

.entry-preview.projected {
  background-color: rgba(244, 67, 54, 0.1);
  border-left: 3px solid #f44336;
}

.entry-preview.actual {
  background-color: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4caf50;
}

.entry-text {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-status {
  font-size: 9px;
  color: #666;
}

.more-entries {
  font-size: 9px;
  color: #999;
  text-align: center;
  font-style: italic;
}

@media (max-width: 600px) {
  .calendar-day {
    min-height: 80px;
    padding: 2px;
  }

  .day-header {
    padding: 4px;
    font-size: 12px;
  }

  .day-number {
    font-size: 12px;
  }

  .entry-preview {
    font-size: 9px;
  }
}
</style>
