// يجعل Auth جاهز مرة واحدة
async function waitAuthReady() {
  if (firebase.auth().currentUser !== null) return;
  await new Promise((resolve) => {
    const unsub = firebase.auth().onAuthStateChanged(() => { unsub(); resolve(); });
  });
}

// دالة fetch مع Firebase ID Token
async function authFetch(url, options = {}) {
  await waitAuthReady();
  const user = firebase.auth().currentUser;
  if (!user) throw new Error('Not signed in');

  const token = await user.getIdToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}

// (اختياري) نسخة لا ترمي خطأ
async function authFetchMaybe(url, options = {}) {
  try { return await authFetch(url, options); }
  catch (_) { return new Response(null, { status: 401 }); }
}

// متاح عالميًا
window.authFetch = authFetch;
window.authFetchMaybe = authFetchMaybe;
window.waitAuthReady = waitAuthReady;
