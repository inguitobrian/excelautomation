<script setup>
import { ref, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase'

const selectedSheet = ref('')
const sheetOptions = ref([])

const tableData = ref([])
const loading = ref(true)
const isUpdating = ref(false)
const searchQuery = ref('')
const selectedFilter = ref('All')

// Row editing
const editDialog = ref(false)
const editingRow = ref(null)
const editFormData = ref({})
const isSaving = ref(false)

// Sheet editing
const sheetEditDialog = ref(false)
const editedSheetName = ref('')
const isSavingSheet = ref(false)

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

const remarkOptions = ['Pending', 'On-going', 'Delivered']
const filterOptions = ['All', ...remarkOptions]

// Define which columns are visible in the table
const visibleColumns = [
  'Transaction ID',
  'Equipment Activity',
  'RS Number',
  'Requested By',
  'From',
  'To',
  'Remarks',
  'Actual Delivered Date',
]

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

    // Transform data to match the expected format
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

// Open edit dialog for a row
const openEditDialog = (row) => {
  editingRow.value = row
  // Copy row data to form
  editFormData.value = {
    date_requested: row['Date Requested'] || '',
    equipment_activity: row['Equipment Activity'] || '',
    rs_number: row['RS Number'] || '',
    po_number: row['PO Number'] || '',
    atw: row['ATW'] || '',
    schedule_date_from: row['Schedule From'] || '',
    schedule_date_to: row['Schedule To'] || '',
    requested_by: row['Requested By'] || '',
    from_location: row['From'] || '',
    to_location: row['To'] || '',
    assigned_sl_pm: row['Assigned SL/PM'] || '',
    remarks: row['Remarks'] || 'Pending',
    delivery_start: row['Delivery Start'] || '',
    projected_delivery_date: row['Projected Delivery Date'] || '',
    actual_delivered_date: row['Actual Delivered Date'] || '',
  }
  editDialog.value = true
}

// Save edited row
const saveRow = async () => {
  if (!editingRow.value) return

  isSaving.value = true
  try {
    const updateData = {
      date_requested: editFormData.value.date_requested || null,
      equipment_activity: editFormData.value.equipment_activity || null,
      rs_number: editFormData.value.rs_number || null,
      po_number: editFormData.value.po_number || null,
      atw: editFormData.value.atw || null,
      schedule_date_from: editFormData.value.schedule_date_from || null,
      schedule_date_to: editFormData.value.schedule_date_to || null,
      requested_by: editFormData.value.requested_by || null,
      from_location: editFormData.value.from_location || null,
      to_location: editFormData.value.to_location || null,
      assigned_sl_pm: editFormData.value.assigned_sl_pm || null,
      remarks: editFormData.value.remarks || 'Pending',
      delivery_start: editFormData.value.delivery_start || null,
      projected_delivery_date: editFormData.value.projected_delivery_date || null,
      actual_delivered_date: editFormData.value.actual_delivered_date || null,
    }

    // Auto-set actual_delivered_date when status changes to Delivered
    if (editFormData.value.remarks === 'Delivered' && !editFormData.value.actual_delivered_date) {
      updateData.actual_delivered_date = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', editingRow.value.id)

    if (error) throw error

    editDialog.value = false

    Swal.fire({
      icon: 'success',
      title: 'Updated!',
      text: 'Transaction updated successfully.',
      timer: 1500,
      showConfirmButton: false,
    })

    // Refresh data
    await fetchSheetData()
  } catch (err) {
    console.error('Update error:', err)
    Swal.fire('Error', 'Failed to update. Please try again.', 'error')
  } finally {
    isSaving.value = false
  }
}

// Delete row
const deleteRow = async (row) => {
  const result = await Swal.fire({
    title: 'Delete Transaction?',
    text: `Are you sure you want to delete this transaction? This cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d32f2f',
    cancelButtonColor: '#757575',
    confirmButtonText: 'Yes, delete it!',
  })

  if (!result.isConfirmed) return

  try {
    const { error } = await supabase.from('transactions').delete().eq('id', row.id)

    if (error) throw error

    Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: 'Transaction has been deleted.',
      timer: 1500,
      showConfirmButton: false,
    })

    // Refresh data
    await fetchSheetData()
  } catch (err) {
    console.error('Delete error:', err)
    Swal.fire('Error', 'Failed to delete. Please try again.', 'error')
  }
}

// Quick update remarks
const quickUpdateRemarks = async (row, newRemarks) => {
  try {
    const updateData = { remarks: newRemarks }

    if (newRemarks === 'Delivered') {
      updateData.actual_delivered_date = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase.from('transactions').update(updateData).eq('id', row.id)

    if (error) throw error

    row['Remarks'] = newRemarks
    row.statusMenu = false
    if (newRemarks === 'Delivered') {
      row['Actual Delivered Date'] = updateData.actual_delivered_date
    }
  } catch (err) {
    console.error('Update error:', err)
    Swal.fire('Error', 'Failed to update remarks.', 'error')
  }
}

// Status helpers
const getStatusColor = (status) => {
  const colors = {
    Pending: 'error',
    'On-going': 'warning',
    Delivered: 'success',
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const icons = {
    Pending: 'mdi-clock-outline',
    'On-going': 'mdi-truck-delivery',
    Delivered: 'mdi-check-circle',
  }
  return icons[status] || 'mdi-help-circle'
}

const openStatusMenu = (row, event) => {
  row.menuTarget = event.target
  row.statusMenu = true
}

const closeEditDialog = () => {
  editDialog.value = false
  editingRow.value = null
  editFormData.value = {}
}

// Open sheet edit dialog
const openSheetEditDialog = () => {
  if (!selectedSheet.value) return
  const currentSheet = sheetOptions.value.find((s) => s.value === selectedSheet.value)
  editedSheetName.value = currentSheet?.title || ''
  sheetEditDialog.value = true
}

// Save sheet name
const saveSheetName = async () => {
  if (!selectedSheet.value || !editedSheetName.value.trim()) {
    Swal.fire('Error', 'Sheet name cannot be empty.', 'error')
    return
  }

  isSavingSheet.value = true
  try {
    const { error } = await supabase
      .from('sheets')
      .update({ name: editedSheetName.value.trim() })
      .eq('id', selectedSheet.value)

    if (error) throw error

    // Update local options
    const sheetIndex = sheetOptions.value.findIndex((s) => s.value === selectedSheet.value)
    if (sheetIndex !== -1) {
      sheetOptions.value[sheetIndex].title = editedSheetName.value.trim()
    }

    sheetEditDialog.value = false

    Swal.fire({
      icon: 'success',
      title: 'Updated!',
      text: 'Sheet name updated successfully.',
      timer: 1500,
      showConfirmButton: false,
    })
  } catch (err) {
    console.error('Update error:', err)
    Swal.fire('Error', 'Failed to update sheet name.', 'error')
  } finally {
    isSavingSheet.value = false
  }
}

// Delete sheet
const deleteSheet = async () => {
  if (!selectedSheet.value) return

  const currentSheet = sheetOptions.value.find((s) => s.value === selectedSheet.value)

  const result = await Swal.fire({
    title: 'Delete Sheet?',
    html: `Are you sure you want to delete "<strong>${currentSheet?.title}</strong>"?<br><br><span class="text-red">This will also delete all transactions in this sheet!</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d32f2f',
    cancelButtonColor: '#757575',
    confirmButtonText: 'Yes, delete it!',
  })

  if (!result.isConfirmed) return

  try {
    // Delete all transactions first
    await supabase.from('transactions').delete().eq('sheet_id', selectedSheet.value)

    // Then delete the sheet
    const { error } = await supabase.from('sheets').delete().eq('id', selectedSheet.value)

    if (error) throw error

    Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: 'Sheet and all its transactions have been deleted.',
      timer: 1500,
      showConfirmButton: false,
    })

    // Refresh sheet list
    await fetchSheetNames()
  } catch (err) {
    console.error('Delete error:', err)
    Swal.fire('Error', 'Failed to delete sheet.', 'error')
  }
}

onMounted(() => {
  fetchSheetNames()
})
</script>

<template>
  <AppLayout>
    <template #content>
      <!-- Page Header -->
      <div class="d-flex align-center mb-4">
        <v-icon size="32" color="primary" class="mr-3">mdi-clipboard-edit-outline</v-icon>
        <div>
          <h1 class="text-h5 font-weight-bold">Edit Transactions</h1>
          <p class="text-body-2 text-grey ma-0">Manage and update transaction records</p>
        </div>
      </div>

      <!-- Sheet Selection Card -->
      <v-card elevation="2" class="mb-4" rounded="lg">
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="5">
              <v-select
                v-model="selectedSheet"
                :items="sheetOptions"
                item-title="title"
                item-value="value"
                label="Select Project Sheet"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-folder-open"
                hide-details
                @update:modelValue="fetchSheetData"
              />
            </v-col>
            <v-col cols="12" md="7">
              <div class="d-flex ga-2 flex-wrap">
                <v-btn
                  color="primary"
                  variant="tonal"
                  :disabled="!selectedSheet"
                  @click="openSheetEditDialog"
                >
                  <v-icon start>mdi-pencil</v-icon>
                  Rename
                </v-btn>
                <v-btn
                  color="error"
                  variant="tonal"
                  :disabled="!selectedSheet"
                  @click="deleteSheet"
                >
                  <v-icon start>mdi-delete</v-icon>
                  Delete Sheet
                </v-btn>
                <v-spacer />
                <v-btn color="secondary" variant="tonal" @click="fetchSheetData" :loading="loading">
                  <v-icon start>mdi-refresh</v-icon>
                  Refresh
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Main Data Card -->
      <v-card elevation="2" rounded="lg">
        <!-- Toolbar -->
        <v-toolbar color="transparent" density="comfortable" class="px-4">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search transactions..."
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            variant="solo-filled"
            flat
            density="compact"
            class="search-field"
            style="max-width: 300px"
          />
          <v-spacer />
          <v-btn-toggle
            v-model="selectedFilter"
            mandatory
            color="primary"
            density="compact"
            rounded
          >
            <v-btn
              v-for="filter in filterOptions"
              :key="filter"
              :value="filter"
              size="small"
              variant="text"
            >
              <v-icon v-if="filter === 'All'" start size="small">mdi-format-list-bulleted</v-icon>
              <v-icon v-else-if="filter === 'Pending'" start size="small" color="error"
                >mdi-clock-outline</v-icon
              >
              <v-icon v-else-if="filter === 'On-going'" start size="small" color="warning"
                >mdi-truck-delivery</v-icon
              >
              <v-icon v-else-if="filter === 'Delivered'" start size="small" color="success"
                >mdi-check-circle</v-icon
              >
              {{ filter }}
            </v-btn>
          </v-btn-toggle>
        </v-toolbar>

        <v-divider />

        <!-- Loading indicator -->
        <v-progress-linear v-if="loading" indeterminate color="primary" />

        <!-- Data table -->
        <v-table v-if="!loading && filteredData.length > 0" hover density="comfortable">
          <thead>
            <tr class="bg-grey-lighten-4">
              <th class="font-weight-bold text-center" style="width: 100px">Actions</th>
              <th v-for="col in visibleColumns" :key="col" class="font-weight-bold">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in filteredData"
              :key="index"
              :class="getRowClass(row['Remarks'])"
            >
              <td class="text-center">
                <v-btn-group density="compact" variant="text">
                  <v-tooltip text="Edit Transaction" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        color="primary"
                        @click="openEditDialog(row)"
                      >
                        <v-icon size="18">mdi-pencil</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip text="Delete Transaction" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon size="small" color="error" @click="deleteRow(row)">
                        <v-icon size="18">mdi-delete</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </v-btn-group>
              </td>
              <td v-for="col in visibleColumns" :key="col">
                <template v-if="col === 'Remarks'">
                  <v-chip
                    :color="getStatusColor(row['Remarks'])"
                    variant="flat"
                    size="small"
                    class="font-weight-medium cursor-pointer"
                    @click="openStatusMenu(row, $event)"
                  >
                    <v-icon start size="small">{{ getStatusIcon(row['Remarks']) }}</v-icon>
                    {{ row['Remarks'] }}
                    <v-icon end size="small">mdi-chevron-down</v-icon>
                  </v-chip>
                  <v-menu v-model="row.statusMenu" :target="row.menuTarget" location="bottom">
                    <v-list density="compact">
                      <v-list-item
                        v-for="status in remarkOptions"
                        :key="status"
                        :value="status"
                        @click="quickUpdateRemarks(row, status)"
                      >
                        <template v-slot:prepend>
                          <v-icon :color="getStatusColor(status)" size="small">
                            {{ getStatusIcon(status) }}
                          </v-icon>
                        </template>
                        <v-list-item-title>{{ status }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
                <template v-else-if="col === 'Transaction ID'">
                  <span class="font-weight-medium text-primary">{{ row[col] }}</span>
                </template>
                <template v-else>
                  <span>{{ formatCell(row[col]) || '—' }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- No data message -->
        <v-card-text v-if="!loading && filteredData.length === 0" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-database-search</v-icon>
          <h3 class="text-h6 text-grey mb-2">No Transactions Found</h3>
          <p class="text-body-2 text-grey">
            {{
              searchQuery
                ? 'Try adjusting your search or filter criteria.'
                : 'No data available in this sheet.'
            }}
          </p>
        </v-card-text>

        <!-- Footer Summary -->
        <v-divider v-if="!loading && tableData.length > 0" />
        <v-card-text
          v-if="!loading && tableData.length > 0"
          class="d-flex align-center justify-space-between py-3"
        >
          <div class="text-body-2 text-grey">
            Showing <strong>{{ filteredData.length }}</strong> of
            <strong>{{ tableData.length }}</strong> transactions
          </div>
          <div class="d-flex ga-4">
            <v-chip size="small" color="error" variant="tonal">
              <v-icon start size="small">mdi-clock-outline</v-icon>
              {{ tableData.filter((r) => r['Remarks'] === 'Pending').length }} Pending
            </v-chip>
            <v-chip size="small" color="warning" variant="tonal">
              <v-icon start size="small">mdi-truck-delivery</v-icon>
              {{ tableData.filter((r) => r['Remarks'] === 'On-going').length }} On-going
            </v-chip>
            <v-chip size="small" color="success" variant="tonal">
              <v-icon start size="small">mdi-check-circle</v-icon>
              {{ tableData.filter((r) => r['Remarks'] === 'Delivered').length }} Delivered
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Edit Row Dialog -->
      <v-dialog v-model="editDialog" max-width="850" persistent>
        <v-card rounded="lg">
          <v-toolbar color="primary" density="comfortable">
            <v-icon class="ml-4">mdi-pencil</v-icon>
            <v-toolbar-title class="ml-2">Edit Transaction</v-toolbar-title>
            <v-spacer />
            <v-chip v-if="editingRow" color="white" variant="outlined" size="small" class="mr-4">
              {{ editingRow['Transaction ID'] }}
            </v-chip>
          </v-toolbar>
          <v-card-text class="pa-6">
            <v-row dense>
              <!-- Section: Basic Info -->
              <v-col cols="12">
                <div class="text-overline text-grey mb-2">Basic Information</div>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.date_requested"
                  label="Date Requested"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.equipment_activity"
                  label="Equipment Activity"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-cog"
                />
              </v-col>

              <!-- Section: Reference Numbers -->
              <v-col cols="12" class="mt-2">
                <div class="text-overline text-grey mb-2">Reference Numbers</div>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editFormData.rs_number"
                  label="RS Number"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-pound"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editFormData.po_number"
                  label="PO Number"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-file-document"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editFormData.atw"
                  label="ATW"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-clipboard-text"
                />
              </v-col>

              <!-- Section: Schedule -->
              <v-col cols="12" class="mt-2">
                <div class="text-overline text-grey mb-2">Schedule</div>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.schedule_date_from"
                  label="Schedule From"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-start"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.schedule_date_to"
                  label="Schedule To"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-end"
                />
              </v-col>

              <!-- Section: People & Locations -->
              <v-col cols="12" class="mt-2">
                <div class="text-overline text-grey mb-2">People & Locations</div>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.requested_by"
                  label="Requested By"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.assigned_sl_pm"
                  label="Assigned SL/PM"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-tie"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.from_location"
                  label="From Location"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-map-marker-outline"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editFormData.to_location"
                  label="To Location"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>

              <!-- Section: Delivery Status -->
              <v-col cols="12" class="mt-2">
                <div class="text-overline text-grey mb-2">Delivery Status</div>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="editFormData.remarks"
                  :items="remarkOptions"
                  label="Status"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-flag"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="editFormData.delivery_start"
                  label="Delivery Start"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-truck-fast"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="editFormData.projected_delivery_date"
                  label="Projected Delivery"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-clock"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="editFormData.actual_delivered_date"
                  label="Actual Delivered"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-check"
                  :hint="editFormData.remarks === 'Delivered' ? 'Auto-filled when Delivered' : ''"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="closeEditDialog" :disabled="isSaving"> Cancel </v-btn>
            <v-btn color="primary" variant="flat" :loading="isSaving" @click="saveRow">
              <v-icon start>mdi-content-save</v-icon>
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Edit Sheet Name Dialog -->
      <v-dialog v-model="sheetEditDialog" max-width="400">
        <v-card rounded="lg">
          <v-toolbar color="primary" density="comfortable">
            <v-icon class="ml-4">mdi-folder-edit</v-icon>
            <v-toolbar-title class="ml-2">Rename Sheet</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="pa-6">
            <v-text-field
              v-model="editedSheetName"
              label="Sheet Name"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-folder"
              autofocus
              @keyup.enter="saveSheetName"
            />
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="sheetEditDialog = false" :disabled="isSavingSheet">
              Cancel
            </v-btn>
            <v-btn color="primary" variant="flat" :loading="isSavingSheet" @click="saveSheetName">
              <v-icon start>mdi-content-save</v-icon>
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </AppLayout>
</template>

<script>
export default {
  methods: {
    getRowClass(status) {
      return {
        'row-pending': status === 'Pending',
        'row-ongoing': status === 'On-going',
        'row-delivered': status === 'Delivered',
      }
    },
  },
}
</script>

<style scoped>
.row-pending {
  background-color: #fef2f2;
  border-left: 3px solid #ef4444;
}
.row-ongoing {
  background-color: #fffbeb;
  border-left: 3px solid #f59e0b;
}
.row-delivered {
  background-color: #f0fdf4;
  border-left: 3px solid #22c55e;
}
.search-field :deep(.v-field) {
  background-color: #f5f5f5;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
