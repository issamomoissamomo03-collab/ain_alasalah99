// assets/js/profile.js
document.addEventListener('DOMContentLoaded', () => {

  // --- NEW: Header Dropdown Logic ---
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  
  userMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents the document click listener from firing immediately
    const isHidden = userDropdown.classList.contains('hidden');
    if (isHidden) {
      userDropdown.classList.remove('hidden');
      setTimeout(() => {
        userDropdown.classList.remove('opacity-0', 'scale-95');
      }, 10); // Start transition after display
    } else {
      userDropdown.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        userDropdown.classList.add('hidden');
      }, 300); // Wait for transition to end
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.classList.contains('hidden') && !userMenuBtn.contains(e.target)) {
        userDropdown.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
          userDropdown.classList.add('hidden');
        }, 300);
    }
  });


  // --- NEW: Logout Button Logic ---
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
      console.log('User signed out successfully.');
      // Redirect to login page after logout
      window.location.href = '/index.html';    }).catch((error) => {
      console.error('Sign out error:', error);
      alert('حدث خطأ أثناء تسجيل الخروج.');
    });
  });


  // --- Existing Profile Data Logic ---
  const nameEl = document.getElementById('name');
  const phoneEl = document.getElementById('phone');
  const cityEl = document.getElementById('city');
  const addressEl = document.getElementById('address');
  const landmarkEl = document.getElementById('landmark');
  const msgEl = document.getElementById('msg');

  // Load user data
  (async function () {
    const res = await authFetch('/api/profile');
    if (res.ok) {
      const d = await res.json();
      if(nameEl) nameEl.value = d.name || '';
      if(phoneEl) phoneEl.value = d.phone || '';
      if(cityEl) cityEl.value = d.city || '';
      if(addressEl) addressEl.value = d.address || '';
      if(landmarkEl) landmarkEl.value = d.landmark || '';
    } else {
      console.error('Failed to load profile data.');
      if(msgEl) msgEl.textContent = 'فشل تحميل البيانات. الرجاء تسجيل الدخول والمحاولة مرة أخرى.';
      if(msgEl) msgEl.className = 'text-sm text-red-600';
    }
  })();
  
  // Save user data
  document.getElementById('save')?.addEventListener('click', async () => {
    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const city = cityEl.value.trim();
    const address = addressEl.value.trim();
    const landmark = landmarkEl.value.trim();
  
    if(!name || !phone || !city || !address){
      if (msgEl) {
        msgEl.textContent = 'الرجاء إكمال الاسم والهاتف والمدينة والعنوان.';
        msgEl.className = 'text-sm text-red-600';
      }
      return;
    }
  
    const r = await authFetch('/api/profile', {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, phone, city, address, landmark })
    });
    
    if(!r.ok){
      if (msgEl) {
        msgEl.textContent = 'تعذّر الحفظ. الرجاء المحاولة مرة أخرى.';
        msgEl.className = 'text-sm text-red-600';
      }
      return;
    }
  
    if (msgEl) {
      msgEl.textContent = 'تم الحفظ بنجاح.';
      msgEl.className = 'text-sm text-green-600';
    }

    const next = new URLSearchParams(location.search).get('next');
    if(next === 'cart'){ 
      setTimeout(() => location.href = 'cart.html', 1000); 
    }
  });
  loadMyCourses(); // ✅ أضف هذا الاستدعاء

});
// assets/js/profile.js

// ✅ أضف هذه الدالة الجديدة في نهاية الملف
async function loadMyCourses() {
  const listEl = document.getElementById('myCoursesList');
  if (!listEl) return;

  try {
    const res = await authFetch('/api/my/courses');
    const courses = await res.json();

    if (courses.length === 0) {
      listEl.innerHTML = `<div class="bg-white text-center p-6 rounded-lg shadow-sm text-slate-500">أنت غير مشترك في أي دورة حاليًا.</div>`;
      return;
    }

    listEl.innerHTML = courses.map(c => `
      <div class="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition">
        <img src="${c.coverUrl || 'https://placehold.co/100x70/0d9488/fff'}" alt="${c.title}" class="w-24 h-16 object-cover rounded">
        <div class="flex-1">
          <h3 class="font-bold text-slate-800">${c.title}</h3>
          <p class="text-sm text-slate-500">${c.teacher}</p>
        </div>
        <a href="course-player.html?id=${c._id}" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-5 py-2 text-sm">
          ابدأ المشاهدة
        </a>
      </div>
    `).join('');
  } catch (e) {
    listEl.innerHTML = `<div class="bg-white text-center p-6 rounded-lg shadow-sm text-red-500">فشل تحميل دوراتك.</div>`;
  }
}