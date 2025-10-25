// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBK8K0nIbc1DCj7kghQKYOLIhsB_3EvWQg",
  authDomain: "dreamharbour-billing.firebaseapp.com",
  projectId: "dreamharbour-billing",
  storageBucket: "dreamharbour-billing.appspot.com",
  messagingSenderId: "32291586019",
  appId: "1:32291586019:web:461035a507ad3f2dcfead6"
};

let auth, db, recaptchaVerifier, confirmationResult, currentUser = null;
const OWNER_PHONE = "9873329494";

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

// Initialize Firebase when page loads
window.addEventListener('DOMContentLoaded', () => {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  
  recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible'
  });
  
  initializeLogin();
});

function initializeLogin() {
  const loginContainer = document.getElementById('login-container');
  loginContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; height: 100vh; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; text-align: center;">
        <div style="width: 100px; height: 100px; margin-bottom: 30px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; padding: 20px;"></div>
        <h1 style="font-size: 2.5em; margin-bottom: 10px;">Dream Harbour</h1>
        <p style="font-size: 1.1em; opacity: 0.9;">Your Gateway to Professional Services</p>
      </div>
      
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 40px; background: white;">
        <h2 style="font-size: 1.8em; margin-bottom: 10px; color: #2c5aa0;">Welcome Back</h2>
        <p style="color: #666; margin-bottom: 40px;">Sign in to access your account</p>
        
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
            <small style="display: block; margin-top: 5px; color: #999;">For testing: Use 9999999999</small>
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
    confirmationResult = await auth.signInWithPhoneNumber(fullPhoneNumber, recaptchaVerifier);
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
    <div style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); min-height: 100vh;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
        <div>
          <h1 style="font-size: 2em; color: #2c5aa0; margin-bottom: 5px;">👑 Owner Dashboard</h1>
          <p style="color: #666;">Welcome, Owner (${currentUser.phoneNumber})</p>
        </div>
        <button onclick="logout()" style="padding: 10px 20px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Logout</button>
      </div>
      
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); border-left: 4px solid #2c5aa0;">
          <h3 style="font-size: 1.3em; color: #2c5aa0; margin-bottom: 20px;">📋 Create New User</h3>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">User Mobile Number</label>
            <input type="tel" id="newUserPhone" placeholder="Enter mobile number" style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px;" maxlength="10">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Assign Services</label>
            <div id="servicesCheckbox" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
              ${SERVICES.map(service => `
                <label style="display: flex; align-items: center; padding: 12px; background: #f9fafb; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; gap: 10px;">
                  <input type="checkbox" class="service-check" value="${service}" style="width: 18px; height: 18px; cursor: pointer; accent-color: #2c5aa0;">
                  <span>${service}</span>
                </label>
              `).join('')}
            </div>
          </div>
          
          <button onclick="createUser()" style="width: 100%; padding: 12px 20px; background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Create User</button>
          <div id="createUserMessage" style="margin-top: 15px;"></div>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); border-left: 4px solid #2c5aa0;">
          <h3 style="font-size: 1.3em; color: #2c5aa0; margin-bottom: 20px;">👥 Users List</h3>
          <div id="usersList" style="max-height: 400px; overflow-y: auto;"></div>
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
    
    await db.collection("users").add({
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
    const snapshot = await db.collection("users")
      .where("createdBy", "==", currentUser.phoneNumber)
      .get();
    
    if (snapshot.empty) {
      usersList.innerHTML = '<p>No users created yet</p>';
      return;
    }
    
    usersList.innerHTML = snapshot.docs.map(doc => {
      const user = doc.data();
      return `
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #4CAF50;">
          <h4 style="margin-bottom: 10px; color: #2c5aa0;">📱 ${user.phoneNumber}</h4>
          <p style="font-weight: 600;">Services:</p>
          <ul style="list-style: none; padding-left: 0; margin: 10px 0;">
            ${user.services.map(s => `<li style="padding: 5px 0; color: #666;">✓ ${s}</li>`).join('')}
          </ul>
          <small style="color: #999;">Created: ${user.createdAt.toDate().toLocaleDateString()}</small>
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
    <div style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); min-height: 100vh;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
        <div>
          <h1 style="font-size: 2em; color: #2c5aa0; margin-bottom: 5px;">📊 Dashboard</h1>
          <p style="color: #666;">Welcome, ${currentUser.phoneNumber}</p>
        </div>
        <button onclick="logout()" style="padding: 10px 20px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Logout</button>
      </div>
      
      <div style="max-width: 1200px; margin: 0 auto;">
        <h3>📋 Your Assigned Services</h3>
        <div id="userServices" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;"></div>
      </div>
    </div>
  `;
  
  loadUserServices();
}

async function loadUserServices() {
  const userServices = document.getElementById('userServices');
  
  try {
    const snapshot = await db.collection("users")
      .where("phoneNumber", "==", currentUser.phoneNumber.slice(-10))
      .get();
    
    if (snapshot.empty) {
      userServices.innerHTML = '<p>No services assigned yet</p>';
      return;
    }
    
    const user = snapshot.docs[0].data();
    userServices.innerHTML = user.services.map(service => `
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 5px 15px rgba(44, 90, 160, 0.2);">
        <h4 style="font-size: 1.1em; margin: 0;">✓ ${service}</h4>
      </div>
    `).join('');
  } catch (error) {
    console.error("Error loading services:", error);
  }
}

async function logout() {
  try {
    await auth.signOut();
    currentUser = null;
    initializeLogin();
  } catch (error) {
    console.error("Error logging out:", error);
  }
}
