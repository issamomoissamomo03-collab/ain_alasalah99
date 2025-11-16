// assets/js/cart.js
const CART_KEY = 'ihsan_cart';

function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch{ return []; } }
function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }

function addToCart(item, qty=1){
  const c = getCart();
  const i = c.findIndex(x => x.id === item.id);
  if(i>=0) c[i].qty += qty; else c.push({ ...item, qty });
  setCart(c);
  updateCartBadge();
}

function removeItem(id){ setCart(getCart().filter(x=>x.id!==id)); render(); }
function changeQty(id, delta){
  const c = getCart();
  const i = c.findIndex(x=>x.id===id);
  if(i>=0){ c[i].qty = Math.max(1, (c[i].qty||1)+delta); setCart(c); render(); }
}
function fmt(n){ return (Number(n)||0).toFixed(2)+' د.أ'; }

function updateCartBadge(){
  const n = getCart().reduce((s,x)=>s+(x.qty||0),0);
  document.querySelectorAll('#cartCount').forEach(el=> el.textContent = n);
}
updateCartBadge();

function render(){
  const wrap = document.getElementById('cartWrap');
  if(!wrap) return;

  const cart = getCart();
  if(!cart.length){ wrap.innerHTML = `<div class="text-center text-slate-500">سلتك فارغة.</div>`; return; }

  let total = 0;
  wrap.innerHTML = cart.map(i=>{
    const sub = (Number(i.price)||0) * (i.qty||1);
    total += sub;
    return `
      <div class="bg-white rounded-xl ring-1 ring-slate-200 p-4 flex items-center gap-4">
        <img src="${i.coverUrl || 'https://placehold.co/100x140/0d9488/ffffff?text=Book'}" class="w-20 h-28 object-cover rounded">
        <div class="flex-1">
          <div class="font-bold">${i.title||''}</div>
          <div class="text-sm text-slate-600 mt-1">${fmt(i.price)}</div>
          <div class="mt-2 flex items-center gap-2">
            <button class="px-2 py-1 rounded bg-slate-100" onclick="changeQty('${i.id}',-1)">-</button>
            <span>${i.qty||1}</span>
            <button class="px-2 py-1 rounded bg-slate-100" onclick="changeQty('${i.id}',1)">+</button>
            <button class="ml-4 text-rose-600 hover:underline" onclick="removeItem('${i.id}')">حذف</button>
          </div>
        </div>
        <div class="font-bold">${fmt(sub)}</div>
      </div>
    `;
  }).join('') + `
    <div class="bg-white rounded-xl ring-1 ring-slate-200 p-4 flex items-center justify-between">
      <div class="font-bold">المجموع</div>
      <div class="font-extrabold text-amber-600">${fmt(total)}</div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', render);

// زر إتمام الشراء
document.getElementById('checkoutBtn')?.addEventListener('click', async ()=>{
  const msg = document.getElementById('msg');
  const cart = getCart();
  if(!cart.length){ msg.textContent = 'سلتك فارغة.'; return; }

  // تأكد من الدخول (ننتظر جاهزية Auth)
  await new Promise(res => {
    const u = firebase.auth().currentUser;
    if (u) return res();
    const unsub = firebase.auth().onAuthStateChanged(()=>{unsub(); res();});
  });
  const user = firebase.auth().currentUser;
  if(!user){ msg.innerHTML = 'يجب تسجيل الدخول أولاً. <a class="underline" href="login.html">تسجيل الدخول</a>'; return; }

  // الملف الشخصي
  const p = await authFetch('/api/profile');
  if(!p.ok){ msg.textContent = 'تعذر قراءة البروفايل.'; return; }
  const prof = await p.json();
  if(!prof.phone || !prof.city || !prof.address){
    location.href = 'profile.html?next=cart';
    return;
  }

  // الطلب
  const items = cart.map(x => ({ id: x.id, qty: x.qty||1 })); // السيرفر يقبل id أو bookId
  const res = await authFetch('/api/orders', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ items })
  });
  if(!res.ok){
    const err = await res.json().catch(()=>({}));
    if(err.error === 'PROFILE_INCOMPLETE'){ location.href='profile.html?next=cart'; return; }
    msg.textContent = 'تعذر إنشاء الطلب.'; return;
  }

  // ✅ هنا التعديل المطلوب
  const data = await res.json();
  localStorage.removeItem(CART_KEY);         // فرّغ السلة
  updateCartBadge();                         // حدّث العداد
  location.href = 'order-success.html?code=' + encodeURIComponent(data.code || data.orderId);
});

// إتاحة الدوال للأزرار inline
window.changeQty = changeQty;
window.removeItem = removeItem;
