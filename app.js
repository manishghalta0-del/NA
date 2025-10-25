import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBK8K0nIbc1DCj7kghQKYOLIhsB_3EvWQg",
  authDomain: "dreamharbour-billing.firebaseapp.com",
  projectId: "dreamharbour-billing",
  storageBucket: "dreamharbour-billing.appspot.com",
  messagingSenderId: "32291586019",
  appId: "1:32291586019:web:461035a507ad3f2dcfead6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============== GLOBAL VARIABLES ==============
let recaptchaVerifier;
let confirmationResult;
let currentUser = null;
const OWNER_PHONE = "9873329494"; // Owner's phone number

// ============== SERVICES LIST ==============
const SERVICES = [
  "Photostat/Copy Services",
  "Adhaar Pan Linking",
  "Registration Fees",
  "Driving Licence",
  "E-Stamping",
  "Jamabandi",
  "Nepal Money Transfer",
  "Online Certificates",
  "Online Internet Services",
  "Pan Card & Others",
  "Printing Services",
  "Affidavit/Application",
  "Deed Writing"
];

// ============== LOGIN PAGE ==============
function initializeLogin() {
  const loginContainer = document.getElementById('login-container');
  loginContainer.innerHTML = `
    <div class="login-page">
      <div class="login-left">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='30' r='20' fill='white'/%3E%3Cpath d='M20 80 Q50 60 80 80' fill='white'/%3E%3C/svg%3E" alt="Icon" class="login-icon">
        <h1>Dream Harbour</h1>
        <p>Your Gateway to Professional Services</p>
      </div>
      
      <div class="login-right">
        <h2>Welcome Back</h2>
        <p>Sign in to access your account</p>
        
        <div class="form-group">
          <label>Country</label>
          <select id="countrySelect" class="form-control">
            <option value="+91">🇮🇳 India (+91)</option>
            <option value="+971">🇦🇪 UAE (+971)</option>
            <option value="+1">🇺🇸 USA (+1)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="phoneInput" placeholder="Enter 10 digit mobile number" class="form-control" maxlength="10">
          <small>For testing: Use 9999999999</small>
        </div>
        
        <button onclick="sendOTP()" class="btn-primary">Send OTP</button>
        
        <div id="otpContainer" style="display: none; margin-top: 20px;">
          <div class="form-group">
            <label>Enter OTP</label>
            <input type="text" id="otpInput" placeholder="Enter 6-digit OTP" class="form-control" maxlength="6">
            <small>Test OTP: 123456</small>
          </div>
          <button onclick="verifyOTP()" class="btn-primary">Verify OTP</button>
          <button onclick="resendOTP()" class="btn-secondary" style="margin-top: 10px;">Resend OTP</button>
        </div>
        
        <div id="statusMessage" style="margin-top: 15px; text-align: center;"></div>
      </div>
    </div>
  `;
  
  // Setup reCAPTCHA
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible'
  });
}

// ============== SEND OTP ==============
async function sendOTP() {
  const phoneInput = document.getElementById('phoneInput').value;
  const countryCode = document.getElementById('countrySelect').value;
  const statusMessage = document.getElementById('statusMessage');
  
  if (!phoneInput || phoneInput.length !== 10) {
    statusMessage.innerHTML = '<p style="color: red;">❌ Please enter a valid 10-digit phone number</p>';
    return;
  }
  
  const fullPhoneNumber = countryCode + phoneInput;
  
  try {
    statusMessage.innerHTML = '<p style="color: blue;">📱 Sending OTP...</p>';
    
    confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
    
    document.getElementById('otpContainer').style.display = 'block';
    statusMessage.innerHTML = '<p style="color: green;">✅ OTP sent successfully!</p>';
  } catch (error) {
    console.error("Error sending OTP:", error);
    statusMessage.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
  }
}

// ============== VERIFY OTP ==============
async function verifyOTP() {
  const otpInput = document.getElementById('otpInput').value;
  const statusMessage = document.getElementById('statusMessage');
  
  if (!otpInput || otpInput.length !== 6) {
    statusMessage.innerHTML = '<p style="color: red;">❌ Please enter a valid 6-digit OTP</p>';
    return;
  }
  
  try {
    statusMessage.innerHTML = '<p style="color: blue;">⏳ Verifying OTP...</p>';
    
    const result = await confirmationResult.confirm(otpInput);
    currentUser = result.user;
    
    // Check if user is owner
    if (currentUser.phoneNumber.includes(OWNER_PHONE)) {
      showOwnerDashboard();
    } else {
      showUserDashboard();
    }
    
  } catch (error) {
    console.error("Error verifying OTP:", error);
    statusMessage.innerHTML = `<p style="color: red;">❌ Invalid OTP. Please try again.</p>`;
  }
}

// ============== RESEND OTP ==============
async function resendOTP() {
  await sendOTP();
}

// ============== OWNER DASHBOARD ==============
function showOwnerDashboard() {
  document.getElementById('login-container').innerHTML = `
    <div class="owner-dashboard">
      <div class="dashboard-header">
        <div>
          <h1>👑 Owner Dashboard</h1>
          <p>Welcome, Owner (${currentUser.phoneNumber})</p>
        </div>
        <button onclick="logout()" class="btn-logout">Logout</button>
      </div>
      
      <div class="dashboard-content">
        <div class="dashboard-card">
          <h3>📋 Create New User</h3>
          <div class="form-group">
            <label>User Mobile Number</label>
            <input type="tel" id="newUserPhone" placeholder="Enter mobile number" class="form-control" maxlength="10">
          </div>
          
          <div class="form-group">
            <label>Assign Services</label>
            <div class="services-grid" id="servicesCheckbox">
              ${SERVICES.map(service => `
                <label class="checkbox-item">
                  <input type="checkbox" class="service-check" value="${service}">
                  <span>${service}</span>
                </label>
              `).join('')}
            </div>
          </div>
          
          <button onclick="createUser()" class="btn-primary">Create User</button>
          <div id="createUserMessage" style="margin-top: 15px;"></div>
        </div>
        
        <div class="dashboard-card">
          <h3>👥 Users List</h3>
          <div id="usersList" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
      </div>
    </div>
  `;
  
  loadUsersList();
}

// ============== CREATE USER ==============
async function createUser() {
  const phoneInput = document.getElementById('newUserPhone').value;
  const selectedServices = Array.from(document.querySelectorAll('.service-check:checked')).map(cb => cb.value);
  const message = document.getElementById('createUserMessage');
  
  if (!phoneInput || phoneInput.length !== 10) {
    message.innerHTML = '<p style="color: red;">❌ Please enter a valid 10-digit phone number</p>';
    return;
  }
  
  if (selectedServices.length === 0) {
    message.innerHTML = '<p style="color: red;">❌ Please select at least one service</p>';
    return;
  }
  
  try {
    message.innerHTML = '<p style="color: blue;">⏳ Creating user...</p>';
    
    await addDoc(collection(db, "users"), {
      phoneNumber: phoneInput,
      services: selectedServices,
      createdBy: currentUser.phoneNumber,
      createdAt: new Date(),
      status: "active"
    });
    
    message.innerHTML = '<p style="color: green;">✅ User created successfully!</p>';
    document.getElementById('newUserPhone').value = '';
    document.querySelectorAll('.service-check').forEach(cb => cb.checked = false);
    
    // Reload users list
    setTimeout(loadUsersList, 1000);
    
  } catch (error) {
    console.error("Error creating user:", error);
    message.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
  }
}

// ============== LOAD USERS LIST ==============
async function loadUsersList() {
  const usersList = document.getElementById('usersList');
  
  try {
    const q = query(collection(db, "users"), where("createdBy", "==", currentUser.phoneNumber));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      usersList.innerHTML = '<p>No users created yet</p>';
      return;
    }
    
    usersList.innerHTML = snapshot.docs.map(doc => {
      const user = doc.data();
      return `
        <div class="user-card">
          <h4>📱 ${user.phoneNumber}</h4>
          <p><strong>Services:</strong></p>
          <ul>
            ${user.services.map(s => `<li>✓ ${s}</li>`).join('')}
          </ul>
          <small>Created: ${new Date(user.createdAt.toDate()).toLocaleDateString()}</small>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Error loading users:", error);
    usersList.innerHTML = `<p style="color: red;">Error loading users</p>`;
  }
}

// ============== USER DASHBOARD ==============
function showUserDashboard() {
  document.getElementById('login-container').innerHTML = `
    <div class="user-dashboard">
      <div class="dashboard-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p>Welcome, ${currentUser.phoneNumber}</p>
        </div>
        <button onclick="logout()" class="btn-logout">Logout</button>
      </div>
      
      <div class="dashboard-content">
        <h3>📋 Your Assigned Services</h3>
        <div id="userServices" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;"></div>
      </div>
    </div>
  `;
  
  loadUserServices();
}

// ============== LOAD USER SERVICES ==============
async function loadUserServices() {
  const userServices = document.getElementById('userServices');
  
  try {
    const q = query(collection(db, "users"), where("phoneNumber", "==", currentUser.phoneNumber.slice(-10)));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      userServices.innerHTML = '<p>No services assigned yet</p>';
      return;
    }
    
    const user = snapshot.docs[0].data();
    userServices.innerHTML = user.services.map(service => `
      <div class="service-card">
        <h4>✓ ${service}</h4>
      </div>
    `).join('');
    
  } catch (error) {
    console.error("Error loading services:", error);
  }
}

// ============== LOGOUT ==============
async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    initializeLogin();
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// ============== INITIALIZE ON PAGE LOAD ==============
window.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
  initializeLogin();
});
=======
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        
        // Check if user is already logged in
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                showDashboard();
            } else {
                showLoginPage();
            }
        });
        
        initializeEventListeners();
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showToast('Please configure Firebase credentials in app.js', 'error');
    }
});

// Initialize event listeners
function initializeEventListeners() {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', handleSendOTP);
    document.getElementById('verify-otp-btn')?.addEventListener('click', handleVerifyOTP);
    document.getElementById('resend-otp-btn')?.addEventListener('click', handleResendOTP);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Invoice form
    document.getElementById('customer-mobile')?.addEventListener('input', handleCustomerMobileInput);
    document.getElementById('add-service-btn')?.addEventListener('click', addServiceRow);
    document.getElementById('generate-invoice-btn')?.addEventListener('click', generateInvoice);
    document.getElementById('clear-form-btn')?.addEventListener('click', clearInvoiceForm);
    
    // Settings
    document.getElementById('save-settings-btn')?.addEventListener('click', saveBusinessSettings);
    
    // Reports
    document.getElementById('generate-report-btn')?.addEventListener('click', generateReport);
    document.getElementById('export-gst-csv')?.addEventListener('click', exportGSTReport);
}

// Authentication Functions
function initRecaptcha() {
    if (!recaptchaVerifier) {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                console.log('reCAPTCHA solved');
            }
        });
    }
}

function handleSendOTP(e) {
    e.preventDefault();
    
    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = document.getElementById('phone-number').value;
    const errorElement = document.getElementById('phone-error');
    
    // Validate phone number
    if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
        errorElement.textContent = 'Please enter a valid 10-digit phone number';
        return;
    }
    
    errorElement.textContent = '';
    const fullPhoneNumber = countryCode + phoneNumber;
    
    // Show loading state
    const btn = document.getElementById('send-otp-btn');
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline';
    btn.disabled = true;
    
    // Initialize reCAPTCHA
    initRecaptcha();
    
    // Send OTP
        auth.signInWithPhoneNumber(fullPhoneNumber, recaptchaVerifier)
        .then((result) => {
            confirmationResult = result;
            showToast('OTP sent successfully!', 'success');
            
            // Show OTP section
            document.getElementById('otp-section').style.display = 'block';
            document.getElementById('login-form').style.display = 'none';
            
            // Start resend timer
            startResendTimer();
        })
        .catch((error) => {
            console.error('Error sending OTP:', error);
            errorElement.textContent = 'Failed to send OTP. Please try again.';
            showToast('Failed to send OTP', 'error');
        })
        .finally(() => {
            btn.querySelector('.btn-text').style.display = 'inline';
            btn.querySelector('.btn-loader').style.display = 'none';
            btn.disabled = false;
        });
}

function handleVerifyOTP() {
    const otp = document.getElementById('otp-input').value;
    const errorElement = document.getElementById('otp-error');
    
    if (otp.length !== 6) {
        errorElement.textContent = 'Please enter a valid 6-digit OTP';
        return;
    }
    
    if (!confirmationResult) {
        errorElement.textContent = 'Please request OTP first';
        return;
    }
    
    errorElement.textContent = '';
    
    const btn = document.getElementById('verify-otp-btn');
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline';
    btn.disabled = true;
    
    confirmationResult.confirm(otp)
        .then((result) => {
            currentUser = result.user;
            showToast('Login successful!', 'success');
            showDashboard();
        })
        .catch((error) => {
            console.error('Error verifying OTP:', error);
            errorElement.textContent = 'Invalid OTP. Please try again.';
            showToast('Invalid OTP', 'error');
        })
        .finally(() => {
            btn.querySelector('.btn-text').style.display = 'inline';
            btn.querySelector('.btn-loader').style.display = 'none';
            btn.disabled = false;
        });
}

function handleResendOTP() {
    // Re-send OTP
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('otp-section').style.display = 'none';
    document.getElementById('otp-input').value = '';
    document.getElementById('send-otp-btn').click();
}

function startResendTimer() {
    let timeLeft = 30;
    const timerElement = document.getElementById('resend-timer');
    const resendBtn = document.getElementById('resend-otp-btn');
    
    resendBtn.disabled = true;
    
    const timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            resendBtn.disabled = false;
            document.getElementById('resend-text').textContent = 'Resend OTP';
        }
    }, 1000);
}

function handleLogout() {
    auth.signOut().then(() => {
        currentUser = null;
        showLoginPage();
        showToast('Logged out successfully', 'success');
    });
}

// UI Navigation
function showLoginPage() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('dashboard-app').style.display = 'none';
    
    // Reset forms
    document.getElementById('login-form').reset();
    document.getElementById('otp-section').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('otp-input').value = '';
    recaptchaVerifier = null;
}

function showDashboard() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard-app').style.display = 'flex';
    
    // Load dashboard data
    loadDashboardData();
}

function handleNavigation(e) {
    e.preventDefault();
    
    // Check if logout
    if (e.currentTarget.id === 'logout-btn') {
        return;
    }
    
    const section = e.currentTarget.dataset.section;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Show corresponding section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${section}-section`)?.classList.add('active');
    
    // Load section-specific data
    if (section === 'dashboard') {
        loadDashboardData();
    } else if (section === 'generate-invoice') {
        setupInvoiceForm();
    } else if (section === 'reports') {
        loadReportsData();
    } else if (section === 'settings') {
        loadBusinessSettings();
    }
}

// Dashboard Functions
function loadDashboardData() {
    // Calculate metrics from invoices
    const totalRevenue = appData.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const gstCollected = appData.invoices.reduce((sum, inv) => sum + inv.gstAmount, 0);
    const servicesCount = appData.invoices.reduce((sum, inv) => sum + inv.services.length, 0);
    const customersCount = new Set(appData.invoices.map(inv => inv.customerId)).size;
    
    // Update metric cards
    document.getElementById('total-revenue').textContent = `â‚¹${totalRevenue.toFixed(2)}`;
    document.getElementById('gst-collected').textContent = `â‚¹${gstCollected.toFixed(2)}`;
    document.getElementById('services-count').textContent = servicesCount;
    document.getElementById('customers-count').textContent = customersCount;
    
    // Load charts
    loadServiceRevenueChart();
    loadMonthlyRevenueChart();
    
    // Load recent invoices
    loadRecentInvoices();
}

function loadServiceRevenueChart() {
    const ctx = document.getElementById('service-revenue-chart');
    if (!ctx) return;
    
    // Calculate service-wise revenue
    const serviceRevenue = {};
    appData.invoices.forEach(invoice => {
        invoice.services.forEach(service => {
            const serviceName = service.name;
            if (!serviceRevenue[serviceName]) {
                serviceRevenue[serviceName] = 0;
            }
            serviceRevenue[serviceName] += service.total || 0;
        });
    });
    
    const labels = Object.keys(serviceRevenue);
    const data = Object.values(serviceRevenue);
    
    if (window.serviceRevenueChart) {
        window.serviceRevenueChart.destroy();
    }
    
    if (labels.length === 0) {
        labels.push('No Data');
        data.push(1);
    }
    
    window.serviceRevenueChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F',
                    '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function loadMonthlyRevenueChart() {
    const ctx = document.getElementById('monthly-revenue-chart');
    if (!ctx) return;
    
    // Calculate monthly revenue for last 6 months
    const monthlyRevenue = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[monthKey] = 0;
    }
    
    // Sum up invoices by month
    appData.invoices.forEach(invoice => {
        const date = new Date(invoice.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue[monthKey] !== undefined) {
            monthlyRevenue[monthKey] += invoice.total;
        }
    });
    
    const labels = Object.keys(monthlyRevenue).map(key => {
        const [year, month] = key.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const data = Object.values(monthlyRevenue);
    
    if (window.monthlyRevenueChart) {
        window.monthlyRevenueChart.destroy();
    }
    
    window.monthlyRevenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Revenue (â‚¹)',
                data: data,
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadRecentInvoices() {
    const tbody = document.getElementById('invoices-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (appData.invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No invoices found. Create your first invoice!</td></tr>';
        return;
    }
    
    // Show last 10 invoices
    const recentInvoices = [...appData.invoices].reverse().slice(0, 10);
    
    recentInvoices.forEach(invoice => {
        const row = document.createElement('tr');
        const customer = appData.customers.find(c => c.id === invoice.customerId);
        const customerName = customer ? customer.name : invoice.customerName;
        
        row.innerHTML = `
            <td>${invoice.invoiceNumber}</td>
            <td>${customerName}</td>
            <td>${new Date(invoice.date).toLocaleDateString()}</td>
            <td>${invoice.services.length}</td>
            <td>â‚¹${invoice.subtotal.toFixed(2)}</td>
            <td>â‚¹${invoice.gstAmount.toFixed(2)}</td>
            <td>â‚¹${invoice.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewInvoice('${invoice.id}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Invoice Generation Functions
function setupInvoiceForm() {
    clearInvoiceForm();
    addServiceRow();
    updateInvoicePreview();
}

function handleCustomerMobileInput(e) {
    const mobile = e.target.value;
    const suggestionsDiv = document.getElementById('customer-suggestions');
    
    if (mobile.length >= 3) {
        const matches = appData.customers.filter(c => c.mobile.includes(mobile));
        
        if (matches.length > 0) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.classList.add('active');
            
            matches.forEach(customer => {
                const div = document.createElement('div');
                div.className = 'customer-suggestion-item';
                div.textContent = `${customer.name} - ${customer.mobile}`;
                div.onclick = () => selectCustomer(customer);
                suggestionsDiv.appendChild(div);
            });
        } else {
            suggestionsDiv.classList.remove('active');
        }
    } else {
        suggestionsDiv.classList.remove('active');
    }
}

function selectCustomer(customer) {
    document.getElementById('customer-mobile').value = customer.mobile;
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-gstin').value = customer.gstin || '';
    document.getElementById('customer-address').value = customer.address || '';
    
    document.getElementById('customer-suggestions').classList.remove('active');
    updateInvoicePreview();
}

function addServiceRow() {
    const container = document.getElementById('services-container');
    const serviceRow = document.createElement('div');
    serviceRow.className = 'service-row';
    serviceRow.dataset.serviceIndex = Date.now();
    
    serviceRow.innerHTML = `
        <div class="service-row-header">
            <span class="service-row-title">Service ${container.children.length + 1}</span>
            <button type="button" class="remove-service-btn" onclick="removeServiceRow(this)">Remove</button>
        </div>
        <div class="service-details">
            <div class="form-group">
                <label>Service Type</label>
                <select class="service-type-select form-control" onchange="handleServiceTypeChange(this)">
                    <option value="">Select Service</option>
                    ${Object.keys(servicesData).map(key => `<option value="${key}">${key}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>SAC Code</label>
                <input type="text" class="service-sac form-control" readonly>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" class="service-qty form-control" min="1" value="1" oninput="calculateServiceTotal(this)">
            </div>
            <div class="form-group">
                <label>Rate (â‚¹)</label>
                <input type="number" class="service-rate form-control" min="0" step="0.01" oninput="calculateServiceTotal(this)">
            </div>
            <div class="form-group">
                <label>GST %</label>
                <input type="number" class="service-gst form-control" readonly>
            </div>
            <div class="form-group">
                <label>Total (â‚¹)</label>
                <input type="number" class="service-total form-control" readonly>
            </div>
        </div>
        <div class="additional-services-container"></div>
    `;
    
    container.appendChild(serviceRow);
}

function removeServiceRow(btn) {
    btn.closest('.service-row').remove();
    updateInvoicePreview();
}

function handleServiceTypeChange(select) {
    const serviceRow = select.closest('.service-row');
    const serviceName = select.value;
    
    if (!serviceName) return;
    
    const serviceData = servicesData[serviceName];
    const additionalContainer = serviceRow.querySelector('.additional-services-container');
    
    // Set basic service data
    serviceRow.querySelector('.service-sac').value = serviceData.sacCode;
    serviceRow.querySelector('.service-gst').value = serviceData.gstRate;
    
    if (serviceData.isManual) {
        serviceRow.querySelector('.service-rate').value = '';
        serviceRow.querySelector('.service-rate').removeAttribute('readonly');
    } else {
        serviceRow.querySelector('.service-rate').value = serviceData.baseRate;
        serviceRow.querySelector('.service-rate').setAttribute('readonly', 'readonly');
    }
    
    // Clear and add additional services
    additionalContainer.innerHTML = '';
    
    if (serviceData.additionalServices && serviceData.additionalServices.length > 0) {
        serviceData.additionalServices.forEach((addService, index) => {
            const addDiv = document.createElement('div');
            addDiv.className = 'additional-service';
            
            const amountInput = addService.isManual ? 
                `<input type="number" class="add-service-amount form-control" min="0" step="0.01" value="${addService.amount}" oninput="calculateServiceTotal(this)">` :
                `<input type="number" class="add-service-amount form-control" value="${addService.amount}" readonly>`;
            
            addDiv.innerHTML = `
                <div class="service-details">
                    <div class="form-group">
                        <label>Additional Service ${index + 1}</label>
                        <input type="text" class="form-control" value="${addService.name}" readonly>
                    </div>
                    <div class="form-group">
                        <label>SAC Code</label>
                        <input type="text" class="add-service-sac form-control" value="${addService.sacCode}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Amount (â‚¹)</label>
                        ${amountInput}
                    </div>
                    <div class="form-group">
                        <label>GST %</label>
                        <input type="number" class="add-service-gst form-control" value="${addService.gstRate}" readonly>
                    </div>
                </div>
            `;
            
            additionalContainer.appendChild(addDiv);
        });
    }
    
    calculateServiceTotal(select);
}

function calculateServiceTotal(element) {
    const serviceRow = element.closest('.service-row');
    if (!serviceRow) return;
    
    const qty = parseFloat(serviceRow.querySelector('.service-qty').value) || 1;
    const rate = parseFloat(serviceRow.querySelector('.service-rate').value) || 0;
    const gstRate = parseFloat(serviceRow.querySelector('.service-gst').value) || 0;
    
    const subtotal = qty * rate;
    const gstAmount = (subtotal * gstRate) / 100;
    const total = subtotal + gstAmount;
    
    serviceRow.querySelector('.service-total').value = total.toFixed(2);
    
    updateInvoicePreview();
}

function updateInvoicePreview() {
    // Update customer details in preview
    const customerName = document.getElementById('customer-name').value || 'Customer Name';
    const customerMobile = document.getElementById('customer-mobile').value;
    const customerAddress = document.getElementById('customer-address').value || 'Customer Address';
    const customerGstin = document.getElementById('customer-gstin').value;
    
    document.getElementById('preview-customer-name').innerHTML = `<strong>${customerName}</strong>`;
    document.getElementById('preview-customer-address').textContent = customerAddress;
    document.getElementById('preview-customer-mobile').textContent = customerMobile ? `Mobile: ${customerMobile}` : '';
    document.getElementById('preview-customer-gstin').textContent = customerGstin ? `GSTIN: ${customerGstin}` : '';
    
    // Update business details
    document.getElementById('preview-business-name').innerHTML = `<strong>${appData.businessSettings.businessName}</strong>`;
    document.getElementById('preview-business-address').textContent = appData.businessSettings.address || 'Your Business Address';
    document.getElementById('preview-business-gstin').textContent = appData.businessSettings.gstin ? `GSTIN: ${appData.businessSettings.gstin}` : 'GSTIN: Your GSTIN';
    document.getElementById('preview-business-contact').textContent = appData.businessSettings.phone ? `Contact: ${appData.businessSettings.phone}` : 'Contact: Your Contact';
    
    // Update services table
    const tbody = document.getElementById('preview-services-tbody');
    tbody.innerHTML = '';
    
    let subtotal = 0;
    let totalGst = 0;
    let serialNo = 1;
    
    const serviceRows = document.querySelectorAll('.service-row');
    
    if (serviceRows.length === 0 || !document.querySelector('.service-type-select').value) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No services added yet</td></tr>';
    } else {
        serviceRows.forEach(serviceRow => {
            const serviceType = serviceRow.querySelector('.service-type-select').value;
            if (!serviceType) return;
            
            const serviceData = servicesData[serviceType];
            const qty = parseFloat(serviceRow.querySelector('.service-qty').value) || 1;
            const rate = parseFloat(serviceRow.querySelector('.service-rate').value) || 0;
            const gstRate = parseFloat(serviceRow.querySelector('.service-gst').value) || 0;
            const sacCode = serviceRow.querySelector('.service-sac').value;
            
            // Add additional services first
            const additionalServices = serviceRow.querySelectorAll('.additional-service');
            additionalServices.forEach((addService, idx) => {
                const addAmount = parseFloat(addService.querySelector('.add-service-amount').value) || 0;
                const addGstRate = parseFloat(addService.querySelector('.add-service-gst').value) || 0;
                const addSacCode = addService.querySelector('.add-service-sac').value;
                const addName = addService.querySelector('input[type="text"]').value;
                
                const addGstAmount = (addAmount * addGstRate) / 100;
                const addTotal = addAmount + addGstAmount;
                
                subtotal += addAmount;
                totalGst += addGstAmount;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${serialNo}.${idx + 1}</td>
                    <td>${addName}</td>
                    <td>${addSacCode}</td>
                    <td>1</td>
                    <td>â‚¹${addAmount.toFixed(2)}</td>
                    <td>${addGstRate}%</td>
                    <td>â‚¹${addGstAmount.toFixed(2)}</td>
                    <td>â‚¹${addTotal.toFixed(2)}</td>
                `;
                tbody.appendChild(row);
            });
            
            // Add main service
            const serviceSubtotal = qty * rate;
            const serviceGstAmount = (serviceSubtotal * gstRate) / 100;
            const serviceTotal = serviceSubtotal + serviceGstAmount;
            
            subtotal += serviceSubtotal;
            totalGst += serviceGstAmount;
            
            const mainServiceSerial = additionalServices.length > 0 ? 
                `${serialNo}.${additionalServices.length + 1}` : serialNo;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${mainServiceSerial}</td>
                <td>${serviceType}</td>
                <td>${sacCode}</td>
                <td>${qty}</td>
                <td>â‚¹${rate.toFixed(2)}</td>
                <td>${gstRate}%</td>
                <td>â‚¹${serviceGstAmount.toFixed(2)}</td>
                <td>â‚¹${serviceTotal.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
            
            serialNo++;
        });
    }
    
    // Update totals
    const total = subtotal + totalGst;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    
    document.getElementById('preview-subtotal').textContent = `â‚¹${subtotal.toFixed(2)}`;
    document.getElementById('preview-cgst').textContent = `â‚¹${cgst.toFixed(2)}`;
    document.getElementById('preview-sgst').textContent = `â‚¹${sgst.toFixed(2)}`;
    document.getElementById('preview-total').textContent = `â‚¹${total.toFixed(2)}`;
    
    // Update invoice number and date
    const today = new Date();
    const invoiceNumber = `${appData.businessSettings.invoicePrefix}-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(invoiceCounter).padStart(4, '0')}`;
    document.getElementById('preview-invoice-number').textContent = invoiceNumber;
    document.getElementById('preview-invoice-date').textContent = `Date: ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function generateInvoice() {
    // Validate form
    const customerMobile = document.getElementById('customer-mobile').value;
    const customerName = document.getElementById('customer-name').value;
    
    if (!customerMobile || customerMobile.length !== 10) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
    }
    
    if (!customerName) {
        showToast('Please enter customer name', 'error');
        return;
    }
    
    const serviceRows = document.querySelectorAll('.service-row');
    let hasServices = false;
    
    serviceRows.forEach(row => {
        if (row.querySelector('.service-type-select').value) {
            hasServices = true;
        }
    });
    
    if (!hasServices) {
        showToast('Please add at least one service', 'error');
        return;
    }
    
    // Check if customer exists
    let customer = appData.customers.find(c => c.mobile === customerMobile);
    
    if (customer) {
        // Check if name matches
        if (customer.name !== customerName) {
            if (!confirm(`A customer with mobile ${customerMobile} already exists with name "${customer.name}". Do you want to create a new entry?`)) {
                return;
            }
        }
    }
    
    // Create or update customer
    if (!customer) {
        customer = {
            id: 'CUST-' + Date.now(),
            mobile: customerMobile,
            name: customerName,
            email: document.getElementById('customer-email').value,
            gstin: document.getElementById('customer-gstin').value,
            address: document.getElementById('customer-address').value,
            createdAt: new Date().toISOString()
        };
        appData.customers.push(customer);
    }
    
    // Collect services
    const services = [];
    let subtotal = 0;
    let totalGst = 0;
    
    serviceRows.forEach(serviceRow => {
        const serviceType = serviceRow.querySelector('.service-type-select').value;
        if (!serviceType) return;
        
        const qty = parseFloat(serviceRow.querySelector('.service-qty').value) || 1;
        const rate = parseFloat(serviceRow.querySelector('.service-rate').value) || 0;
        const gstRate = parseFloat(serviceRow.querySelector('.service-gst').value) || 0;
        const sacCode = serviceRow.querySelector('.service-sac').value;
        
        const serviceSubtotal = qty * rate;
        const serviceGstAmount = (serviceSubtotal * gstRate) / 100;
        const serviceTotal = serviceSubtotal + serviceGstAmount;
        
        subtotal += serviceSubtotal;
        totalGst += serviceGstAmount;
        
        services.push({
            name: serviceType,
            sacCode: sacCode,
            qty: qty,
            rate: rate,
            gstRate: gstRate,
            gstAmount: serviceGstAmount,
            total: serviceTotal
        });
        
        // Add additional services
        const additionalServices = serviceRow.querySelectorAll('.additional-service');
        additionalServices.forEach(addService => {
            const addAmount = parseFloat(addService.querySelector('.add-service-amount').value) || 0;
            const addGstRate = parseFloat(addService.querySelector('.add-service-gst').value) || 0;
            const addSacCode = addService.querySelector('.add-service-sac').value;
            const addName = addService.querySelector('input[type="text"]').value;
            
            const addGstAmount = (addAmount * addGstRate) / 100;
            const addTotal = addAmount + addGstAmount;
            
            subtotal += addAmount;
            totalGst += addGstAmount;
            
            services.push({
                name: addName,
                sacCode: addSacCode,
                qty: 1,
                rate: addAmount,
                gstRate: addGstRate,
                gstAmount: addGstAmount,
                total: addTotal
            });
        });
    });
    
    // Create invoice
    const today = new Date();
    const invoiceNumber = `${appData.businessSettings.invoicePrefix}-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(invoiceCounter).padStart(4, '0')}`;
    
    const invoice = {
        id: 'INV-' + Date.now(),
        invoiceNumber: invoiceNumber,
        customerId: customer.id,
        customerName: customer.name,
        date: today.toISOString(),
        services: services,
        subtotal: subtotal,
        gstAmount: totalGst,
        total: subtotal + totalGst
    };
    
    appData.invoices.push(invoice);
    invoiceCounter++;
    
    showToast('Invoice generated successfully!', 'success');
    
    // Option to download PDF or create another
    if (confirm('Invoice created successfully! Would you like to download the PDF?')) {
        downloadInvoicePDF(invoice);
    }
    
    clearInvoiceForm();
    setupInvoiceForm();
}

function downloadInvoicePDF(invoice) {
    const element = document.getElementById('invoice-preview');
    
    const opt = {
        margin: 0.5,
        filename: `${invoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
    showToast('PDF download started', 'success');
}

function clearInvoiceForm() {
    document.getElementById('customer-mobile').value = '';
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-gstin').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('services-container').innerHTML = '';
    updateInvoicePreview();
}

// Reports Functions
function loadReportsData() {
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('report-from-date').value = firstDay.toISOString().split('T')[0];
    document.getElementById('report-to-date').value = lastDay.toISOString().split('T')[0];
    
    // Populate service filter
    const serviceFilter = document.getElementById('report-service-filter');
    serviceFilter.innerHTML = '<option value="all">All Services</option>';
    Object.keys(servicesData).forEach(service => {
        const option = document.createElement('option');
        option.value = service;
        option.textContent = service;
        serviceFilter.appendChild(option);
    });
    
    generateReport();
}

function generateReport() {
    const fromDate = new Date(document.getElementById('report-from-date').value);
    const toDate = new Date(document.getElementById('report-to-date').value);
    const serviceFilter = document.getElementById('report-service-filter').value;
    
    // Filter invoices by date range
    const filteredInvoices = appData.invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= fromDate && invoiceDate <= toDate;
    });
    
    // Calculate GST summary
    let totalSales = 0;
    let taxableAmount = 0;
    let totalGst = 0;
    
    filteredInvoices.forEach(invoice => {
        totalSales += invoice.total;
        taxableAmount += invoice.subtotal;
        totalGst += invoice.gstAmount;
    });
    
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    
    document.getElementById('report-total-sales').textContent = `â‚¹${totalSales.toFixed(2)}`;
    document.getElementById('report-taxable-amount').textContent = `â‚¹${taxableAmount.toFixed(2)}`;
    document.getElementById('report-cgst').textContent = `â‚¹${cgst.toFixed(2)}`;
    document.getElementById('report-sgst').textContent = `â‚¹${sgst.toFixed(2)}`;
    document.getElementById('report-total-gst').textContent = `â‚¹${totalGst.toFixed(2)}`;
    
    // Calculate service performance
    const servicePerformance = {};
    
    filteredInvoices.forEach(invoice => {
        invoice.services.forEach(service => {
            const serviceName = service.name;
            if (serviceFilter !== 'all' && serviceName !== serviceFilter) return;
            
            if (!servicePerformance[serviceName]) {
                servicePerformance[serviceName] = {
                    count: 0,
                    revenue: 0
                };
            }
            
            servicePerformance[serviceName].count++;
            servicePerformance[serviceName].revenue += service.total;
        });
    });
    
    // Display service performance
    const tbody = document.getElementById('service-performance-tbody');
    tbody.innerHTML = '';
    
    if (Object.keys(servicePerformance).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No data available for selected period</td></tr>';
    } else {
        Object.entries(servicePerformance).forEach(([serviceName, data]) => {
            const avg = data.revenue / data.count;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${serviceName}</td>
                <td>${data.count}</td>
                <td>â‚¹${data.revenue.toFixed(2)}</td>
                <td>â‚¹${avg.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

function exportGSTReport() {
    const fromDate = document.getElementById('report-from-date').value;
    const toDate = document.getElementById('report-to-date').value;
    
    const totalSales = document.getElementById('report-total-sales').textContent;
    const taxableAmount = document.getElementById('report-taxable-amount').textContent;
    const cgst = document.getElementById('report-cgst').textContent;
    const sgst = document.getElementById('report-sgst').textContent;
    const totalGst = document.getElementById('report-total-gst').textContent;
    
    const csvContent = `GST Report\n` +
        `Period: ${fromDate} to ${toDate}\n\n` +
        `Total Sales,${totalSales}\n` +
        `Taxable Amount,${taxableAmount}\n` +
        `CGST,${cgst}\n` +
        `SGST,${sgst}\n` +
        `Total GST,${totalGst}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST-Report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('GST Report exported successfully', 'success');
}

// Settings Functions
function loadBusinessSettings() {
    document.getElementById('business-name').value = appData.businessSettings.businessName;
    document.getElementById('business-gstin').value = appData.businessSettings.gstin;
    document.getElementById('business-email').value = appData.businessSettings.email;
    document.getElementById('business-phone').value = appData.businessSettings.phone;
    document.getElementById('business-address-settings').value = appData.businessSettings.address;
    document.getElementById('default-gst-rate').value = appData.businessSettings.defaultGstRate;
    document.getElementById('invoice-prefix').value = appData.businessSettings.invoicePrefix;
    document.getElementById('terms-conditions').value = appData.businessSettings.termsConditions;
}

function saveBusinessSettings() {
    appData.businessSettings = {
        businessName: document.getElementById('business-name').value,
        gstin: document.getElementById('business-gstin').value,
        email: document.getElementById('business-email').value,
        phone: document.getElementById('business-phone').value,
        address: document.getElementById('business-address-settings').value,
        defaultGstRate: parseInt(document.getElementById('default-gst-rate').value),
        invoicePrefix: document.getElementById('invoice-prefix').value,
        termsConditions: document.getElementById('terms-conditions').value
    };
    
    showToast('Settings saved successfully!', 'success');
    updateInvoicePreview();
}

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function viewInvoice(invoiceId) {
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        downloadInvoicePDF(invoice);
    }
}
>>>>>>> 2ad48b5612545f732002b138114c9ea645a26528
