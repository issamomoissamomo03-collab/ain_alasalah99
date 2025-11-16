// assets/js/course-player.js -> ✅ الكود الجديد بالكامل

document.addEventListener('DOMContentLoaded', () => {
    const courseContentDiv = document.getElementById('courseContent');
    const authMessageDiv = document.getElementById('authMessage');
    const loginRedirectBtn = document.getElementById('loginRedirectBtn');

    const videoPlayerWrapper = document.getElementById('videoPlayerWrapper');
    const lessonTitleEl = document.getElementById('lessonTitle');
    const courseTitleEl = document.getElementById('courseTitle');
    const lessonsPlaylistDiv = document.getElementById('lessonsPlaylist');

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');

    if (!courseId) {
        courseContentDiv.innerHTML = '<p class="text-center text-red-600">لم يتم العثور على الدورة. الرجاء التأكد من الرابط.</p>';
        return;
    }

    function playLesson(title, videoUrl) {
        lessonTitleEl.textContent = title;
        const url = String(videoUrl || '').trim();
        const isYouTube = /youtube\.com\/watch\?v=|youtu\.be\//i.test(url);
        const youTubeIdMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
        if (isYouTube && youTubeIdMatch) {
            const vid = youTubeIdMatch[1];
            videoPlayerWrapper.innerHTML = `
                <iframe class="w-full h-full aspect-video" src="https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1"
                        title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen></iframe>
            `;
            return;
        }
        // افتراضي: فيديو مباشر (MP4 أو HLS إذا كان يدعم)
        videoPlayerWrapper.innerHTML = `
            <video controls controlsList="nodownload" autoplay class="w-full h-full">
                <source src="${url}">
                متصفحك لا يدعم عرض الفيديوهات.
            </video>
        `;
        const videoElement = videoPlayerWrapper.querySelector('video');
        if (videoElement) {
            videoElement.addEventListener('contextmenu', (e) => e.preventDefault());
            // عرض رسالة خطأ ودية إن فشل التحميل
            videoElement.addEventListener('error', () => {
                videoPlayerWrapper.innerHTML = `
                  <div class="w-full aspect-video bg-slate-900 text-white flex items-center justify-center p-6 text-center">
                    تعذّر تشغيل هذا الفيديو. تأكد من صلاحية الرابط أو نوع الملف (MP4/YouTube).
                  </div>
                `;
            }, { once: true });
        }
    }

    async function loadAndVerifyCourseAccess() {
        try {
            // هذا الطلب سيتحقق من الاشتراك في الخادم قبل إرسال الدروس
            const response = await authFetch(`/api/courses/${courseId}/lessons`);

            if (response.status === 403) { // Forbidden
                 courseContentDiv.innerHTML = `
                    <div class="text-center bg-white rounded-xl shadow-md p-10">
                        <h2 class="text-xl font-bold text-amber-700">أنت غير مشترك في هذه الدورة</h2>
                        <p class="mt-2 text-slate-600">يجب عليك الاشتراك أولاً وتلقي موافقة الإدارة لمشاهدة الدروس.</p>
                        <div class="mt-6">
                            <a href="course.html?id=${courseId}" class="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg">
                                اذهب لصفحة الدورة
                            </a>
                        </div>
                    </div>`;
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load lessons.');
            }

            const lessons = await response.json();

            if (lessons.length === 0) {
                lessonsPlaylistDiv.innerHTML = '<p class="text-sm text-slate-500">لا توجد دروس في هذه الدورة بعد.</p>';
                return;
            }

            lessonsPlaylistDiv.innerHTML = lessons.map((lesson, index) => `
                <button data-title="${lesson.title}" data-url="${lesson.videoUrl}" class="lesson-item w-full text-right p-3 rounded-lg hover:bg-teal-50 transition flex items-center gap-3">
                    <span class="text-teal-600 font-bold">${index + 1}</span>
                    <span class="flex-1">${lesson.title}</span>
                </button>
            `).join('');

            document.querySelectorAll('.lesson-item').forEach(item => {
                item.addEventListener('click', () => {
                    playLesson(item.dataset.title, item.dataset.url);
                    document.querySelectorAll('.lesson-item').forEach(i => i.classList.remove('bg-teal-100'));
                    item.classList.add('bg-teal-100');
                });
            });

            playLesson(lessons[0].title, lessons[0].videoUrl);
            document.querySelector('.lesson-item').classList.add('bg-teal-100');

        } catch (error) {
            console.error('Error:', error);
            courseContentDiv.innerHTML = `<p class="text-center text-red-600 p-8">${error.message}</p>`;
        }
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            courseContentDiv.style.display = 'grid';
            authMessageDiv.style.display = 'none';
            loadAndVerifyCourseAccess();
        } else {
            courseContentDiv.style.display = 'none';
            authMessageDiv.style.display = 'block';
            loginRedirectBtn.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
    });
});