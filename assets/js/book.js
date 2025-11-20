// assets/js/book.js
const CART_KEY = 'ihsan_cart';

function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch{ return []; } }
function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function updateCartBadge(){
  const n = getCart().reduce((s,x)=> s + (x.qty||0), 0);
  document.querySelectorAll('#cartCount').forEach(el=> el.textContent = n);
}
function addToCart(item, qty=1){
  const c = getCart();
  const i = c.findIndex(x => x.id === item.id);
  if (i >= 0) c[i].qty += qty; else c.push({ ...item, qty });
  setCart(c);
  updateCartBadge();
  alert('تمت الإضافة إلى السلة');
}
updateCartBadge();

// مينو الجوال
(function () {
  const toggleBtn = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  if (toggleBtn && menu) toggleBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
})();

function starsHtml(n){
  const full = Math.round(n || 0);
  return Array.from({length:5}, (_,i)=>`
    <svg class="w-5 h-5 ${i<full?'text-amber-500':'text-slate-300'}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`).join('');
}

(async function () {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if(!id){ location.href = 'books.html'; return; }

  // جلب تفاصيل الكتاب
  let book;
  try{
    const r = await fetch(`/api/books/${encodeURIComponent(id)}`);
    if(!r.ok){ document.body.innerHTML = 'الكتاب غير موجود'; return; }
    book = await r.json();
  }catch(_){
    document.body.innerHTML = 'تعذّر جلب الكتاب';
    return;
  }

  document.title = (book.title || 'كتاب') + ' | منصة عين الأصالة';

  // رأس الكتاب
  const header = document.getElementById('bookHeader');
  header.innerHTML = `
    <div class="md:col-span-1">
      <img src="${book.coverUrl || 'https://placehold.co/600x800/0d9488/ffffff?text=Book'}"
           class="w-full h-auto rounded-xl ring-1 ring-slate-200 object-cover" alt="${book.title||''}">
    </div>
    <div class="md:col-span-2">
      <h1 class="text-2xl md:text-3xl font-extrabold text-teal-800">${book.title||''}</h1>
      <div class="mt-1 text-slate-600">${book.author||''}</div>
      <div class="mt-3 flex items-center gap-2">
        <div class="inline-flex">${starsHtml(book?.rating?.avg)}</div>
        <div class="text-sm text-slate-600">(${book?.rating?.avg||0} من 5 — ${book?.rating?.count||0} تقييم)</div>
      </div>
      <div class="mt-4 flex items-center gap-4">
        <div class="text-amber-600 font-extrabold text-xl">${(book.price!=null)? (book.price+' د.أ') : ''}</div>
        <div class="inline-flex items-center gap-2">
          <label class="text-sm text-slate-600">الكمية</label>
          <input id="qty" type="number" min="1" value="1" class="w-20 rounded-lg border border-slate-300 px-3 py-2">
        </div>
        <button id="addBtn" class="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full px-5 py-2">أضف إلى السلة</button>
      </div>
    </div>
  `;

  document.getElementById('bookDesc').textContent = book.description || '—';

  // زر الإضافة للسلة - يتطلب تسجيل الدخول
  document.getElementById('addBtn').addEventListener('click', async ()=>{
    // التحقق من تسجيل الدخول - فقط عند الضغط على الزر
    try {
      if (firebase && firebase.auth) {
        let user = firebase.auth().currentUser;
        if (!user) {
          // Wait for auth to initialize (with timeout)
          await new Promise((resolve) => {
            const unsub = firebase.auth().onAuthStateChanged(() => {
              unsub();
              resolve();
            });
            setTimeout(resolve, 1000); // Timeout after 1 second
          });
          
          user = firebase.auth().currentUser;
          if (!user) {
            const shouldLogin = await showLoginPrompt({ 
              redirectUrl: location.pathname + location.search 
            });
            if (!shouldLogin) return;
            // If user confirms, redirect happens inside showLoginPrompt
            return;
          }
        }
      }
    } catch (err) {
      const shouldLogin = await showLoginPrompt({ 
        redirectUrl: location.pathname + location.search 
      });
      if (!shouldLogin) return;
      // If user confirms, redirect happens inside showLoginPrompt
      return;
    }
    
    const qty = Math.max(1, Number(document.getElementById('qty').value||1));
    addToCart({ id: book._id, title: book.title, price: book.price||0, coverUrl: book.coverUrl||'' }, qty);
  });

  // التقييمات
  const list = document.getElementById('reviewsList');
  const summary = document.getElementById('ratingSummary');

  async function loadReviews(){
    let reviews = [];
    try{
      const r = await fetch(`/api/books/${encodeURIComponent(id)}/reviews`);
      reviews = r.ok ? await r.json() : [];
    }catch(_){}
    list.innerHTML = reviews.length ? reviews.map(rv => `
      <div class="bg-white rounded-xl ring-1 ring-slate-200 p-4">
        <div class="flex items-center justify-between">
          <div class="font-bold text-slate-800">${rv.userName || 'مستخدم'}</div>
          <div class="inline-flex">${starsHtml(rv.rating)}</div>
        </div>
        <div class="mt-2 text-slate-700 whitespace-pre-line">${(rv.comment||'').toString()}</div>
        <div class="mt-1 text-xs text-slate-500">${new Date(rv.createdAt).toLocaleDateString('ar')}</div>
      </div>
    `).join('') : `<div class="text-slate-500">لا توجد تقييمات بعد.</div>`;

    // تحديث الملخّص
    try{
      const r2 = await fetch(`/api/books/${encodeURIComponent(id)}`);
      if(r2.ok){
        const b2 = await r2.json();
        summary.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="inline-flex">${starsHtml(b2?.rating?.avg)}</div>
            <div class="text-sm">${b2?.rating?.avg||0} من 5 — ${b2?.rating?.count||0} تقييم</div>
          </div>`;
      }
    }catch(_){}
  }

  // عناصر نموذج التقييم
  const reviewLoginNote = document.getElementById('reviewLoginNote');
  const reviewFormWrap = document.getElementById('reviewFormWrap');
  const ratingStars = document.getElementById('ratingStars');
  const reviewComment = document.getElementById('reviewComment');
  const saveReview = document.getElementById('saveReview');
  const reviewMsg = document.getElementById('reviewMsg');

  let selectedRating = 5;
  ratingStars.innerHTML = Array.from({length:5}, (_,i)=>`
    <button type="button" class="starBtn" data-v="${i+1}">
      <svg class="w-7 h-7 ${i<selectedRating?'text-amber-500':'text-slate-300'}" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    </button>`).join('');
  ratingStars.addEventListener('click', (e)=>{
    const btn = e.target.closest('.starBtn'); if(!btn) return;
    selectedRating = Number(btn.dataset.v||5);
    [...ratingStars.querySelectorAll('svg')].forEach((svg,idx)=>{
      svg.className = `w-7 h-7 ${idx<selectedRating?'text-amber-500':'text-slate-300'}`;
    });
  });

  // حالة الدخول لإظهار/إخفاء نموذج التقييم
  try{
    const me = await authFetch('/api/me');
    if(me.ok){
      reviewLoginNote.classList.add('hidden');
      reviewFormWrap.classList.remove('hidden');
    }else{
      reviewLoginNote.classList.remove('hidden');
      reviewFormWrap.classList.add('hidden');
    }
  }catch(_){
    reviewLoginNote.classList.remove('hidden');
    reviewFormWrap.classList.add('hidden');
  }

  // حفظ التقييم
  saveReview.addEventListener('click', async ()=>{
    reviewMsg.textContent = '';
    const res = await authFetch(`/api/books/${encodeURIComponent(id)}/reviews`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ rating: selectedRating, comment: reviewComment.value.trim() })
    });
    if(res.ok){
      reviewMsg.textContent = 'تم الحفظ';
      reviewMsg.className = 'ml-3 text-sm text-teal-700';
      reviewComment.value = '';
      loadReviews();
    }else{
      const err = await res.json().catch(()=>({error:'تعذر الحفظ'}));
      reviewMsg.textContent = err.error || 'تعذر الحفظ';
      reviewMsg.className = 'ml-3 text-sm text-rose-600';
    }
  });

  // حمّل التقييمات
  loadReviews();
})();
