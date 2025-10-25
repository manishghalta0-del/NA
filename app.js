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
  initializeLogin();
});