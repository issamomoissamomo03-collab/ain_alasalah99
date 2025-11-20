// assets/js/user-state.js
// يتطلب تحميل firebase-config.js و firebase-auth-compat.js قبله إذا الصفحة تحتاج

// Global logout function
window.logout = async function() {
  try {
    await firebase.auth().signOut();
    // Clear cart on logout (optional)
    try {
      localStorage.removeItem('ihsan_cart');
    } catch (e) {}
    // Redirect to home page
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Sign out error:', error);
    alert('حدث خطأ أثناء تسجيل الخروج. الرجاء المحاولة مرة أخرى.');
  }
};

(function attachUserState() {
    // Set up logout buttons
    function setupLogoutButtons() {
      const logoutButtons = document.querySelectorAll('#logoutBtn, #mobileLogout, #desktopLogoutBtn, button[data-logout], a[data-logout]');
      logoutButtons.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          await window.logout();
        });
      });
      
      // Set up desktop dropdown menu
      const desktopUserMenuBtn = document.getElementById('desktopUserMenuBtn');
      const desktopUserDropdown = document.getElementById('desktopUserDropdown');
      const desktopUserMenu = document.getElementById('desktopUserMenu');
      
      if (desktopUserMenuBtn && desktopUserDropdown) {
        desktopUserMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          desktopUserDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!desktopUserDropdown.classList.contains('hidden')) {
            if (!desktopUserMenu?.contains(e.target)) {
              desktopUserDropdown.classList.add('hidden');
            }
          }
        });
      }
    }
    
    const loginLinks = [...document.querySelectorAll('a[href="login.html"]')];
    // أضف زر تسجيل خروج بديل (ديناميكي) عندما يكون المستخدم مسجّل
    firebase.auth().onAuthStateChanged((user) => {
      // إظهار الاسم في أي مكان لو حاب
      // مثال سريع: تغيّر زر "تسجيل الدخول" إلى "تسجيل الخروج"
      loginLinks.forEach((a) => {
        if (user) {
          a.textContent = 'تسجيل الخروج';
          a.href = '#logout';
          a.onclick = async (e) => {
            e.preventDefault();
            await window.logout();
          };
        } else {
          a.textContent = 'تسجيل الدخول';
          a.href = 'login.html';
          a.onclick = null;
        }
      });
      
      // Set up logout buttons after auth state change
      setupLogoutButtons();
    });
    
    // Also set up on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupLogoutButtons);
    } else {
      setupLogoutButtons();
    }
  })();
  