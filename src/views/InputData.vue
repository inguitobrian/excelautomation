<script setup>
import { ref, onMounted } from 'vue'

const form = ref(null)
const submitting = ref(false)
const message = ref({ type: '', text: '' })
const overallData = ref([])
const loadingOverall = ref(false)
const sheetOptions = ref([])
const formData = ref({
  sheetName: '',
  dateRequested: '',
  equipmentActivity: '',
  scheduleDateFrom: '',
  scheduleDateTo: '',
  requestedBy: '',
  from: '',
  to: '',
  assigned: '',
  remarks: '',
  deliveryStart: '',
  deliveredDate: '',
})

//fetching from excel
onMounted(async () => {
  try {
    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec',
    )
    const data = await res.json()
    //hide the overall transaction
    sheetOptions.value = (data.sheets || []).filter((name) => name !== 'OverallTransaction')
  } catch (err) {
    console.error('Failed to fetch sheets:', err)
  }

  fetchOverallTransaction()
})

function formatCell(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value)

    if (!isNaN(date)) {
      // Convert to local timezone
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  return value
}

const handleSubmit = async () => {
  submitting.value = true
  message.value = { type: '', text: '' }

  try {
    const formObj = {
      sheetName: formData.value.sheetName,
      'Date Requested': formData.value.dateRequested,
      'Equipment No. Activity': formData.value.equipmentActivity,
      'Date Of Schedule - From': formData.value.scheduleDateFrom,
      'Date Of Schedule - To': formData.value.scheduleDateTo,
      'Requested By': formData.value.requestedBy,
      From: formData.value.from,
      To: formData.value.to,
      'Assigned SL/PM': formData.value.assigned,
      Remarks: formData.value.remarks,
      'Delivery Start': formData.value.deliveryStart,
      'Delivered Date': formData.value.deliveredDate,
    }

    //submitting the data
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbywwa6AOFAIZYUg9GYHl-YDwcQIhf-GHC5xF-7wqcX7cPVEkx-JwnYvfSAmI4Pyn_Uy/exec',
      {
        method: 'POST',
        body: JSON.stringify(formObj),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      },
    )

    const data = await response.json()
    if (data.status === 'success') {
      message.value = { type: 'success', text: data.message }
      handleReset()
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    message.value = { type: 'error', text: error.message }
  } finally {
    submitting.value = false
    setTimeout(() => (message.value.text = ''), 4000)
  }
}

const handleReset = () => {
  form.value.reset()
  formData.value = {
    sheetName: '',
    dateRequested: '',
    equipmentActivity: '',
    scheduleDateFrom: '',
    scheduleDateTo: '',
    requestedBy: '',
    from: '',
    to: '',
    assigned: '',
    remarks: '',
    deliveryStart: '',
    deliveredDate: '',
  }
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
</script>

<template>
  <v-app>
    <v-container class="pa-6" max-width="700px">
      <v-card elevation="8" class="pa-6">
        <v-card-title class="text-h5 font-weight-bold text-center"> Equipment Form </v-card-title>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-select
            v-model="formData.sheetName"
            :items="sheetOptions"
            label="Select Sheet"
            name="sheetName"
            required
          />

          <v-text-field
            v-model="formData.dateRequested"
            label="Date Requested"
            type="date"
            required
          />
          <v-text-field
            v-model="formData.equipmentActivity"
            label="Equipment No. Activity"
            required
          />

          <v-text-field
            v-model="formData.scheduleDateFrom"
            label="Date Of Schedule - From"
            type="date"
            required
          />

          <v-text-field
            v-model="formData.scheduleDateTo"
            label="Date Of Schedule - To"
            type="date"
            required
          />

          <v-text-field v-model="formData.requestedBy" label="Requested By" required />
          <v-text-field v-model="formData.from" label="From" required />
          <v-text-field v-model="formData.to" label="To" required />
          <v-text-field v-model="formData.assigned" label="Assigned SL/PM" required />

          <v-select
            v-model="formData.remarks"
            :items="['Delivered', 'On-going']"
            label="Remarks"
            required
          />

          <v-text-field
            v-model="formData.deliveryStart"
            label="Delivery Start"
            type="date"
            required
          />
          <v-text-field
            v-model="formData.deliveredDate"
            label="Delivered Date"
            type="date"
            required
          />

          <v-alert v-if="message.text" :type="message.type" class="mt-4">
            {{ message.text }}
          </v-alert>

          <v-row class="mt-6" justify="center" align="center">
            <v-col cols="12" sm="6">
              <v-btn
                type="submit"
                color="primary"
                block
                :loading="submitting"
                :disabled="submitting"
              >
                Submit
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6">
              <v-btn color="error" block @click="handleReset"> Cancel </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-container>

    <v-card elevation="4" class="mt-8">
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
  </v-app>
</template>
