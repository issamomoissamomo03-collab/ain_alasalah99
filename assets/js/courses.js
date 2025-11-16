// assets/js/courses.js -> ✅ الكود الجديد بالكامل

(function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggleBtn || !menu) return;
  toggleBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
})();

async function renderAllCourses() {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  try {
      // 1. جلب كل الدورات واشتراكات المستخدم في نفس الوقت
      const [coursesRes, enrollmentsRes] = await Promise.all([
          fetch('/api/courses'),
          authFetchMaybe('/api/my/enrollments') //
      ]);

      const courses = await coursesRes.json();
      const enrolledCourseIds = enrollmentsRes.ok ? await enrollmentsRes.json() : [];

      // نستخدم Set للبحث السريع
      const enrolledSet = new Set(enrolledCourseIds);

      if (!courses.length) {
          grid.innerHTML = `<div class="text-center text-slate-500 col-span-full">لا توجد دورات متاحة حاليًا.</div>`;
          return;
      }

      // 2. عرض الدورات مع تغيير الزر بناءً على حالة الاشتراك
      grid.innerHTML = courses.map(c => {
          const isEnrolled = enrolledSet.has(c._id.toString());
          const price = (c.price != null) ? (c.price + ' د.أ') : '';

          const buttonHtml = isEnrolled
              ? `<a href="course-player.html?id=${encodeURIComponent(c._id)}" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-5 py-2">ابدأ المشاهدة</a>`
              : `<a href="course.html?id=${encodeURIComponent(c._id)}" class="text-teal-700 hover:text-teal-800 font-semibold">عرض التفاصيل</a>`;

          return `
              <article class="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition">
                  <img src="${c.coverUrl || 'https://placehold.co/600x400/0d9488/ffffff?text=Course'}" alt="${c.title || ''}" class="w-full h-48 object-cover">
                  <div class="p-5">
                      <h3 class="font-bold text-lg text-slate-800">${c.title || ''}</h3>
                      ${c.giftBookId ? `<div class="mt-2 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-3 py-1 inline-block">🎁 هدية: كتاب "${c.giftBookId.title}"</div>` : ''}
                      <p class="text-sm text-slate-600 mt-1">${c.teacher || ''}</p>
                      <p class="text-sm text-slate-600 mt-3 line-clamp-2">${c.description || ''}</p>
                      <div class="mt-4 flex items-center justify-between">
                          <span class="text-amber-600 font-extrabold">${price}</span>
                          ${buttonHtml}
                      </div>
                  </div>
              </article>
          `;
      }).join('');

  } catch (e) {
      console.error("Failed to load courses", e);
      grid.innerHTML = `<div class="text-center text-red-500 col-span-full">حدث خطأ أثناء تحميل الدورات.</div>`;
  }
}

renderAllCourses();