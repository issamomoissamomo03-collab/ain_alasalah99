// assets/js/user-state.js
// يتطلب تحميل firebase-config.js و firebase-auth-compat.js قبله إذا الصفحة تحتاج
(function attachUserState() {
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
            await firebase.auth().signOut();
            location.reload();
          };
        } else {
          a.textContent = 'تسجيل الدخول';
          a.href = 'login.html';
          a.onclick = null;
        }
      });
    });
  })();
  