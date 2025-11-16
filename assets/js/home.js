// assets/js/home.js -> ✅ هذا هو الكود الصحيح والكامل للملف

// ===== Courses on Home Page =====
(async function () {
  const homeCourses = document.getElementById('homeCourses');
  if (!homeCourses) return;
  try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
          fetch('/api/courses'),
          authFetchMaybe('/api/my/enrollments')
      ]);

      const allCourses = coursesRes.ok ? await coursesRes.json() : [];
      const courses = allCourses.slice(0, 6);

      const enrolledCourseIds = enrollmentsRes.ok ? await enrollmentsRes.json() : [];
      const enrolledSet = new Set(enrolledCourseIds);

      homeCourses.innerHTML = courses.map(c => {
          const isEnrolled = enrolledSet.has(c._id.toString());
          const price = (c.price != null) ? (c.price + ' د.أ') : '';

          const buttonHtml = isEnrolled
              ? `<a href="course-player.html?id=${encodeURIComponent(c._id)}" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-5 py-2 text-sm">ابدأ المشاهدة</a>`
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
      console.error("Failed to load home courses", e);
      homeCourses.innerHTML = `<div class="text-slate-500">تعذر جلب الدورات.</div>`;
  }
})();


// ===== Articles on Home Page =====
(async function () {
  const homeArticles = document.getElementById('homeArticles');
  if (!homeArticles) return;
  try {
      const res = await fetch('/api/articles?limit=6');
      const articles = await res.json();
      homeArticles.innerHTML = articles.map(a => `
          <a href="article.html?id=${a._id}" class="block bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden shadow-sm hover:ring-teal-500 transition-all duration-300">
              <img src="${a.coverUrl || 'https://placehold.co/400x250/0d9488/ffffff?text=مقالة'}" alt="صورة المقال" class="w-full h-48 object-cover">
              <div class="p-4"><h3 class="font-bold text-lg text-slate-800">${a.title}</h3></div>
          </a>
      `).join('');
  } catch (_) {}
})();


// ===== Books on Home Page =====
(async function renderHomeBooks() {
  const wrap = document.getElementById('homeBooks');
  if (!wrap) return;
  try {
      const res = await fetch('/api/books?limit=6');
      const books = await res.json();
      wrap.innerHTML = books.map(b => `
          <article class="bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition">
              <img src="${b.coverUrl || 'https://placehold.co/600x800/0d9488/ffffff?text=Book'}" alt="${b.title || ''}" class="w-full h-72 object-cover">
              <div class="p-5">
                  <h3 class="font-bold text-lg text-slate-800">${b.title || ''}</h3>
                  <p class="mt-1 text-slate-600">${b.author || ''}</p>
                  <div class="mt-3 flex items-center justify-between">
                      <span class="text-amber-600 font-extrabold">${(b.price != null) ? (b.price + ' د.أ') : ''}</span>
                      <a href="book.html?id=${b._id}" class="text-teal-700 hover:text-teal-800 font-semibold">التفاصيل</a>
                  </div>
              </div>
          </article>
      `).join('');
  } catch (_) {}
})();