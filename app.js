// Firebase configuration - NO imports needed!
const firebaseConfig = {
  apiKey: "AIzaSyBK8K0nIbc1DCj7kghQKYOLIhsB_3EvWQg",
  authDomain: "dreamharbour-billing.firebaseapp.com",
  projectId: "dreamharbour-billing",
  storageBucket: "dreamharbour-billing.appspot.com",
  messagingSenderId: "32291586019",
  appId: "1:32291586019:web:461035a507ad3f2dcfead6"
};

let auth, recaptchaVerifier, confirmationResult, currentUser = null;
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

window.addEventListener('DOMContentLoaded', () => {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  
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
        <div style="width: 80px; height: 80px; margin-bottom: 30px; background: rgba(255,255,255,0.2); border-radius: 50%;"></div>
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
    console.error("Error:", error);
    statusMessage.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
  }
}

async function verifyOTP() {
  const otpInput = document.getElementById('otpInput').value;
  const statusMessage = document.getElementById('statusMessage');
  
  if (!otpInput || otpInput.length !== 6) {
    statusMessage.innerHTML = '<p style="color: red;">❌ Please enter valid 6-digit OTP</p>';
    return;
  }
  
  try {
    statusMessage.innerHTML = '<p style="color: blue;">⏳ Verifying...</p>';
    const result = await confirmationResult.confirm(otpInput);
    currentUser = result.user;
    
    if (currentUser.phoneNumber.includes(OWNER_PHONE)) {
      showOwnerDashboard();
    } else {
      showUserDashboard();
    }
  } catch (error) {
    console.error("Error:", error);
    statusMessage.innerHTML = `<p style="color: red;">❌ Invalid OTP</p>`;
  }
}

async function resendOTP() {
  await sendOTP();
}

function showOwnerDashboard() {
  document.getElementById('login-container').innerHTML = `
    <div style="display: grid; grid-template-columns: 250px 1fr; min-height: 100vh;">
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); padding: 20px; color: white;">
        <h2 style="margin: 0 0 20px 0;">👑 Owner Panel</h2>
        <p style="font-size: 0.9em; margin-bottom: 20px;">Welcome, Owner! (9${currentUser.phoneNumber.slice(-10)})</p>
        <button onclick="logout()" style="width: 100%; padding: 10px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Logout</button>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h1 style="color: #2c5aa0;">👑 Owner Dashboard</h1>
        <p style="color: green; font-size: 1.1em;">✅ Owner access granted!</p>
        <p>User creation feature coming soon (requires billing enabled)</p>
      </div>
    </div>
  `;
}

function showUserDashboard() {
  document.getElementById('login-container').innerHTML = `
    <div style="display: grid; grid-template-columns: 250px 1fr; min-height: 100vh;">
      <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a5f 100%); padding: 20px; color: white; overflow-y: auto;">
        <h2 style="margin: 0 0 20px 0; font-size: 1.3em;">Dream Harbour</h2>
        <p style="font-size: 0.9em; margin-bottom: 30px; opacity: 0.8;">Professional Services</p>
        ${SERVICES.map(s => `<div style="padding: 10px; margin-bottom: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 0.9em;">${s.icon} ${s.name}</div>`).join('')}
        <button onclick="logout()" style="width: 100%; padding: 10px; margin-top: 30px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Logout</button>
      </div>
      <div style="padding: 30px; background: white;">
        <h1 style="color: #2c5aa0; margin-top: 0;">📊 Dashboard</h1>
        <p style="color: green; font-size: 1.1em;">✅ Welcome! (9${currentUser.phoneNumber.slice(-10)})</p>
        <p>Your services will be displayed here once assigned by owner.</p>
      </div>
    </div>
  `;
}

async function logout() {
  try {
    await auth.signOut();
    currentUser = null;
    initializeLogin();
  } catch (error) {
    console.error("Error:", error);
  }
}
