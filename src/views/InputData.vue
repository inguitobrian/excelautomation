<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import Swal from 'sweetalert2'

const form = ref(null)
const submitting = ref(false)
const message = ref({ type: '', text: '' })

const sheetOptions = ref([])
const formData = ref({
  sheetName: '',
  dateRequested: '',
  equipmentActivity: '',
  rsNumber: '',
  poNumber: '',
  atWithdraw: '',
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
})

const handleSubmit = async () => {
  submitting.value = true
  message.value = { type: '', text: '' }

  try {
    const formObj = {
      sheetName: formData.value.sheetName,
      'Date Requested': formData.value.dateRequested,
      'Equipment Activity': formData.value.equipmentActivity,
      'RS Number': formData.value.rsNumber,
      'PO Number': formData.value.poNumber,
      ATW: formData.value.atWithdraw,
      'Date Of Schedule - From': formData.value.scheduleDateFrom,
      'Date Of Schedule - To': formData.value.scheduleDateTo,
      'Requested By': formData.value.requestedBy,
      From: formData.value.from,
      To: formData.value.to,
      'Assigned SL/PM': formData.value.assigned,
      Remarks: formData.value.remarks,
      'Delivery Start': formData.value.deliveryStart,
      'Projected Delivery Date': formData.value.deliveredDate,
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
      await Swal.fire({
        icon: 'success',
        title: 'Submitted Successfully!',
        text: data.message,
        confirmButtonColor: '#2e7d32',
        background: '#f1f8e9',
        color: '#1b5e20',
      })
      handleReset()
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: error.message,
      confirmButtonColor: '#d32f2f',
      background: '#ffebee',
      color: '#c62828',
    })
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  form.value.reset()
  formData.value = {
    sheetName: '',
    dateRequested: '',
    equipmentActivity: '',
    rsNumber: '',
    poNumber: '',
    atWithdraw: '',
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
</script>

<template>
  <AppLayout>
    <template #content>
      <!-- Background with Green Gradient -->
      <div class="main-background">
        <v-container class="pa-6" max-width="1000px">
          <!-- Hero Section -->
          <div class="hero-section mb-8">
            <div class="hero-content">
              <div class="hero-icon-wrapper">
                <v-icon size="60" class="hero-icon">mdi-dump-truck</v-icon>
                <div class="pulse-ring"></div>
                <div class="nature-elements">
                  <v-icon class="leaf leaf-1">mdi-leaf</v-icon>
                  <v-icon class="leaf leaf-2">mdi-leaf</v-icon>
                  <v-icon class="leaf leaf-3">mdi-flower</v-icon>
                </div>
              </div>
              <h1 class="hero-title">🌿Construction Equipment Management</h1>
              <p class="hero-subtitle">equipment management for evenpar</p>
            </div>
          </div>

          <!-- Main Form Card -->
          <v-card elevation="20" class="main-form-card">
            <!-- Progress Steps -->
            <div class="progress-steps mb-6">
              <div class="step active">
                <v-icon>mdi-file-document</v-icon>
                <span>Basic Info</span>
              </div>
              <div class="step-line"></div>
              <div class="step active">
                <v-icon>mdi-calendar</v-icon>
                <span>Schedule</span>
              </div>
              <div class="step-line"></div>
              <div class="step active">
                <v-icon>mdi-truck</v-icon>
                <span>Delivery</span>
              </div>
            </div>

            <!-- Form Header -->
            <div class="form-header-section">
              <div class="form-header-content">
                <v-icon size="32" class="form-header-icon">mdi-clipboard-text</v-icon>
                <div>
                  <h2 class="form-header-title">🌱 Equipment Request Form</h2>
                  <p class="form-header-subtitle">
                    Building a sustainable tomorrow, one request at a time
                  </p>
                </div>
              </div>
            </div>

            <v-form ref="form" @submit.prevent="handleSubmit" class="form-content">
              <!-- Project Information Section -->
              <div class="form-section">
                <div class="section-header">
                  <v-icon class="section-icon">mdi-office-building</v-icon>
                  <h3 class="section-title">🏢 Project Information</h3>
                </div>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-select
                        v-model="formData.sheetName"
                        :items="sheetOptions"
                        label="Project Sheet"
                        name="sheetName"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-file-document"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.dateRequested"
                        label="Date Requested"
                        type="date"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-calendar"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.equipmentActivity"
                        label="Equipment Activity"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-cogs"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <!-- Documentation Section -->
              <div class="form-section">
                <div class="section-header">
                  <v-icon class="section-icon">mdi-file-multiple</v-icon>
                  <h3 class="section-title">📄 Documentation</h3>
                </div>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.rsNumber"
                        label="RS Number"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-identifier"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.poNumber"
                        label="PO Number"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-file-document-outline"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.atWithdraw"
                        label="Authority to Withdraw"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-certificate"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <!-- Schedule Section -->
              <div class="form-section">
                <div class="section-header">
                  <v-icon class="section-icon">mdi-calendar-range</v-icon>
                  <h3 class="section-title">📅 Schedule Information</h3>
                </div>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.scheduleDateFrom"
                        label="Schedule From"
                        type="date"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-calendar-start"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.scheduleDateTo"
                        label="Schedule To"
                        type="date"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-calendar-end"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <!-- Personnel & Location Section -->
              <div class="form-section">
                <div class="section-header">
                  <v-icon class="section-icon">mdi-account-group</v-icon>
                  <h3 class="section-title">👥 Personnel & Location</h3>
                </div>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.requestedBy"
                        label="Requested By"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-account"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.assigned"
                        label="Assigned SL/PM"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-account-hard-hat"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.from"
                        label="From Location"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-map-marker"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.to"
                        label="To Location"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-map-marker-check"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <!-- Delivery Section -->
              <div class="form-section">
                <div class="section-header">
                  <v-icon class="section-icon">mdi-truck-delivery</v-icon>
                  <h3 class="section-title">🚛 Delivery Information</h3>
                </div>
                <v-row dense>
                  <v-col cols="12" md="4">
                    <div class="enhanced-field">
                      <v-select
                        v-model="formData.remarks"
                        :items="[
                          { title: '✅ Delivered', value: 'Delivered' },
                          { title: '🚛 On-going', value: 'On-going' },
                          { title: '⏳ Pending', value: 'Pending' },
                        ]"
                        label="Status"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-information"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.deliveryStart"
                        label="Delivery Start"
                        type="date"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-truck-delivery"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="4">
                    <div class="enhanced-field">
                      <v-text-field
                        v-model="formData.deliveredDate"
                        label="Projected Delivery Date"
                        type="date"
                        required
                        variant="outlined"
                        density="comfortable"
                        color="success"
                        prepend-inner-icon="mdi-calendar-check"
                        class="modern-field"
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <!-- Alert Message -->
              <v-alert
                v-if="message.text"
                :type="message.type"
                class="my-6 enhanced-alert"
                border="start"
                border-color="success"
                elevation="2"
              >
                {{ message.text }}
              </v-alert>

              <!-- Action Buttons -->
              <div class="action-section">
                <div class="action-buttons">
                  <v-btn
                    type="submit"
                    size="x-large"
                    color="success"
                    :loading="submitting"
                    :disabled="submitting"
                    elevation="8"
                    class="submit-btn"
                    rounded="lg"
                  >
                    <v-icon left>mdi-cloud-upload</v-icon>
                    {{ submitting ? 'Processing...' : '🌱 Submit Request' }}
                  </v-btn>

                  <v-btn
                    size="x-large"
                    color="grey-darken-1"
                    @click="handleReset"
                    variant="outlined"
                    class="reset-btn"
                    rounded="lg"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    Reset Form
                  </v-btn>
                </div>
              </div>
            </v-form>
          </v-card>
        </v-container>
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
/* Main Background with Green Theme */
.main-background {
  min-height: 100vh;
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%);
  position: relative;
  overflow: hidden;
}

.main-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(139, 195, 74, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(76, 175, 80, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(129, 199, 132, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* Animated nature patterns */
.main-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234caf50' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  animation: patternMove 20s linear infinite;
  pointer-events: none;
}

@keyframes patternMove {
  0% {
    transform: translateX(0) translateY(0);
  }
  100% {
    transform: translateX(60px) translateY(60px);
  }
}

/* Hero Section */
.hero-section {
  text-align: center;
  color: white;
  padding: 2rem 0;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.hero-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.hero-icon {
  color: white;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border: 2px solid rgba(129, 199, 132, 0.4);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.nature-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.leaf {
  position: absolute;
  color: rgba(139, 195, 74, 0.7);
  animation: leafFloat 4s ease-in-out infinite;
}

.leaf-1 {
  top: -10px;
  left: -20px;
  animation-delay: 0s;
  transform: rotate(-15deg);
}

.leaf-2 {
  bottom: -10px;
  right: -20px;
  animation-delay: 1.5s;
  transform: rotate(25deg);
}

.leaf-3 {
  top: 50%;
  right: -30px;
  animation-delay: 3s;
  transform: rotate(45deg);
}

@keyframes leafFloat {
  0%,
  100% {
    transform: translateY(0px) rotate(var(--rotation, 0deg));
    opacity: 0.7;
  }
  50% {
    transform: translateY(-15px) rotate(calc(var(--rotation, 0deg) + 10deg));
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #e8f5e8, #c8e6c9, #a5d6a7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: textShimmer 3s ease-in-out infinite;
}

@keyframes textShimmer {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2);
  }
}

.hero-subtitle {
  font-size: 1.3rem;
  opacity: 0.95;
  font-weight: 300;
  color: #e8f5e8;
}

/* Main Form Card */
.main-form-card {
  background: linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow:
    0 20px 60px rgba(76, 175, 80, 0.15),
    0 8px 24px rgba(46, 125, 50, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(129, 199, 132, 0.3);
  position: relative;
  overflow: hidden;
}

.main-form-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4caf50, #8bc34a, #4caf50);
  background-size: 200% 100%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* Progress Steps */
.progress-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-radius: 16px;
  border: 1px solid #a5d6a7;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.1);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #2e7d32;
  font-weight: 600;
  font-size: 0.9rem;
}

.step.active {
  color: #1b5e20;
}

.step i {
  font-size: 1.5rem;
  padding: 0.75rem;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25);
  color: #4caf50;
}

.step-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  margin: 0 1rem;
  border-radius: 1px;
}

/* Form Header Section */
.form-header-section {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  margin: -2.5rem -2.5rem 2rem -2.5rem;
  padding: 2rem 2.5rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.form-header-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.form-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.form-header-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem;
  border-radius: 12px;
  color: #e8f5e8;
}

.form-header-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  color: #e8f5e8;
}

.form-header-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0.25rem 0 0 0;
  color: #c8e6c9;
}

/* Form Sections */
.form-section {
  margin-bottom: 2.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f1f8e9, #ffffff);
  border-radius: 16px;
  border: 1px solid #c8e6c9;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.08);
  position: relative;
  overflow: hidden;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #4caf50, #8bc34a);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e8f5e8;
}

.section-icon {
  color: #4caf50;
  background: #e8f5e8;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1b5e20;
  margin: 0;
}

/* Enhanced Fields */
.enhanced-field {
  position: relative;
  margin-bottom: 1rem;
}

.modern-field :deep(.v-field) {
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.08);
  border: 2px solid #e8f5e8;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-field :deep(.v-field:hover) {
  border-color: #4caf50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
  transform: translateY(-1px);
}

.modern-field :deep(.v-field.v-field--focused) {
  border-color: #2e7d32;
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
  transform: translateY(-2px);
}

.modern-field :deep(.v-field__prepend-inner) {
  color: #4caf50;
}

.modern-field :deep(.v-label) {
  color: #2e7d32;
  font-weight: 500;
}

.modern-field :deep(.v-field--focused .v-label) {
  color: #1b5e20;
}

/* Enhanced Alert */
.enhanced-alert {
  border-radius: 12px;
  border-left-width: 4px;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.15);
  background: linear-gradient(135deg, #f1f8e9, #ffffff);
}

/* Action Section */
.action-section {
  margin-top: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #e8f5e8, #ffffff);
  border-radius: 16px;
  border: 1px solid #c8e6c9;
  position: relative;
  overflow: hidden;
}

.action-section::before {
  content: '🌿';
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  opacity: 0.3;
  animation: leafSway 3s ease-in-out infinite;
}

@keyframes leafSway {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.submit-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
  color: white;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(76, 175, 80, 0.5);
  background: linear-gradient(135deg, #66bb6a, #388e3c);
}

.reset-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  border: 2px solid #81c784;
  color: #2e7d32;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .main-form-card {
    padding: 1.5rem;
  }

  .form-header-section {
    margin: -1.5rem -1.5rem 1.5rem -1.5rem;
    padding: 1.5rem;
  }

  .form-section {
    padding: 1.5rem;
  }

  .progress-steps {
    flex-direction: column;
    gap: 1rem;
  }

  .step-line {
    width: 2px;
    height: 30px;
    background: linear-gradient(180deg, #4caf50, #8bc34a);
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .submit-btn,
  .reset-btn {
    min-width: auto;
  }

  .nature-elements .leaf {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.8rem;
  }

  .section-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .form-header-content {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
}

/* Loading animation for submit button */
.submit-btn:loading {
  background: linear-gradient(135deg, #81c784, #4caf50);
  animation: submitPulse 1.5s ease-in-out infinite;
}

@keyframes submitPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}
</style>
