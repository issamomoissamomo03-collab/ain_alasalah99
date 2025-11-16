// assets/js/books.js

// نفس مفتاح السلة المستخدم في cart.js
const CART_KEY = 'ihsan_cart';
function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch{ return []; } }
function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function addToCart(item, qty=1){
  const c = getCart();
  const i = c.findIndex(x => x.id === item.id);
  if(i>=0) c[i].qty += qty; else c.push({...item, qty});
  setCart(c);
  updateCartBadge();
  alert('تمت إضافة الكتاب إلى السلة');
}
function updateCartBadge(){
  const n = getCart().reduce((s,x)=>s + (x.qty||0), 0);
  document.querySelectorAll('#cartCount').forEach(el=> el.textContent = n);
}
updateCartBadge();

// مينو الجوال
(function () {
  const toggleBtn = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
  }
})();

(async function renderBooks(){
  const grid = document.getElementById('booksGrid');
  if(!grid) return;
  let books=[];
  try{
    const res = await fetch('/api/books');
    books = res.ok ? await res.json() : [];
  }catch(_){}

  if(!books.length){
    grid.innerHTML = `<div class="text-center text-slate-500 col-span-full">لا توجد كتب متاحة حاليًا.</div>`;
    return;
  }

  grid.innerHTML = books.map(b => `
    <article class="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition">
      <a href="book.html?id=${encodeURIComponent(b._id)}">
        <img src="${b.coverUrl || 'https://placehold.co/600x800/0d9488/ffffff?text=Book'}" alt="${b.title||''}" class="w-full h-72 object-cover">
      </a>
      <div class="p-5">
        <h3 class="font-bold text-lg text-slate-800">
          <a href="book.html?id=${encodeURIComponent(b._id)}">${b.title||''}</a>
        </h3>
        <p class="mt-1 text-slate-600">${b.author||''}</p>
        <p class="mt-3 text-slate-600 line-clamp-2">${b.description || ''}</p>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-amber-600 font-extrabold">${(b.price!=null)? (b.price + ' د.أ') : ''}</span>
          <button class="addBtn text-white bg-amber-500 hover:bg-amber-600 font-semibold rounded-full px-4 py-2" 
                  data-id="${b._id}" data-title="${b.title||''}" data-price="${b.price||0}" 
                  data-cover="${b.coverUrl||''}">
            أضف إلى السلة
          </button>
        </div>
      </div>
    </article>
  `).join('');

  // لاحظ: هنا نستخدم .addBtn (كان عندك .addToCart بالغلط)
  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('.addBtn');
    if(!btn) return;
    addToCart({
      id: btn.dataset.id,
      title: btn.dataset.title,
      price: Number(btn.dataset.price || 0),
      coverUrl: btn.dataset.cover || ''
    }, 1);
  });
})();
