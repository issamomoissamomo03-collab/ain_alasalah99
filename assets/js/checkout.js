(async function () {
    const box = document.getElementById('result');
    const p = new URLSearchParams(location.search);
    const status = p.get('status');
    const sessionId = p.get('session_id');
    const courseId = p.get('course_id');
  
    if (status !== 'success' || !sessionId) {
      box.innerHTML = `<div class="text-red-600 font-bold">حدث خطأ في عملية الدفع.</div>`;
      return;
    }
  
    try {
      const res = await fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      box.innerHTML = `
        <div class="text-teal-700 font-extrabold text-xl">تم الاشتراك بنجاح 🎉</div>
        <a href="course.html?id=${encodeURIComponent(courseId || '')}" class="inline-block mt-6 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full">الذهاب إلى الدورة</a>
      `;
    } catch (_) {
      box.innerHTML = `<div class="text-red-600 font-bold">تعذّر تأكيد الدفع.</div>`;
    }
  })();
  