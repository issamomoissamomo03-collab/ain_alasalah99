// assets/js/admin.js
// assets/js/admin.js

// ✅ دالة مساعدة جديدة لعرض الرسائل الأنيقة
function showToast(text, type = 'success') {
  Toastify({
      text: text,
      duration: 3000,
      close: true,
      gravity: "top", // `top` or `bottom`
      position: "left", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
      },
  }).showToast();
}

/**********************
* الإعداد العام
**********************/
// ... باقي الكود
/**********************
 * الإعداد العام
 **********************/
const ENABLE_UPLOADS = true; // ← مهم: الرفع مُعطّل مؤقتًا

function qs(id){ return document.getElementById(id); }
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function setActiveSection(id){
  $all('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.target===id));
  $all('.section').forEach(s=>s.classList.toggle('active', s.id===id));
}
$all('.navbtn').forEach(b=>b.addEventListener('click', e=>{
  e.preventDefault();
  setActiveSection(b.dataset.target);
}));

/**********************
 * رفع الملف (معطّل مؤقتًا)
 * يرجع رابط من خانة الـ URL فقط
 **********************/
/**********************
 * رفع الملفات إلى Firebase Storage
 **********************/
// assets/js/admin.js

async function uploadIfNeeded(fileInputId, urlInputId, pathPrefix) {
  const fileEl = qs(fileInputId);
  const urlEl = qs(urlInputId);
  const url = urlEl?.value?.trim();

  if (url) {
      return url;
  }

  const file = fileEl?.files?.[0];

  if (file && ENABLE_UPLOADS) {
      // ✅ تم استبدال alert برسالة toast
      showToast(`جاري رفع الملف: ${file.name}`, 'info'); // يمكنك تغيير النوع إذا أردت لونًا مختلفًا

      try {
          const storageRef = firebase.storage().ref();
          const filePath = `${pathPrefix}/${Date.now()}-${file.name}`;
          const fileRef = storageRef.child(filePath);

          const uploadTask = await fileRef.put(file);
          const downloadURL = await uploadTask.ref.getDownloadURL();

          fileEl.value = ''; 

          // ✅ تم استبدال alert برسالة toast
          showToast('تم رفع الملف بنجاح!');
          return downloadURL;

      } catch (error) {
          console.error("Upload failed:", error);
          // ✅ تم استبدال alert برسالة toast
          showToast(`فشل رفع الملف: ${error.message}`, 'error');
          return '';
      }
  }
  return '';
}

/**********************
 * بوابة الأذونات (Gate)
 **********************/
const gate = qs('gate');
const adminApp = document.getElementById('adminApp');
firebase.auth().onAuthStateChanged(async (u)=>{
  if(!u){
    try { await firebase.auth().signOut(); } catch(_){}
    location.href = 'admin-login.html?next=admin.html';
    return;
  }
  qs('adminUser').textContent = u.displayName || u.email || u.uid;

  try{
    const r = await authFetch('/api/me');
    if(!r.ok){
      throw new Error('ME_FAILED');
    }
    const j = await r.json();
    if(j.role !== 'admin'){
      try { await firebase.auth().signOut(); } catch(_){}
      location.href = 'admin-login.html?unauthorized=1';
      return;
    }
    gate.classList.add('hidden');
    if (adminApp) adminApp.style.display = '';
    // assets/js/admin.js
await Promise.all([loadCourses(), loadBooks(), loadArticles(), loadConsults(), loadAdminOrders(), loadEnrollments(), loadBooksIntoSelect()]);  }catch(e){
    gate.classList.remove('hidden');
    if (adminApp) adminApp.style.display = 'none';
  }
});

qs('loginGoogle')?.addEventListener('click', async ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  await firebase.auth().signInWithPopup(provider);
});
qs('logout')?.addEventListener('click', async ()=>{
  await firebase.auth().signOut();
  location.reload();
});

async function loadBooksIntoSelect() {
  const selectEl = qs('c_giftBook');
  if (!selectEl) return;
  
  const res = await authFetch('/api/admin/books');
  const books = await res.json();
  
  selectEl.innerHTML = `
    <option value="">-- لا يوجد كتاب هدية --</option>
    ${books.map(b => `<option value="${b._id}">${b.title}</option>`).join('')}
  `;
}


/**********************
 * COURSES
 **********************/
async function loadCourses(){
  const r = await authFetch('/api/admin/courses');
  const rows = await r.json();
  const tb = qs('tblCourses').querySelector('tbody');
  tb.innerHTML = rows.map(c=>`
    <tr data-id="${c._id}">
      <td>${c.coverUrl ? `<img src="${c.coverUrl}" class="w-20 h-14 object-cover rounded">` : ''}</td>
      <td>${c.title||''}<div class="hint">${c.description||''}</div></td>
      <td>${c.teacher||''}</td>
      <td>${c.price??0}</td>
      <td class="space-x-1 space-x-reverse">
        <button class="btn-fill px-2 py-1 bg-slate-700 text-white rounded text-xs" data-act="fill">ملء النموذج</button>
        <button class="px-2 py-1 bg-rose-600 text-white rounded text-xs" data-act="del">حذف</button>
      </td>
    </tr>
  `).join('');
  tb.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.closest('tr').dataset.id;
      if(btn.dataset.act==='del'){
        if(!confirm('حذف الكورس؟')) return;
        await authFetch(`/api/admin/courses/${id}`, {method:'DELETE'});
        await loadCourses();
      }else if(btn.dataset.act==='fill'){
        const c = rows.find(x=>x._id===id);
        qs('c_id').value = c._id;
        qs('c_title').value = c.title||'';
        qs('c_teacher').value = c.teacher||'';
        qs('c_price').value = c.price||'';
        qs('c_desc').value = c.description||'';
        qs('c_cover_url').value = c.coverUrl||'';
        qs('c_giftBook').value = c.giftBookId || ''; // <-- السطر الجديد
        setActiveSection('sec-courses');
      }
    });
  });
}

qs('createCourse')?.addEventListener('click', async ()=>{
  const body = {
    title: qs('c_title').value.trim(),
    teacher: qs('c_teacher').value.trim(),
    price: Number(qs('c_price').value||0),
    description: qs('c_desc').value.trim(),
    coverUrl: await uploadIfNeeded('c_cover_file','c_cover_url','covers'),
    giftBookId: qs('c_giftBook').value || null // <-- السطر الجديد
  };
  if(!body.title) return alert('العنوان مطلوب');
  const r = await authFetch('/api/admin/courses', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  });
  const j = await r.json();
  qs('createCourseMsg').textContent = 'تم: '+JSON.stringify(j);
  await loadCourses();
});

qs('updateCourse')?.addEventListener('click', async ()=>{
  const id = qs('c_id').value.trim();
  if(!id) return alert('_id مطلوب للتحديث');
  const body = {
    title: qs('c_title').value.trim(),
    teacher: qs('c_teacher').value.trim(),
    price: Number(qs('c_price').value||0),
    description: qs('c_desc').value.trim(),
    giftBookId: qs('c_giftBook').value || null // <-- السطر الجديد
  };
  const coverUrl = await uploadIfNeeded('c_cover_file','c_cover_url','covers');
  if(coverUrl) body.coverUrl = coverUrl;
  const r = await authFetch(`/api/admin/courses/${id}`, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  });
  const j = await r.json();
  qs('createCourseMsg').textContent = 'تم التحديث: '+JSON.stringify(j);
  await loadCourses();
});

/**********************
 * LESSONS
 **********************/
qs('createLesson')?.addEventListener('click', async ()=>{
  const courseId = qs('l_courseId').value.trim();
  const urlOnly = qs('l_video_url').value.trim();
  const body = {
    title: qs('l_title').value.trim(),
    // بما أن الرفع مُعطّل، سنأخذ فقط من خانة الرابط
    videoUrl: urlOnly || await uploadIfNeeded('l_video_file','l_video_url','videos'),
    isPreview: qs('l_isPreview').checked,
    order: Number(qs('l_order').value||0),
  };
  if(!courseId || !body.title) return alert('courseId + العنوان مطلوبان');
  if(!body.videoUrl) return alert('ضع رابط فيديو (YouTube/MP4 عام/أي CDN) — الرفع مُعطّل مؤقتًا');

  const r = await authFetch(`/api/admin/courses/${courseId}/lessons`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  });
  const j = await r.json();
  qs('createLessonMsg').textContent = 'تم: '+JSON.stringify(j);
});

// assets/js/admin.js

qs('loadLessons')?.addEventListener('click', async () => {
  const id = qs('lq_courseId').value.trim();
  if (!id) return;

  const tb = qs('tblLessons').querySelector('tbody');
  const btn = qs('loadLessons');

  // ✅ الخطوة 1: إظهار حالة التحميل
  btn.disabled = true;
  btn.textContent = 'جاري التحميل...';
  tb.innerHTML = `<tr><td colspan="5" class="text-center text-slate-500">جاري تحميل الدروس...</td></tr>`;

  try {
      const r = await authFetch(`/api/admin/courses/${id}/lessons`);
      const rows = await r.json();

      if (rows.length === 0) {
          tb.innerHTML = `<tr><td colspan="5" class="text-center text-slate-500">لا توجد دروس لهذا الكورس.</td></tr>`;
      } else {
          tb.innerHTML = rows.map(l => `
              <tr data-id="${l._id}">
                  <td>${l.title}</td>
                  <td>${l.isPreview ? '✔︎' : ''}</td>
                  <td>${l.order ?? 0}</td>
                  <td><a class="text-teal-700 underline" href="${l.videoUrl}" target="_blank">فتح</a></td>
                  <td><button class="px-2 py-1 bg-rose-600 text-white rounded text-xs" data-act="del">حذف</button></td>
              </tr>
          `).join('');

          tb.querySelectorAll('button[data-act="del"]').forEach(btn => {
              btn.addEventListener('click', async () => {
                  const lid = btn.closest('tr').dataset.id;
                  if (!confirm('حذف الدرس؟')) return;
                  await authFetch(`/api/admin/lessons/${lid}`, { method: 'DELETE' });
                  qs('loadLessons').click(); // Refresh list after delete
              });
          });
      }
  } catch (e) {
      // معالجة الخطأ
      tb.innerHTML = `<tr><td colspan="5" class="text-center text-red-500">فشل تحميل الدروس.</td></tr>`;
  } finally {
      // ✅ الخطوة 2: إعادة الزر لحالته الطبيعية بعد انتهاء العملية
      btn.disabled = false;
      btn.textContent = 'تحميل';
  }
});
/**********************
 * BOOKS
 **********************/
async function loadBooks(){
  const r = await authFetch('/api/admin/books');
  const rows = await r.json();
  const tb = qs('tblBooks').querySelector('tbody');
  tb.innerHTML = rows.map(b=>`
    <tr data-id="${b._id}">
      <td>${b.coverUrl?`<img src="${b.coverUrl}" class="w-16 h-20 object-cover rounded">`:''}</td>
      <td>${b.title||''}<div class="hint">${b.author||''}</div></td>
      <td>${b.price??0}</td>
      <td>${b.fileUrl?`<a class="text-teal-700 underline" href="${b.fileUrl}" target="_blank">ملف</a>`:''}</td>
      <td>
        <button class="btn-fill px-2 py-1 bg-slate-700 text-white rounded text-xs" data-act="fill">ملء</button>
        <button class="px-2 py-1 bg-rose-600 text-white rounded text-xs" data-act="del">حذف</button>
      </td>
    </tr>
  `).join('');
  tb.querySelectorAll('button').forEach(btn=>{
    const id = btn.closest('tr').dataset.id;
    btn.addEventListener('click', async ()=>{
      if(btn.dataset.act==='del'){
        if(!confirm('حذف الكتاب؟')) return;
        await authFetch(`/api/admin/books/${id}`, {method:'DELETE'});
        await loadBooks();
      } else {
        const b = rows.find(x=>x._id===id);
        qs('b_id').value = b._id;
        qs('b_title').value = b.title||'';
        qs('b_author').value = b.author||'';
        qs('b_price').value = b.price||'';
        qs('b_desc').value = b.description||'';
        qs('b_cover_url').value = b.coverUrl||'';
        qs('b_file_url').value = b.fileUrl||'';
        setActiveSection('sec-books');
      }
    });
  });
}

qs('createBook')?.addEventListener('click', async ()=>{
  const body = {
    title: qs('b_title').value.trim(),
    author: qs('b_author').value.trim(),
    price: Number(qs('b_price').value||0),
    description: qs('b_desc').value.trim(),
    coverUrl: await uploadIfNeeded('b_cover_file','b_cover_url','book-covers'),
    fileUrl:  await uploadIfNeeded('b_file_file','b_file_url','book-files'),
  };
  if(!body.title) return alert('العنوان مطلوب');
  // fileUrl اختياري الآن
  const r = await authFetch('/api/admin/books', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  });
  qs('createBookMsg').textContent = 'تم';
  await loadBooks();
});

qs('updateBook')?.addEventListener('click', async ()=>{
  const id = qs('b_id').value.trim();
  if(!id) return alert('_id مطلوب للتحديث');
  const body = {
    title: qs('b_title').value.trim(),
    author: qs('b_author').value.trim(),
    price: Number(qs('b_price').value||0),
    description: qs('b_desc').value.trim(),
  };
  const cover = await uploadIfNeeded('b_cover_file','b_cover_url','book-covers');
  const file  = await uploadIfNeeded('b_file_file','b_file_url','book-files');
  if(cover) body.coverUrl = cover;
  if(file)  body.fileUrl = file;
  const r = await authFetch(`/api/admin/books/${id}`, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  });
  qs('createBookMsg').textContent = 'تم التحديث';
  await loadBooks();
});

/**********************
 * ARTICLES
 **********************/
async function loadArticles(){
  const r = await authFetch('/api/admin/articles');
  const rows = await r.json();
  const tb = qs('tblArticles').querySelector('tbody');
  tb.innerHTML = rows.map(a=>`
    <tr data-id="${a._id}">
      <td>${a.title}</td>
      <td>${a.isPublished?'✔︎':''}</td>
      <td>${a.publishedAt? new Date(a.publishedAt).toLocaleString() : ''}</td>
      <td class="space-x-1 space-x-reverse">
        <button class="px-2 py-1 bg-slate-700 text-white rounded text-xs" data-act="fill">ملء</button>
        <button class="px-2 py-1 bg-amber-600 text-white rounded text-xs" data-act="pub">${a.isPublished?'إلغاء نشر':'نشر'}</button>
        <button class="px-2 py-1 bg-rose-600 text-white rounded text-xs" data-act="del">حذف</button>
      </td>
    </tr>
  `).join('');
  tb.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.closest('tr').dataset.id;
      if(btn.dataset.act==='fill'){
        const r = rows.find(x=>x._id===id);
        qs('a_id').value = r._id; qs('a_title').value = r.title; qs('a_body').value = r.body||'';qs('a_cover_url').value = r.coverUrl||''; // <-- أضف هذا
        setActiveSection('sec-articles');
      } else if(btn.dataset.act==='pub'){
        await authFetch(`/api/admin/articles/${id}/${rows.find(x=>x._id===id).isPublished?'unpublish':'publish'}`, {method:'POST'});
        await loadArticles();
      } else if(btn.dataset.act==='del'){
        if(!confirm('حذف المقال؟')) return;
        await authFetch(`/api/admin/articles/${id}`, {method:'DELETE'});
        await loadArticles();
      }
    });
  });
}

qs('createArticle')?.addEventListener('click', async ()=>{
  const body = {
    title: qs('a_title').value.trim(),
    body: qs('a_body').value.trim(),
    coverUrl: await uploadIfNeeded('a_cover_file', 'a_cover_url', 'article-covers')
  };
  if(!body.title || !body.body) return alert('العنوان والنص مطلوبان');
  await authFetch('/api/admin/articles', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  qs('createArticleMsg').textContent = 'تم حفظ المقال الجديد';
  await loadArticles();
});
qs('updateArticle')?.addEventListener('click', async ()=>{
  const id = qs('a_id').value.trim();
  if(!id) return alert('_id مطلوب للتحديث');
  const body = {
    title: qs('a_title').value.trim(),
    body: qs('a_body').value.trim()
  };
  // Handle the cover image upload separately
  const coverUrl = await uploadIfNeeded('a_cover_file', 'a_cover_url', 'article-covers');
  if (coverUrl) {
    body.coverUrl = coverUrl;
  }
  await authFetch(`/api/admin/articles/${id}`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  qs('createArticleMsg').textContent = 'تم تحديث المقال';
  await loadArticles();
});

/**********************
 * ORDERS (New Section)
 **********************/
const ORDER_STATUS_LABELS = { pending:'قيد المراجعة', confirmed:'مؤكد', processing:'قيد التجهيز', paid:'مدفوع', shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي' };

function orderBadge(s){
    const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold';
    const map = { pending:'bg-slate-100 text-slate-700', confirmed:'bg-sky-100 text-sky-700', processing:'bg-indigo-100 text-indigo-700', paid:'bg-emerald-100 text-emerald-700', shipped:'bg-amber-100 text-amber-700', delivered:'bg-teal-100 text-teal-700', cancelled:'bg-rose-100 text-rose-700' };
    return `<span class="${base} ${map[s]||'bg-slate-100'}">${ORDER_STATUS_LABELS[s]||s}</span>`;
}

async function updateStatus(orderId) {
    const select = qs(`status_${orderId}`);
    const newStatus = select.value;
    const btn = select.nextElementSibling;
    btn.disabled = true; btn.textContent = 'جاري...';
    try {
        await authFetch(`/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, message: `تم تحديث الحالة` })
        });
        qs(`order_${orderId}`).querySelector('.status-badge-container').innerHTML = orderBadge(newStatus);
    } catch (e) { alert('فشل تحديث الطلب.'); } finally { btn.disabled = false; btn.textContent = 'تحديث'; }
}
window.updateStatus = updateStatus; // Make it globally accessible

async function loadAdminOrders() {
    try {
        const res = await authFetch('/api/admin/orders');
        const rows = await res.json();
        const wrap = qs('adminOrdersWrap');
        if (!rows.length) { wrap.innerHTML = `<div class="text-center text-slate-500">لا توجد طلبات لعرضها.</div>`; return; }

        const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS);
        wrap.innerHTML = rows.map(o => `
            <article id="order_${o._id}" class="bg-white rounded-xl ring-1 ring-slate-200 p-4 md:p-5">
                <div class="grid md:grid-cols-3 gap-4 items-start">
                    <div><div class="font-bold text-slate-800">الطلب ${o.code || o._id.slice(-6)}</div><div class="text-sm text-slate-500">${new Date(o.createdAt).toLocaleString('ar')}</div><div class="mt-2 text-sm">${o.shipping?.name||''} — ${o.shipping?.phone||''}<br>${o.shipping?.city||''}، ${o.shipping?.address||''}</div></div>
                    <div class="space-y-2">${o.items.map(i => `<div class="text-sm text-slate-700">${i.qty} x ${i.title}</div>`).join('')}<div class="font-extrabold text-teal-800">الإجمالي: ${Number(o.total||0).toFixed(2)} د.أ</div></div>
                    <div><div class="font-bold text-sm mb-1">الحالة الحالية:</div><div class="status-badge-container">${orderBadge(o.status)}</div><div class="mt-4"><label for="status_${o._id}" class="font-bold text-sm">تغيير الحالة:</label><div class="flex items-center gap-2 mt-1"><select id="status_${o._id}" class="block w-full rounded-md border-gray-300 shadow-sm text-sm">${ALL_STATUSES.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${ORDER_STATUS_LABELS[s]}</option>`).join('')}</select><button onclick="updateStatus('${o._id}')" class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-md px-4 py-2 shrink-0">تحديث</button></div></div></div>
                </div>
            </article>
        `).join('');
    } catch (e) { qs('adminOrdersWrap').innerHTML = `<div class="text-center text-red-600">حدث خطأ أثناء تحميل الطلبات.</div>`; }
}
/**********************
 * CONSULTATIONS
 **********************/
// ===== NEW CONSULTATIONS/CHAT SYSTEM =====
const consultsListDiv = qs('consultsList');
const chatViewDiv = qs('chatView');
let currentOpenChatId = null;

// Render a single conversation in the admin chat view
function renderAdminChat(consultation) {
    chatViewDiv.innerHTML = `
        <div class="p-3 border-b border-slate-200">
            <h4 class="font-bold">${consultation.userName || 'مستخدم'}</h4>
            <div class="text-xs text-slate-500">${consultation.userEmail || consultation.userUid}</div>
        </div>
        <div id="adminChatMessages" class="flex-grow p-4 space-y-2 overflow-y-auto flex flex-col">
            ${consultation.messages.map(msg => `
                <div class="rounded-lg px-3 py-2 max-w-[85%] text-sm
                    ${msg.sender === 'user' ? 'bg-slate-100 self-start' : 'bg-teal-100 self-end'}">
                    ${msg.text}
                    <div class="text-xs text-slate-400 mt-1 text-left">${new Date(msg.at).toLocaleTimeString('ar')}</div>
                </div>
            `).join('')}
        </div>
        <div class="p-3 border-t border-slate-200">
            <form id="adminReplyForm" class="flex items-center gap-2">
                <input id="adminReplyInput" type="text" placeholder="اكتب ردك هنا..." class="flex-grow w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-full text-sm" autocomplete="off">
                <button type="submit" class="flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white rounded-full p-2">إرسال</button>
            </form>
        </div>
    `;

    const messagesDiv = qs('adminChatMessages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    qs('adminReplyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = qs('adminReplyInput');
        const message = input.value.trim();
        if (!message) return;

        input.disabled = true;
        try {
            const res = await authFetch(`/api/admin/consultations/${consultation._id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            const updatedConsultation = await res.json();
            renderAdminChat(updatedConsultation);
        } catch (err) {
            console.error('Failed to send reply:', err);
            alert('فشل إرسال الرد.');
            input.disabled = false;
        }
    });
}

// Show a specific conversation when clicked from the list
async function showConversation(consultationId) {
    currentOpenChatId = consultationId;
    $all('.consult-item').forEach(item => {
        item.classList.toggle('bg-teal-50', item.dataset.id === consultationId);
    });

    chatViewDiv.innerHTML = `<div class="p-4 text-center text-slate-500">جاري تحميل المحادثة...</div>`;
    try {
        const res = await authFetch(`/api/admin/consultations/${consultationId}`);
        const consultation = await res.json();
        renderAdminChat(consultation);
    } catch (e) {
        chatViewDiv.innerHTML = `<div class="p-4 text-center text-red-500">فشل تحميل المحادثة.</div>`;
    }
}
window.showConversation = showConversation; // Make it accessible from HTML onclick

// Load the list of all conversations
async function loadConsults() {
    try {
        const res = await authFetch('/api/admin/consultations');
        const rows = await res.json();
        
        if (!rows.length) {
            consultsListDiv.innerHTML = `<div class="text-sm text-slate-500">لا توجد رسائل بعد.</div>`;
            return;
        }

        consultsListDiv.innerHTML = rows.map(c => {
            const lastMessage = c.messages[c.messages.length - 1];
            return `
                <button onclick="showConversation('${c._id}')" data-id="${c._id}"
                        class="consult-item w-full text-right p-3 rounded-lg hover:bg-teal-50 transition">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-sm">${c.userName || 'مستخدم'}</span>
                        ${c.status === 'pending_reply' ? '<span class="text-xs bg-amber-500 text-white font-semibold px-2 py-0.5 rounded-full">بانتظار الرد</span>' : ''}
                    </div>
                    <p class="text-xs text-slate-600 truncate mt-1">
                        ${lastMessage ? lastMessage.text : 'لا توجد رسائل'}
                    </p>
                    <div class="text-xs text-slate-400 mt-1">${new Date(c.updatedAt).toLocaleString('ar')}</div>
                </button>
            `;
        }).join('');

        if (currentOpenChatId) {
            showConversation(currentOpenChatId);
        }

    } catch (e) {
        consultsListDiv.innerHTML = `<div class="text-sm text-red-500">فشل تحميل الرسائل.</div>`;
    }
}
 /**********************
     * ARTICLE COMMENTS
     **********************/
 qs('loadComments')?.addEventListener('click', async () => {
    const articleId = qs('ac_articleId').value.trim();
    if (!articleId) return;
    const tb = qs('tblComments').querySelector('tbody');
    tb.innerHTML = `<tr><td colspan="4">جاري التحميل...</td></tr>`;
    try {
        const res = await authFetch(`/api/admin/articles/${articleId}/comments`);
        const comments = await res.json();
        if (!comments.length) {
            tb.innerHTML = `<tr><td colspan="4" class="text-center">لا توجد تعليقات لهذا المقال.</td></tr>`;
            return;
        }
        tb.innerHTML = comments.map(c => `
            <tr data-id="${c._id}">
                <td>${c.userName || c.userUid.slice(-6)}</td>
                <td class="w-1/2">${c.comment}</td>
                <td>${new Date(c.createdAt).toLocaleDateString('ar')}</td>
                <td><button onclick="deleteComment('${articleId}', '${c._id}')" class="px-2 py-1 bg-rose-600 text-white rounded text-xs">حذف</button></td>
            </tr>
        `).join('');
    } catch (e) {
         tb.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">فشل تحميل التعليقات.</td></tr>`;
    }
});

async function deleteComment(articleId, commentId) {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    try {
        await authFetch(`/api/admin/articles/${articleId}/comments/${commentId}`, { method: 'DELETE' });
        qs('loadComments').click(); // Refresh list
    } catch (e) {
        alert('فشل حذف التعليق.');
    }
}

async function handleEnrollmentAction(enrollmentId, action) {
  if (!confirm(`Are you sure you want to ${action} this request?`)) return;
  try {
    await authFetch(`/api/admin/enrollments/${enrollmentId}/${action}`, { method: 'POST' });
    await loadEnrollments(); // Refresh the list
  } catch (e) {
    alert(`Failed to ${action} enrollment.`);
  }
}
window.handleEnrollmentAction = handleEnrollmentAction;

async function loadEnrollments() {
  try {
    const res = await authFetch('/api/admin/enrollments');
    const enrollments = await res.json();
    const tb = qs('tblEnrollments').querySelector('tbody');

    if (!enrollments.length) {
      tb.innerHTML = `<tr><td colspan="6" class="text-center">لا توجد طلبات تسجيل حاليًا.</td></tr>`;
      return;
    }

    tb.innerHTML = enrollments.map(e => `
      <tr class="
        ${e.status === 'approved' ? 'bg-green-50' : ''}
        ${e.status === 'rejected' ? 'bg-red-50' : ''}
      ">
        <td>${e.userName}<div class="hint">${e.userEmail}</div></td>
        <td>${e.courseTitle}</td>
        <td>${e.price} د.أ</td>
        <td>${new Date(e.createdAt).toLocaleDateString('ar')}</td>
        <td><span class="font-bold">${e.status}</span></td>
        <td class="space-x-1 space-x-reverse">
          ${e.status === 'pending' ? `
            <button onclick="handleEnrollmentAction('${e._id}', 'approve')" class="px-2 py-1 bg-green-600 text-white rounded text-xs">موافقة</button>
            <button onclick="handleEnrollmentAction('${e._id}', 'reject')" class="px-2 py-1 bg-rose-600 text-white rounded text-xs">رفض</button>
          ` : `<span>-</span>`}
        </td>
      </tr>
    `).join('');
  } catch(e) {
    console.error("Failed to load enrollments", e);
  }
}
window.deleteComment = deleteComment;
// assets/js/admin.js

// assets/js/admin.js -> NEW ANNOUNCEMENT SYSTEM
/**********************
 * LIVE ANNOUNCEMENTS
 **********************/
const annId = qs('ann_id');
const annText = qs('ann_text');
const annLink = qs('ann_link');
const annDuration = qs('ann_duration');
const annMsg = qs('announcementMsg');
const annTblBody = qs('tblAnnouncements')?.querySelector('tbody');

function clearAnnForm() {
  annId.value = '';
  annText.value = '';
  annLink.value = '';
  annDuration.value = '';
  annMsg.textContent = '';
  qs('saveAnnouncement').textContent = 'حفظ الإعلان';
}
qs('clearAnnForm')?.addEventListener('click', clearAnnForm);

async function loadAnnouncements() {
  if (!annTblBody) return;
  const res = await authFetch('/api/admin/announcements');
  const announcements = await res.json();
  annTblBody.innerHTML = announcements.map(a => `
    <tr data-id="${a._id}" class="${!a.isActive ? 'opacity-50' : ''}">
      <td>${a.text} ${a.link ? '(رابط)' : ''}</td>
      <td><label class="inline-flex items-center gap-2"><input type="checkbox" onchange="toggleAnnStatus('${a._id}', this.checked)" ${a.isActive ? 'checked' : ''}> فعال</label></td>
      <td>${a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('ar') : '—'}</td>
      <td class="space-x-1 space-x-reverse">
        <button onclick="fillAnnForm('${a._id}')" class="px-2 py-1 bg-slate-700 text-white rounded text-xs">تعديل</button>
        <button onclick="deleteAnnouncement('${a._id}')" class="px-2 py-1 bg-rose-600 text-white rounded text-xs">حذف</button>
      </td>
    </tr>
  `).join('');
  window.announcementsData = announcements; // Store data globally for easy access
}

window.fillAnnForm = (id) => {
  const ann = window.announcementsData.find(a => a._id === id);
  if (!ann) return;
  annId.value = ann._id;
  annText.value = ann.text;
  annLink.value = ann.link || '';
  annDuration.value = '';
  qs('saveAnnouncement').textContent = 'تحديث الإعلان';
  annText.focus();
};

qs('saveAnnouncement')?.addEventListener('click', async () => {
  const id = annId.value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/announcements/${id}` : '/api/admin/announcements';
  const body = {
    text: annText.value.trim(),
    link: annLink.value.trim(),
    durationHours: annDuration.value ? Number(annDuration.value) : null,
    isActive: true
  };
  if (!body.text) return alert('النص إجباري');

  await authFetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
  annMsg.textContent = id ? 'تم التحديث بنجاح' : 'تم الحفظ بنجاح';
  clearAnnForm();
  loadAnnouncements();
});

window.deleteAnnouncement = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
  await authFetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
  loadAnnouncements();
};

window.toggleAnnStatus = async (id, isActive) => {
  const ann = window.announcementsData.find(a => a._id === id);
  const body = { text: ann.text, link: ann.link, isActive };
  await authFetch(`/api/admin/announcements/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
  loadAnnouncements();
};

// في قائمة Promise.all، استبدل loadCurrentAnnouncement بـ loadAnnouncements
// ...

/**********************
 * USERS (Admin only)
 **********************/
async function loadUsers() {
  const tb = qs('tblUsers')?.querySelector('tbody');
  if (!tb) return;
  const res = await authFetch('/api/admin/users');
  const users = await res.json();
  tb.innerHTML = users.map(u => `
    <tr data-email="${u.email||''}">
      <td>${u.displayName || '—'}</td>
      <td>${u.email || '—'}</td>
      <td><span class="font-semibold ${u.role==='admin'?'text-teal-700':'text-slate-700'}">${u.role||'user'}</span></td>
      <td class="space-x-1 space-x-reverse">
        ${(u.email && u.email.includes('@')) ? (
          u.role === 'admin'
            ? `<button class="px-2 py-1 bg-slate-600 text-white rounded text-xs" data-role="user">إرجاع لمستخدم</button>`
            : `<button class="px-2 py-1 bg-amber-600 text-white rounded text-xs" data-role="admin">ترقية لأدمن</button>`
        ) : `<span class="text-xs text-slate-400">لا بريد صالح</span>`}
      </td>
    </tr>
  `).join('');
  tb.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const email = btn.closest('tr').dataset.email;
      if(!email || !email.includes('@')){ alert('لا يمكن تغيير الدور بدون بريد صالح.'); return; }
      const role = btn.dataset.role;
      if (!confirm(`تأكيد تعيين الدور (${role}) للحساب:\n${email}`)) return;
      await authFetch('/api/admin/users/set-role', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, role })
      });
      await loadUsers();
    });
  });
}

// تحميل المستخدمين عند فتح القسم
$('[data-target="sec-users"]')?.addEventListener('click', ()=> setTimeout(loadUsers, 0));

/**********************
 * FEATURED VIDEO
 **********************/
async function loadFeaturedVideos() {
  try {
    const res = await authFetch('/api/admin/featured-video');
    const videos = await res.json();
    const tbody = qs('tblFeaturedVideos')?.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = videos.map(v => `
      <tr>
        <td>${v.title || 'آخر التحديثات'}</td>
        <td>${v.videoType === 'youtube' ? 'YouTube' : 'رفع'}</td>
        <td>${v.isActive ? '<span class="text-green-600">نشط</span>' : '<span class="text-slate-400">غير نشط</span>'}</td>
        <td>${new Date(v.createdAt).toLocaleDateString('ar')}</td>
        <td>
          <button onclick="editFeaturedVideo('${v._id}')" class="text-blue-600 hover:underline">تعديل</button>
          <button onclick="deleteFeaturedVideo('${v._id}')" class="text-red-600 hover:underline mr-2">حذف</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Failed to load featured videos:', e);
  }
}

async function editFeaturedVideo(id) {
  try {
    const res = await authFetch('/api/admin/featured-video');
    const videos = await res.json();
    const video = videos.find(v => v._id === id);
    if (!video) return;
    
    qs('fv_id').value = id;
    qs('fv_title').value = video.title || 'آخر التحديثات';
    qs('fv_description').value = video.description || '';
    qs('fv_video_url').value = video.videoUrl || '';
    qs('fv_thumbnail_url').value = video.thumbnailUrl || '';
    qs('fv_isActive').checked = video.isActive !== false;
    
    showToast('تم تحميل بيانات الفيديو');
  } catch (e) {
    showToast('فشل تحميل بيانات الفيديو', 'error');
  }
}

async function deleteFeaturedVideo(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
  try {
    await authFetch(`/api/admin/featured-video/${id}`, { method: 'DELETE' });
    showToast('تم حذف الفيديو');
    await loadFeaturedVideos();
  } catch (e) {
    showToast('فشل حذف الفيديو', 'error');
  }
}

qs('createFeaturedVideo')?.addEventListener('click', async () => {
  try {
    const title = qs('fv_title').value.trim() || 'آخر التحديثات';
    const description = qs('fv_description').value.trim();
    const videoUrl = qs('fv_video_url').value.trim();
    const thumbnailUrl = qs('fv_thumbnail_url').value.trim();
    const isActive = qs('fv_isActive').checked;
    
    let finalVideoUrl = videoUrl;
    let videoType = 'youtube';
    
    // Check if YouTube URL
    if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
      videoType = 'youtube';
      finalVideoUrl = videoUrl;
    } else if (qs('fv_video_file').files.length > 0) {
      // Upload video file
      finalVideoUrl = await uploadIfNeeded('fv_video_file', 'fv_video_url', 'featured-videos');
      videoType = 'upload';
    } else if (!videoUrl) {
      return showToast('يرجى إدخال رابط فيديو أو رفع ملف', 'error');
    }
    
    let finalThumbnailUrl = thumbnailUrl;
    if (qs('fv_thumbnail_file').files.length > 0) {
      finalThumbnailUrl = await uploadIfNeeded('fv_thumbnail_file', 'fv_thumbnail_url', 'thumbnails');
    }
    
    const body = {
      title,
      description,
      videoUrl: finalVideoUrl,
      videoType,
      thumbnailUrl: finalThumbnailUrl,
      isActive
    };
    
    const res = await authFetch('/api/admin/featured-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const result = await res.json();
    showToast('تم حفظ الفيديو بنجاح');
    qs('featuredVideoMsg').textContent = 'تم: ' + JSON.stringify(result);
    
    // Clear form
    qs('fv_id').value = '';
    qs('fv_title').value = 'آخر التحديثات';
    qs('fv_description').value = '';
    qs('fv_video_url').value = '';
    qs('fv_thumbnail_url').value = '';
    qs('fv_video_file').value = '';
    qs('fv_thumbnail_file').value = '';
    qs('fv_isActive').checked = true;
    
    await loadFeaturedVideos();
  } catch (e) {
    showToast('فشل حفظ الفيديو', 'error');
    console.error(e);
  }
});

qs('updateFeaturedVideo')?.addEventListener('click', async () => {
  const id = qs('fv_id').value.trim();
  if (!id) return showToast('يرجى اختيار فيديو للتعديل', 'error');
  
  try {
    const title = qs('fv_title').value.trim() || 'آخر التحديثات';
    const description = qs('fv_description').value.trim();
    let videoUrl = qs('fv_video_url').value.trim();
    let thumbnailUrl = qs('fv_thumbnail_url').value.trim();
    const isActive = qs('fv_isActive').checked;
    
    let videoType = 'youtube';
    
    // Check if YouTube URL
    if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
      videoType = 'youtube';
    } else if (qs('fv_video_file').files.length > 0) {
      videoUrl = await uploadIfNeeded('fv_video_file', 'fv_video_url', 'featured-videos');
      videoType = 'upload';
    }
    
    if (qs('fv_thumbnail_file').files.length > 0) {
      thumbnailUrl = await uploadIfNeeded('fv_thumbnail_file', 'fv_thumbnail_url', 'thumbnails');
    }
    
    const body = {
      title,
      description,
      videoUrl,
      videoType,
      thumbnailUrl,
      isActive
    };
    
    const res = await authFetch(`/api/admin/featured-video/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const result = await res.json();
    showToast('تم تحديث الفيديو بنجاح');
    qs('featuredVideoMsg').textContent = 'تم: ' + JSON.stringify(result);
    
    // Clear form
    qs('fv_id').value = '';
    qs('fv_title').value = 'آخر التحديثات';
    qs('fv_description').value = '';
    qs('fv_video_url').value = '';
    qs('fv_thumbnail_url').value = '';
    qs('fv_video_file').value = '';
    qs('fv_thumbnail_file').value = '';
    qs('fv_isActive').checked = true;
    
    await loadFeaturedVideos();
  } catch (e) {
    showToast('فشل تحديث الفيديو', 'error');
    console.error(e);
  }
});

$('[data-target="sec-featured-video"]')?.addEventListener('click', () => setTimeout(loadFeaturedVideos, 0));