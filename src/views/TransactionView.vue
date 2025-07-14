<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const overallData = ref([])
const loadingOverall = ref(false)

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
  return value
}

const fetchOverallTransaction = async () => {
  loadingOverall.value = true
  try {
    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec?sheetName=OverallTransaction',
    )
    const data = await res.json()
    overallData.value = data.rows || []
  } catch (err) {
    console.error('Failed to fetch Overall Transaction data:', err)
  } finally {
    loadingOverall.value = false
  }
}

onMounted(fetchOverallTransaction)
</script>

<template>
  <AppLayout>
    <template #content>
      <v-card elevation="4">
        <v-card-title class="text-h6 font-weight-medium">📋 Overall Transaction</v-card-title>
        <v-card-text>
          <v-progress-linear
            v-if="loadingOverall"
            indeterminate
            color="primary"
            class="mb-4"
          ></v-progress-linear>

          <v-table v-else>
            <thead>
              <tr>
                <th v-for="(key, index) in Object.keys(overallData[0] || {})" :key="index">
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in overallData" :key="rowIndex">
                <td v-for="(value, key) in row" :key="key">
                  {{ formatCell(value) }}
                </td>
              </tr>
            </tbody>
          </v-table>

          <p v-if="!overallData.length && !loadingOverall" class="text-grey">No data available.</p>
        </v-card-text>
      </v-card>
    </template>
  </AppLayout>
</template>
