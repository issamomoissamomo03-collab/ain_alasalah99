// assets/js/auth.js

const alertBox = document.getElementById('alert');
function showAlert(msg, type = 'error') {
  alertBox.classList.remove('hidden');
  alertBox.textContent = msg;
  if (type === 'ok') {
    alertBox.className = 'mt-4 text-sm rounded-lg px-3 py-2 bg-teal-50 text-teal-800 ring-1 ring-teal-200';
  } else {
    alertBox.className = 'mt-4 text-sm rounded-lg px-3 py-2 bg-red-50 text-red-800 ring-1 ring-red-200';
  }
}

const email = document.getElementById('email');
const password = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const googleBtn = document.getElementById('googleBtn');
const resetBtn = document.getElementById('resetBtn');
const form = document.getElementById('authForm');

// تسجيل الدخول
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await auth.signInWithEmailAndPassword(email.value, password.value);
    showAlert('تم تسجيل الدخول بنجاح', 'ok');
    setTimeout(() => (location.href = 'index.html#home'), 700);
  } catch (err) {
    showAlert(err.message || 'فشل تسجيل الدخول');
  }
});

// إنشاء حساب
signupBtn.addEventListener('click', async () => {
  try {
    await auth.createUserWithEmailAndPassword(email.value, password.value);
    showAlert('تم إنشاء الحساب وتسجيل الدخول', 'ok');
    setTimeout(() => (location.href = 'index.html#home'), 700);
  } catch (err) {
    showAlert(err.message || 'فشل إنشاء الحساب');
  }
});

// Google
googleBtn.addEventListener('click', async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    showAlert('تم تسجيل الدخول عبر Google', 'ok');
    setTimeout(() => (location.href = 'index.html#home'), 700);
  } catch (err) {
    showAlert(err.message || 'تعذر تسجيل الدخول عبر Google');
  }
});

// إعادة تعيين كلمة المرور
resetBtn.addEventListener('click', async () => {
  if (!email.value) return showAlert('أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين');
  try {
    await auth.sendPasswordResetEmail(email.value);
    showAlert('تم إرسال رابط إعادة تعيين كلمة المرور لبريدك', 'ok');
  } catch (err) {
    showAlert(err.message || 'تعذر إرسال الرابط');
  }
});
