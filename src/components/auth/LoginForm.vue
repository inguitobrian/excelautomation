<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const visible = ref(false)
const refVForm = ref()

// Form data structure
const formDataDefault = {
  password: '',
}
const formData = ref({
  ...formDataDefault,
})

// Form action states
const formActionDefault = {
  formProcess: false,
  formSuccessMessage: '',
  formErrorMessage: '',
  formStatus: null,
}
const formAction = ref({
  ...formActionDefault,
})

const adminCredentials = {
  username: import.meta.env.VITE_ADMIN_USERNAME,
  password: import.meta.env.VITE_ADMIN_PASSWORD,
  role: import.meta.env.VITE_ADMIN_ROLE,
}

// Simple validator function
const requiredValidator = (value) => {
  return !!value || 'This field is required'
}

// Function to log in
const onSubmit = async () => {
  formAction.value = { ...formActionDefault, formProcess: true }

  try {
    // Use the already defined adminCredentials (from env)
    if (formData.value.password === adminCredentials.password) {
      formAction.value.formSuccessMessage = 'Successfully logged in as Administrator.'

      // Store admin session in localStorage
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userRole', adminCredentials.role)
      localStorage.setItem('username', adminCredentials.username)
      localStorage.setItem('loginTime', new Date().toISOString())

      setTimeout(() => {
        router.replace('/inputform')
      }, 1000)
    } else {
      formAction.value.formErrorMessage = 'Invalid admin password. Access denied.'
      formAction.value.formStatus = 403
    }
  } catch (error) {
    formAction.value.formErrorMessage = 'Login failed. Please try again.'
    formAction.value.formStatus = 500
  }

  refVForm.value?.reset()
  formAction.value.formProcess = false
}

const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}

// Security features
const securityFeatures = [
  { icon: 'mdi-shield-check', text: 'Secure Access' },
  { icon: 'mdi-lock', text: 'Encrypted Data' },
  { icon: 'mdi-eye-off', text: 'Protected System' },
]
</script>

<template>
  <div class="login-container">
    <!-- Custom Alert Notification -->
    <v-alert
      v-if="formAction.formSuccessMessage"
      type="success"
      variant="elevated"
      class="alert-notification"
      closable
      @click:close="formAction.formSuccessMessage = ''"
    >
      {{ formAction.formSuccessMessage }}
    </v-alert>

    <v-alert
      v-if="formAction.formErrorMessage"
      type="error"
      variant="elevated"
      class="alert-notification"
      closable
      @click:close="formAction.formErrorMessage = ''"
    >
      {{ formAction.formErrorMessage }}
    </v-alert>

    <v-card class="login-card" elevation="12">
      <!-- Header Section -->
      <div class="login-header">
        <div class="header-background"></div>
        <div class="header-content">
          <div class="logo-section">
            <v-icon class="logo-icon" size="48">mdi-dump-truck</v-icon>
            <div class="logo-text">
              <h1 class="system-title">Haulers Scheduling</h1>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <v-card-text class="form-section">
        <div class="welcome-text">
          <h2 class="welcome-title">Scheduling System</h2>
        </div>

        <v-form ref="refVForm" fast-fail @submit.prevent="onFormSubmit">
          <!-- Password Field -->
          <div class="password-field-wrapper">
            <v-text-field
              v-model="formData.password"
              :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
              :type="visible ? 'text' : 'password'"
              label="Administrator Password"
              prepend-inner-icon="mdi-lock"
              variant="outlined"
              color="green-darken-2"
              class="password-field"
              :rules="[requiredValidator]"
              @click:append-inner="visible = !visible"
              autofocus
            />
          </div>

          <!-- Submit Button -->
          <v-btn
            class="login-button"
            size="x-large"
            type="submit"
            :disabled="formAction.formProcess"
            :loading="formAction.formProcess"
            block
            rounded="lg"
          >
            <v-icon class="mr-2">mdi-login</v-icon>
            Access System
          </v-btn>
        </v-form>

        <!-- Security Features -->
        <div class="security-section">
          <v-divider class="my-4"></v-divider>
          <div class="security-features">
            <div v-for="feature in securityFeatures" :key="feature.text" class="security-item">
              <v-icon :icon="feature.icon" size="16" class="security-icon" />
              <span class="security-text">{{ feature.text }}</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Footer -->
      <v-card-actions class="login-footer">
        <v-spacer />
        <div class="footer-content">
          <v-icon size="16" class="mr-1">mdi-information</v-icon>
          <span class="footer-text">Authorized Personnel Only</span>
        </div>
        <v-spacer />
      </v-card-actions>
    </v-card>

    <!-- Background Elements -->
    <div class="background-elements">
      <div class="bg-element element-1"></div>
      <div class="bg-element element-2"></div>
      <div class="bg-element element-3"></div>
    </div>
  </div>
</template>

<style scoped>
/* Alert Notification Styles */
.alert-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 300px;
  max-width: 500px;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    #1b5e20 0%,
    #2e7d32 25%,
    #388e3c 50%,
    #43a047 75%,
    #4caf50 100%
  );
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.login-header {
  position: relative;
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #43a047 100%);
  color: white;
  padding: 32px 24px;
  text-align: center;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="60" cy="70" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="30" cy="80" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
  opacity: 0.3;
}

.header-content {
  position: relative;
  z-index: 1;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.logo-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(10px);
}

.system-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.system-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.admin-badge {
  margin-top: 8px;
}

.admin-chip {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-section {
  padding: 32px !important;
}

.welcome-text {
  text-align: center;
  margin-bottom: 32px;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 8px;
}

.welcome-subtitle {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.password-field-wrapper {
  margin-bottom: 24px;
}

.password-field {
  transition: all 0.3s ease;
}

.password-field:hover {
  transform: translateY(-2px);
}

.login-button {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #43a047 100%);
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 125, 50, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.security-section {
  margin-top: 16px;
}

.security-features {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 0.8rem;
}

.security-icon {
  color: #2e7d32;
}

.login-footer {
  background: rgba(46, 125, 50, 0.05);
  padding: 16px;
  border-top: 1px solid rgba(46, 125, 50, 0.1);
}

.footer-content {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

.footer-text {
  color: #2e7d32;
}

/* Background Elements */
.background-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.bg-element {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.element-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.element-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.element-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* Responsive Design */
@media (max-width: 600px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    max-width: 100%;
  }

  .logo-section {
    flex-direction: column;
    gap: 12px;
  }

  .system-title {
    font-size: 1.5rem;
  }

  .welcome-title {
    font-size: 1.25rem;
  }

  .security-features {
    flex-direction: column;
    gap: 8px;
  }

  .form-section {
    padding: 24px !important;
  }
}

/* Loading state */
.login-button.v-btn--loading {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #43a047 100%);
}

/* Focus states */
.password-field .v-field--focused {
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}

/* Dark mode support */
.v-theme--dark .login-card {
  background: rgba(33, 37, 41, 0.95);
}

.v-theme--dark .welcome-title {
  color: #4caf50;
}

.v-theme--dark .welcome-subtitle {
  color: #ccc;
}

.v-theme--dark .security-text {
  color: #ccc;
}

.v-theme--dark .footer-content {
  color: #ccc;
}

.v-theme--dark .footer-text {
  color: #4caf50;
}
</style>
