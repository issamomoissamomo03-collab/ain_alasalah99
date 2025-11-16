// assets/js/orders.js

(function initMobileMenu(){
    const t = document.getElementById('menuToggle'), m = document.getElementById('mobileMenu');
    if (t && m) t.addEventListener('click', ()=> m.classList.toggle('hidden'));
})();

// --- START: تعديلات شريط التقدم ---
const STATUS_ORDER = ['pending','confirmed','processing','shipped','delivered'];
const STATUS_LABELS = {
  pending:'قيد المراجعة', confirmed:'مؤكد', processing:'قيد التجهيز',
  paid:'مدفوع', shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي'
};

function badge(s){
  const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold';
  const map = {
    pending:'bg-slate-100 text-slate-700', confirmed:'bg-sky-100 text-sky-700',
    processing:'bg-indigo-100 text-indigo-700', paid:'bg-emerald-100 text-emerald-700',
    shipped:'bg-amber-100 text-amber-700', delivered:'bg-teal-100 text-teal-700',
    cancelled:'bg-rose-100 text-rose-700'
  };
  return `<span class="${base} ${map[s]||'bg-slate-100 text-slate-700'}">${STATUS_LABELS[s]||s}</span>`;
}

// دالة شريط التقدم الجديدة والاحترافية
function progress(currentStatus){
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  // إذا كان الطلب ملغي، لا تعرض شريط التقدم
  if (currentStatus === 'cancelled') {
    return '<div class="text-sm text-rose-600">تم إلغاء هذا الطلب.</div>';
  }

  let html = '<div class="flex justify-between items-start text-center">';
  STATUS_ORDER.forEach((status, i) => {
    const isActive = i <= currentIndex;
    const isDone = i < currentIndex;
    html += `
      <div class="flex-1 relative">
        <div class="flex flex-col items-center">
          <div class="w-6 h-6 rounded-full flex items-center justify-center
            ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-600'}">
            ${isDone ? `
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            ` : i + 1}
          </div>
          <p class="text-xs mt-1 font-semibold ${isActive ? 'text-teal-700' : 'text-slate-500'}">
            ${STATUS_LABELS[status]}
          </p>
        </div>
        ${i < STATUS_ORDER.length - 1 ? `
          <div class="absolute top-3 right-0 transform -translate-x-1/2 w-full h-0.5
            ${isDone ? 'bg-teal-600' : 'bg-slate-300'}"></div>
        ` : ''}
      </div>
    `;
  });
  html += '</div>';
  return html;
}
// --- END: تعديلات شريط التقدم ---

async function ensureSignedInOrRedirect() {
  await waitAuthReady();
  const u = firebase.auth().currentUser;
  if (!u) {
    const back = encodeURIComponent('orders.html');
    location.href = `login.html?next=${back}`;
    throw new Error('Not signed in');
  }
}

async function loadOrders(){
  try{
    await ensureSignedInOrRedirect();
    const res = await authFetch('/api/my/orders');
    if(!res.ok){ location.href='login.html'; return; }
    const rows = await res.json();

    const wrap = document.getElementById('ordersWrap');
    if(!rows.length){
      wrap.innerHTML = `<div class="text-center text-slate-500">لا توجد طلبات بعد.</div>`;
      return;
    }

    wrap.innerHTML = rows.map(o => {
      const items = o.items.map(i => `
        <div class="flex items-center gap-3">
          <img src="${i.coverUrl||'https://placehold.co/60x80/0d9488/fff'}" class="w-12 h-16 rounded object-cover" alt="">
          <div>
            <div class="font-bold text-slate-800">${i.title}</div>
            <div class="text-sm text-slate-600">${i.qty} × ${Number(i.price||0).toFixed(2)} د.أ</div>
          </div>
        </div>`).join('');

      return `
        <article class="bg-white rounded-xl ring-1 ring-slate-200 p-4 md:p-5">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div class="text-sm text-slate-600">
              <div class="font-bold text-slate-800">الطلب ${o.code || o._id}</div>
              <div>${new Date(o.createdAt).toLocaleString('ar')}</div>
            </div>
            <div class="flex items-center gap-3">
              ${badge(o.status)}
              ${o.tracking?.number ? `<a class="text-teal-700 underline" href="${o.tracking.url||'#'}" target="_blank" rel="noopener">تتبع الشحنة</a>`:''}
            </div>
          </div>

          <div class="mt-6 mb-4">${progress(o.status)}</div>
          <div class="border-t border-slate-200 pt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${items}</div>

          <div class="mt-4 flex items-center justify-between">
            <div class="font-extrabold text-teal-800">الإجمالي: ${Number(o.total||0).toFixed(2)} د.أ</div>
            <details class="text-sm text-right">
              <summary class="cursor-pointer text-slate-700">عنوان التسليم</summary>
              <div class="mt-2 text-slate-600">
                ${o.shipping?.name||''} — ${o.shipping?.phone||''}<br>
                ${o.shipping?.city||''}، ${o.shipping?.address||''}${o.shipping?.landmark? ' — ' + o.shipping.landmark : ''}
              </div>
            </details>
          </div>

          ${o.timeline?.length ? `
          <div class="mt-4 border-t pt-3">
            <details class="text-sm">
                <summary class="cursor-pointer text-slate-700 font-semibold">عرض سجل تحديثات الطلب</summary>
                <ol class="mt-2 space-y-1 text-sm text-slate-700 pr-2">
                  ${o.timeline.slice().reverse().map(t => `
                    <li>• ${new Date(t.at).toLocaleString('ar')} — ${STATUS_LABELS[t.status]||t.status}${t.message? ' — ' + t.message : ''}</li>
                  `).join('')}
                </ol>
            </details>
          </div>` : ''}
        </article>`;
    }).join('');

  }catch(e){
    if (e?.message === 'Not signed in') return;
    console.error(e);
  }
}

// أول تحميل + تحديث دوري
loadOrders();
setInterval(loadOrders, 15000);