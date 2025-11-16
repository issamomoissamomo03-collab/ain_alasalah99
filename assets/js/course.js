// assets/js/course.js -> ✅ هذا هو الكود الصحيح لهذا الملف

(function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  if (toggleBtn && menu) toggleBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
})();

// =========================
// حوار تأكيد احترافي (Tailwind)
// يعيد Promise<boolean>
// =========================
async function showConfirmDialog(options) {
  const { title = 'تأكيد', messageHtml = '', confirmText = 'تأكيد', cancelText = 'إلغاء' } = options || {};
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    const box = document.createElement('div');
    box.className = 'w-full max-w-md bg-white rounded-2xl ring-1 ring-slate-200 shadow-2xl overflow-hidden';
    box.innerHTML = `
      <div class="p-5 md:p-6">
        <h3 class="text-lg font-extrabold text-slate-800 mb-3">${title}</h3>
        <div class="text-slate-700 leading-7 text-sm md:text-base">${messageHtml}</div>
        <div class="mt-5 flex items-center gap-3 justify-start">
          <button id="confirmBtn" class="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg">${confirmText}</button>
          <button id="cancelBtn" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg">${cancelText}</button>
        </div>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    function done(v){ overlay.remove(); resolve(v); }
    box.querySelector('#confirmBtn').addEventListener('click', ()=>done(true));
    box.querySelector('#cancelBtn').addEventListener('click', ()=>done(false));
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) done(false); });
  });
}

function getId() {
  return new URLSearchParams(location.search).get('id');
}

async function loadCourseDetails() {
  const id = getId();
  if (!id) { location.href = 'courses.html'; return; }

  try {
      const [courseRes, enrollmentStatusRes] = await Promise.all([
          fetch(`/api/courses/${id}`),
          authFetchMaybe(`/api/my/enrollment/status/${id}`)
      ]);

      if (!courseRes.ok) { document.body.innerHTML = 'الدورة غير موجودة'; return; }
      const c = await courseRes.json();

      const statusData = enrollmentStatusRes.ok ? await enrollmentStatusRes.json() : { status: 'not_enrolled' };

      document.getElementById('courseTitle').textContent = c.title || '—';
      document.getElementById('courseInfo').innerHTML = `
          <div class="text-slate-600">${c.description || ''}</div>
          ${c.giftBookId ? `<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"><p class="font-bold text-green-800">🎁 هذه الدورة تأتي مع هدية!</p><p class="text-sm text-green-700">عند اشتراكك، ستحصل على: كتاب "${c.giftBookId.title}".</p></div>` : ''}
          <div class="mt-2"><span class="text-amber-600 font-bold">${(c.price != null) ? (c.price + ' د.أ') : ''}</span></div>
      `;

      const enrollBtn = document.getElementById('enrollBtn');
      const enrollMsg = document.getElementById('enrollMsg');

      switch (statusData.status) {
          case 'approved':
              enrollBtn.textContent = 'ابدأ المشاهدة الآن';
              enrollBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-8 py-3 transition';
              enrollBtn.onclick = () => { window.location.href = `course-player.html?id=${id}`; };
              break;
          case 'pending':
              enrollBtn.style.display = 'none';
              enrollMsg.textContent = 'لقد أرسلت طلب اشتراك بالفعل، وهو قيد المراجعة حاليًا.';
              enrollMsg.className = 'text-sm mt-2 text-amber-600';
              break;
          case 'rejected':
              enrollBtn.style.display = 'none';
              enrollMsg.textContent = 'تم رفض طلب اشتراكك السابق. يمكنك التواصل مع الإدارة للمزيد من المعلومات.';
              enrollMsg.className = 'text-sm mt-2 text-red-600';
              break;
          default: // not_enrolled
              enrollBtn.addEventListener('click', () => handleEnrollment(c._id));
              break;
      }

  } catch (e) {
      console.error(e);
      document.body.innerHTML = 'حدث خطأ أثناء تحميل الدورة.';
  }
}

async function handleEnrollment(courseId) {
  const enrollBtn = document.getElementById('enrollBtn');
  const enrollMsg = document.getElementById('enrollMsg');
  
  try {
      await waitAuthReady();
      if (!firebase.auth().currentUser) {
          window.location.href = `login.html?next=${encodeURIComponent(window.location.href)}`;
          return;
      }

      const coursePrice = document.querySelector('#courseInfo .text-amber-600').textContent;
      const cliqAlias = 'YOUR_CLIQ_ALIAS'; // 👈 عدّل هذا إلى اسم/رقم Cliq الخاص بك
      const ok = await showConfirmDialog({
        title: 'تأكيد إرسال طلب الاشتراك',
        confirmText: 'إرسال الطلب',
        cancelText: 'إلغاء',
        messageHtml: `
          <div class="space-y-3">
            <p>لإتمام الاشتراك في هذه الدورة، يرجى تحويل المبلغ التالي عبر تطبيق <span class="font-bold">Cliq</span>:</p>
            <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 font-extrabold text-center">${coursePrice}</div>
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div class="text-sm text-slate-600 mb-1">إلى اسم/المعرّف التالي على Cliq:</div>
              <div class="font-extrabold text-slate-800 text-center select-all">${cliqAlias}</div>
            </div>
            <ul class="list-disc pr-5 text-sm text-slate-600 space-y-1">
              <li>بعد التحويل، اضغط على "<span class="font-semibold">إرسال الطلب</span>".</li>
              <li>سيقوم فريقنا بمراجعة الطلب وتفعيل اشتراكك في أقرب وقت.</li>
            </ul>
          </div>
        `,
      });
      if (!ok) return;
      enrollBtn.disabled = true;
      enrollMsg.textContent = 'جاري إرسال الطلب...';

      const res = await authFetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId })
      });

      if (res.status === 409) {
          enrollMsg.textContent = 'لقد قمت بإرسال طلب بالفعل لهذه الدورة.';
          enrollMsg.className = 'text-sm mt-2 text-amber-600';
          enrollBtn.disabled = false;
          return;
      }
      if (!res.ok) throw new Error('Failed to enroll');

      enrollMsg.textContent = '✅ تم إرسال طلبك بنجاح. سيتم إعلامك عند موافقة الإدارة.';
      enrollMsg.className = 'text-sm mt-2 text-green-600';
      enrollBtn.style.display = 'none';

  } catch (error) {
      enrollBtn.disabled = false;
      enrollMsg.textContent = 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.';
      enrollMsg.className = 'text-sm mt-2 text-red-600';
  }
}

loadCourseDetails();