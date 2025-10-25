import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";

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

let recaptchaVerifier;
let confirmationResult;
let currentUser = null;
const OWNER_PHONE = "9873329494";

const SERVICES = [
  { name: "Photostat/Copy Services", icon: "📋" },
  { name: "Adhaar Pan Linking", icon: "🔗" },
  { name: "Registration Fees", icon: "📝" },
  { name: "Driving Licence", icon: "🚗" },
  { name: "E-Stamping", icon: "📄" },
  { name: "Jamabandi", icon: "🗂️" },
  { name: "Nepal Money Transfer", icon: "💰" },
  { name: "Online Certificates", icon: "🎓" },
  { name: "Online Internet Services", icon: "📱" },
  { name: "Pan Card & Others", icon: "💳" },
  { name: "Printing Services", icon: "🖨️" },
  { name: "Affidavit/Application", icon: "📋" },
  { name: "Deed Writing", icon: "✍️" }
];

function initializeLogin() {
  const loginContainer = document.getElementById('login-container');
  loginContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; height: 100vh; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; text-align: center;">
        <div style="width: 80px; height: 80px; margin-bottom: 30px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;"></div>
        <h1 style="font-size: 2.5em; margin-bottom: 10px;">Dream Harbour</h1>
        <p style="font-size: 1.1em; opacity: 0.9;">Your Gateway to Professional Services</p>
      </div>
      
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 40px; background: white;">
        <h2 style="font-size: 1.8em; margin-bottom: 10px; color: #2c5aa0;">Welcome Back</h2>
        <p style="color: #666; margin-bottom: 40px;">Sign in to access your dashboard</p>
        
        <div style="width: 100%; max-width: 400px;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Country</label>
            <select id="countrySelect" style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1em;">
              <option value="+91">🇮🇳 India (+91)</option>
              <option value="+971">🇦🇪 UAE (+971)</option>
              <option value="+1">🇺🇸 USA (+1)</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Phone Number</label>
            <input type="tel" id="phoneInput" placeholder="Enter 10 digit mobile number" style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1em;" maxlength="10">
            <small style="display: block; margin-top: 5px; color: #999;">Test: 9999999999 | Owner: 9873329494</small>
          </div>
          
          <button onclick="sendOTP()" style="width: 100%; padding: 12px 20px; background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; margin-top: 10px;">Send OTP</button>
          
          <div id="otpContainer" style="display: none; margin-top: 20px;">
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Enter OTP</label>
              <input type="text" id="otpInput" placeholder="Enter 6-digit OTP" style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1em;" maxlength="6">
              <small style="display: block; margin-top: 5px; color: #999;">Test OTP: 123456</small>
            </div>
            <button onclick="verifyOTP()" style="width: 100%; padding: 12px 20px; background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer;">Verify OTP</button>
            <button onclick="resendOTP()" style="width: 100%; padding: 12px 20px; background: #f0f0f0; color: #333; border: 1px solid #ddd; border-radius: 8px; font-size: 1em; cursor: pointer; margin-top: 10px;">Resend OTP</button>
          </div>
          
          <div id="statusMessage" style="margin-top: 15px; text-align: center;"></div>
        </div>
      </div>
    </div>
  `;
  
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
}

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

async function resendOTP() {
  await sendOTP();
}

function showOwnerDashboard() {
  document.getElementById('login-container').innerHTML = `
    <div style="display: grid; grid-template-columns: 250px 1fr; min-height: 100vh;">
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); padding: 20px; color: white; overflow-y: auto;">
        <h2 style="margin: 0 0 20px 0;">👑 Owner Panel</h2>
        <p style="font-size: 0.9em; margin-bottom: 20px;">Welcome, Owner!</p>
        <button onclick="logout()" style="width: 100%; padding: 10px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Logout</button>
      </div>
      
      <div style="padding: 30px; background: #f9fafb; overflow-y: auto;">
        <h1 style="color: #2c5aa0; margin-bottom: 30px;">👑 Owner Dashboard - Create Users</h1>
        
        <div style="max-width: 1000px;">
          <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <h3 style="color: #2c5aa0; margin-top: 0;">📋 Create New User</h3>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">User Mobile Number</label>
              <input type="tel" id="newUserPhone" placeholder="Enter mobile number" style="width: 100%; max-width: 400px; padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px;" maxlength="10">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Assign Services</label>
              <div id="servicesCheckbox" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                ${SERVICES.map(s => `
                  <label style="display: flex; align-items: center; padding: 10px; background: #f9fafb; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; gap: 8px;">
                    <input type="checkbox" class="service-check" value="${s.name}" style="width: 16px; height: 16px; cursor: pointer;">
                    <span>${s.icon} ${s.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            
            <button onclick="createUser()" style="padding: 12px 25px; background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1em;">Create User</button>
            <div id="createUserMessage" style="margin-top: 15px;"></div>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <h3 style="color: #2c5aa0; margin-top: 0;">👥 Users List</h3>
            <div id="usersList" style="max-height: 500px; overflow-y: auto;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  loadUsersList();
}

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
    
    setTimeout(loadUsersList, 1000);
  } catch (error) {
    console.error("Error creating user:", error);
    message.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
  }
}

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
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0 0 10px 0; color: #2c5aa0;">📱 ${user.phoneNumber}</h4>
          <p style="font-weight: 600; margin: 8px 0;">Services:</p>
          <ul style="list-style: none; padding: 0; margin: 5px 0;">
            ${user.services.map(s => `<li style="padding: 3px 0; color: #666;">✓ ${s}</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Error loading users:", error);
    usersList.innerHTML = `<p style="color: red;">Error loading users</p>`;
  }
}

function showUserDashboard() {
  document.getElementById('login-container').innerHTML = `
    <div style="display: grid; grid-template-columns: 250px 1fr; min-height: 100vh;">
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); padding: 20px; color: white; overflow-y: auto;">
        <h2 style="margin: 0 0 20px 0; font-size: 1.3em;">Dream Harbour</h2>
        <p style="font-size: 0.9em; margin-bottom: 30px; opacity: 0.8;">Your Gateway to Professional Services</p>
        
        ${SERVICES.map(s => `
          <div style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer; font-size: 0.9em;">
            ${s.icon} ${s.name}
          </div>
        `).join('')}
        
        <button onclick="logout()" style="width: 100%; padding: 10px; margin-top: 30px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Logout</button>
      </div>
      
      <div style="padding: 30px; background: white; overflow-y: auto;">
        <h1 style="color: #2c5aa0; margin-top: 0;">📊 Dashboard</h1>
        <h3>Your Assigned Services:</h3>
        <div id="userServices" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;"></div>
      </div>
    </div>
  `;
  
  loadUserServices();
}

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
    const assignedServices = SERVICES.filter(s => user.services.includes(s.name));
    
    userServices.innerHTML = assignedServices.map(s => `
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 5px 15px rgba(44,90,160,0.2);">
        <div style="font-size: 2.5em; margin-bottom: 10px;">${s.icon}</div>
        <h4 style="margin: 0; font-size: 1em;">${s.name}</h4>
      </div>
    `).join('');
  } catch (error) {
    console.error("Error loading services:", error);
  }
}

async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    initializeLogin();
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initializeLogin();
});
