// assets/js/admin-login.js
(function () {
  const btn = document.getElementById('adminLoginBtn');
  const msg = document.getElementById('loginMsg');
  const params = new URLSearchParams(location.search);
  const next = params.get('next') || 'admin.html';
  const unauthorized = params.get('unauthorized');
  if (unauthorized) {
    msg.className = 'text-sm text-amber-700';
    msg.textContent = 'هذا الحساب لا يملك صلاحية الأدمن.';
  }

  firebase.auth().onAuthStateChanged(async (u) => {
    if (!u) return;
    try {
      const r = await authFetch('/api/me');
      if (!r.ok) throw new Error('ME_FAILED');
      const j = await r.json();
      if (j.role === 'admin') {
        location.href = next;
      } else {
        await firebase.auth().signOut();
        msg.className = 'text-sm text-rose-600';
        msg.textContent = 'لا تملك صلاحية الأدمن. تم تسجيل الخروج.';
      }
    } catch (e) {
      msg.className = 'text-sm text-rose-600';
      msg.textContent = 'تعذر التحقق من الصلاحيات.';
    }
  });

  btn?.addEventListener('click', async () => {
    msg.textContent = '';
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
      // الباقي سيتم في onAuthStateChanged
    } catch (e) {
      msg.className = 'text-sm text-rose-600';
      msg.textContent = 'فشل تسجيل الدخول.';
    }
  });
})();

