// assets/js/admin-orders.js

// نفس دوال المساعدة الموجودة في orders.js لعرض الحالة
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
  
  // دالة تحديث حالة الطلب
  async function updateStatus(orderId) {
      const select = document.getElementById(`status_${orderId}`);
      const newStatus = select.value;
      const btn = select.nextElementSibling; // زر التحديث
      btn.disabled = true;
      btn.textContent = 'جاري...';
  
      try {
          const res = await authFetch(`/api/admin/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus, message: `تم تحديث الحالة بواسطة الأدمن` })
          });
  
          if (!res.ok) {
              alert('فشل تحديث الطلب.');
          } else {
              // تحديث الواجهة مباشرة بعد النجاح
              const orderCard = document.getElementById(`order_${orderId}`);
              orderCard.querySelector('.status-badge-container').innerHTML = badge(newStatus);
          }
      } catch (e) {
          console.error(e);
          alert('حدث خطأ.');
      } finally {
          btn.disabled = false;
          btn.textContent = 'تحديث';
      }
  }
  
  
  async function loadAdminOrders() {
      await waitAuthReady();
      if (!firebase.auth().currentUser) {
          location.href = 'login.html?next=admin-orders.html';
          return;
      }
  
      try {
          const res = await authFetch('/api/admin/orders');
          if (res.status === 403) {
              document.getElementById('adminOrdersWrap').innerHTML = `<div class="text-center text-red-600">ليس لديك صلاحية الوصول لهذه الصفحة.</div>`;
              return;
          }
          if (!res.ok) throw new Error('Failed to fetch orders');
          
          const rows = await res.json();
          const wrap = document.getElementById('adminOrdersWrap');
          if (!rows.length) {
              wrap.innerHTML = `<div class="text-center text-slate-500">لا توجد طلبات لعرضها.</div>`;
              return;
          }
  
          const ALL_STATUSES = ['pending','confirmed','processing','paid','shipped','delivered','cancelled'];
  
          wrap.innerHTML = rows.map(o => `
              <article id="order_${o._id}" class="bg-white rounded-xl ring-1 ring-slate-200 p-4 md:p-5">
                  <div class="grid md:grid-cols-3 gap-4">
                      <div>
                          <div class="font-bold text-slate-800">الطلب ${o.code || o._id}</div>
                          <div class="text-sm text-slate-500">${new Date(o.createdAt).toLocaleString('ar')}</div>
                          <div class="mt-2 text-sm">
                              ${o.shipping?.name||''} — ${o.shipping?.phone||''}<br>
                              ${o.shipping?.city||''}، ${o.shipping?.address||''}
                          </div>
                      </div>
                      <div class="space-y-2">
                          ${o.items.map(i => `<div class="text-sm text-slate-700">${i.qty} x ${i.title}</div>`).join('')}
                          <div class="font-extrabold text-teal-800">الإجمالي: ${Number(o.total||0).toFixed(2)} د.أ</div>
                      </div>
                      <div>
                          <div class="font-bold text-sm mb-1">الحالة الحالية:</div>
                          <div class="status-badge-container">${badge(o.status)}</div>
  
                          <div class="mt-4">
                              <label for="status_${o._id}" class="font-bold text-sm">تغيير الحالة:</label>
                              <div class="flex items-center gap-2 mt-1">
                                  <select id="status_${o._id}" class="block w-full rounded-md border-gray-300 shadow-sm text-sm">
                                      ${ALL_STATUSES.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}
                                  </select>
                                  <button onclick="updateStatus('${o._id}')" class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-md px-4 py-2">تحديث</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </article>
          `).join('');
  
          // جعل الدالة متاحة للاستدعاء من HTML
          window.updateStatus = updateStatus;
  
      } catch (e) {
          console.error(e);
          document.getElementById('adminOrdersWrap').innerHTML = `<div class="text-center text-red-600">حدث خطأ أثناء تحميل الطلبات.</div>`;
      }
  }
  
  loadAdminOrders();
// assets/js/admin-orders.js

// نفس دوال المساعدة الموجودة في orders.js لعرض الحالة
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
  
  // دالة تحديث حالة الطلب
  async function updateStatus(orderId) {
      const select = document.getElementById(`status_${orderId}`);
      const newStatus = select.value;
      const btn = select.nextElementSibling; // زر التحديث
      btn.disabled = true;
      btn.textContent = 'جاري...';
  
      try {
          const res = await authFetch(`/api/admin/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus, message: `تم تحديث الحالة بواسطة الأدمن` })
          });
  
          if (!res.ok) {
              alert('فشل تحديث الطلب.');
          } else {
              // تحديث الواجهة مباشرة بعد النجاح
              const orderCard = document.getElementById(`order_${orderId}`);
              orderCard.querySelector('.status-badge-container').innerHTML = badge(newStatus);
          }
      } catch (e) {
          console.error(e);
          alert('حدث خطأ.');
      } finally {
          btn.disabled = false;
          btn.textContent = 'تحديث';
      }
  }
  
  
  async function loadAdminOrders() {
      await waitAuthReady();
      if (!firebase.auth().currentUser) {
          location.href = 'login.html?next=admin-orders.html';
          return;
      }
  
      try {
          const res = await authFetch('/api/admin/orders');
          if (res.status === 403) {
              document.getElementById('adminOrdersWrap').innerHTML = `<div class="text-center text-red-600">ليس لديك صلاحية الوصول لهذه الصفحة.</div>`;
              return;
          }
          if (!res.ok) throw new Error('Failed to fetch orders');
          
          const rows = await res.json();
          const wrap = document.getElementById('adminOrdersWrap');
          if (!rows.length) {
              wrap.innerHTML = `<div class="text-center text-slate-500">لا توجد طلبات لعرضها.</div>`;
              return;
          }
  
          const ALL_STATUSES = ['pending','confirmed','processing','paid','shipped','delivered','cancelled'];
  
          wrap.innerHTML = rows.map(o => `
              <article id="order_${o._id}" class="bg-white rounded-xl ring-1 ring-slate-200 p-4 md:p-5">
                  <div class="grid md:grid-cols-3 gap-4">
                      <div>
                          <div class="font-bold text-slate-800">الطلب ${o.code || o._id}</div>
                          <div class="text-sm text-slate-500">${new Date(o.createdAt).toLocaleString('ar')}</div>
                          <div class="mt-2 text-sm">
                              ${o.shipping?.name||''} — ${o.shipping?.phone||''}<br>
                              ${o.shipping?.city||''}، ${o.shipping?.address||''}
                          </div>
                      </div>
                      <div class="space-y-2">
                          ${o.items.map(i => `<div class="text-sm text-slate-700">${i.qty} x ${i.title}</div>`).join('')}
                          <div class="font-extrabold text-teal-800">الإجمالي: ${Number(o.total||0).toFixed(2)} ر.س</div>
                      </div>
                      <div>
                          <div class="font-bold text-sm mb-1">الحالة الحالية:</div>
                          <div class="status-badge-container">${badge(o.status)}</div>
  
                          <div class="mt-4">
                              <label for="status_${o._id}" class="font-bold text-sm">تغيير الحالة:</label>
                              <div class="flex items-center gap-2 mt-1">
                                  <select id="status_${o._id}" class="block w-full rounded-md border-gray-300 shadow-sm text-sm">
                                      ${ALL_STATUSES.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}
                                  </select>
                                  <button onclick="updateStatus('${o._id}')" class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-md px-4 py-2">تحديث</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </article>
          `).join('');
  
          // جعل الدالة متاحة للاستدعاء من HTML
          window.updateStatus = updateStatus;
  
      } catch (e) {
          console.error(e);
          document.getElementById('adminOrdersWrap').innerHTML = `<div class="text-center text-red-600">حدث خطأ أثناء تحميل الطلبات.</div>`;
      }
  }
  
  loadAdminOrders();