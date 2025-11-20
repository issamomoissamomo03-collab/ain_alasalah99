// assets/js/script.js

// Helper: Smooth scroll to target id
function smoothScrollTo(targetId) {
  const el = document.querySelector(targetId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Set current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Smooth Scrolling for links with [data-scroll]
document.querySelectorAll('a[data-scroll]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href.startsWith('#')) return;
    e.preventDefault();
    smoothScrollTo(href);
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
  });
});

// Mobile Menu Toggle
(function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
  }
})();

// ===== NEW REAL-TIME CHAT WIDGET (Final Version with Notifications) =====
(function initChatWidget() {
  const startBtn = document.getElementById('startChatBtn');
  const widget = document.getElementById('chatWidget');
  const closeBtn = document.getElementById('chatClose');
  const sendBtn = document.getElementById('chatSend');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messagesDiv = document.getElementById('chatMessages');
  
  const notificationBadge = document.getElementById('chatNotificationBadge');
  const notificationSound = document.getElementById('chatNotificationSound');
  const originalTitle = document.title;

  if (!widget) return;

  let chatInterval = null;
  let lastMessageCount = 0;

  if(notificationBadge) notificationBadge.style.display = 'none';

  function playNotification() {
    if (notificationSound) notificationSound.play().catch(e => console.warn("Could not play sound. User may need to interact with the page first.", e));
    document.title = `(1) رسالة جديدة! | ${originalTitle}`;
    if (notificationBadge) notificationBadge.style.display = 'flex';
  }

  function resetNotification() {
    document.title = originalTitle;
    if (notificationBadge) notificationBadge.style.display = 'none';
  }

  function renderConversation(consultation) {
    const messages = consultation?.messages || [];
    const newMessageCount = messages.length;

    if (newMessageCount > lastMessageCount && (widget.classList.contains('hidden') || document.hidden)) {
      playNotification();
    }
    lastMessageCount = newMessageCount;

    messagesDiv.innerHTML = '';
    if (messages.length > 0) {
        messages.forEach(msg => {
            const isUser = msg.sender === 'user';
            const bubble = document.createElement('div');
            bubble.className = `rounded-lg px-3 py-2 max-w-[85%] ${isUser ? 'bg-teal-600 text-white self-end' : 'bg-slate-100 text-slate-800 self-start'}`;
            bubble.textContent = msg.text;
            messagesDiv.appendChild(bubble);
        });
    } else {
        messagesDiv.innerHTML = `<div class="text-center text-sm text-slate-500 p-4">أهلاً بك! كيف يمكننا مساعدتك اليوم؟</div>`;
    }
    // Scroll to bottom only if the chat widget is open
    if (!widget.classList.contains('hidden')) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  async function loadConversation() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        if (chatInterval) clearInterval(chatInterval); // Stop polling if user logged out
        return;
      };

      const res = await authFetch('/api/my/consultation');
      if (res.ok) {
        const conversation = await res.json();
        renderConversation(conversation);
      } else {
        renderConversation(null);
      }
    } catch (e) {
      console.error("Failed to load conversation", e);
    }
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.disabled = true;
    sendBtn.disabled = true;
    try {
      await authFetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      input.value = '';
      await loadConversation();
    } catch (e) {
      alert('حدث خطأ أثناء إرسال الرسالة.');
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }
  
  function openChat() {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        resetNotification();
        widget.classList.remove('hidden');
        input.focus();
        
        try {
            const res = await authFetch('/api/my/consultation');
            const conversation = res.ok ? await res.json() : null;
            lastMessageCount = conversation?.messages?.length || 0;
            renderConversation(conversation);
        } catch(e) {
            console.error("Failed to fetch initial conversation", e);
            renderConversation(null);
        }

        if (chatInterval) clearInterval(chatInterval);
        chatInterval = setInterval(loadConversation, 3000);
      } else {
        alert('يجب تسجيل الدخول أولاً لبدء محادثة.');
        window.location.href = `login.html?next=${encodeURIComponent('index.html#consultations')}`;
      }
    });
  }

  function closeChat() {
    widget.classList.add('hidden');
    if (chatInterval) clearInterval(chatInterval);
  }
  
  startBtn.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });
})();
// assets/js/script.js

// ===== LIVE ANNOUNCEMENT BAR =====
// assets/js/script.js -> NEW SLIDER ANNOUNCEMENT BAR
// assets/js/script.js -> ✅ الكود النهائي والمصحح
(async function initAnnouncementBar() {
  const bar = document.getElementById('announcement-bar');
  const slidesContainer = document.getElementById('announcement-slides');
  const closeBtn = document.getElementById('close-announcement');
  const header = document.querySelector('header');
  if (!bar || !slidesContainer) return;

  if (sessionStorage.getItem('announcementClosed') === 'true') return;

  try {
    const res = await fetch('/api/announcements');
    const announcements = await res.json();

    if (announcements && announcements.length > 0) {
     // assets/js/script.js
  slidesContainer.innerHTML = announcements.map(ann => `
    <div class="swiper-slide text-center mobile-slide">
      <a href="${ann.link || '#'}" ${ann.link ? '' : 'style="pointer-events:none;"'} class="hover:underline mobile-link">${ann.text}</a>
    </div>
  `).join('');

      bar.classList.remove('hidden');

      new Swiper('.ann-swiper', {
        loop: announcements.length > 1, // تفعيل اللوب فقط لو فيه أكثر من إعلان
        direction: 'vertical',
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
      });

      // دالة لتحديث المواضع حسب ارتفاع الشريط
      function updatePositions() {
        if (bar && !bar.classList.contains('hidden')) {
          const isMobile = window.innerWidth < 768;
          let barHeight;
          
          if (isMobile) {
            // على الموبايل: حساب الارتفاع الديناميكي
            barHeight = bar.offsetHeight;
            if (barHeight >= 30 && barHeight <= 100) {
              if (header) header.style.top = `${barHeight}px`;
              document.body.style.paddingTop = `${barHeight + 64}px`;
            } else {
              // إذا كان الارتفاع غير منطقي، استخدم قيمة افتراضية للموبايل
              const defaultMobileHeight = 50;
              if (header) header.style.top = `${defaultMobileHeight}px`;
              document.body.style.paddingTop = `${defaultMobileHeight + 64}px`;
            }
          } else {
            // على الكمبيوتر: استخدام ارتفاع ثابت 40px كما كان في الأصل
            barHeight = 40;
            if (header) header.style.top = `${barHeight}px`;
            document.body.style.paddingTop = `${barHeight + 64}px`; // 40px + 64px = 104px
          }
        }
      }
      
      // تحديث المواضع بعد تحميل الشريط
      setTimeout(updatePositions, 100);
      setTimeout(updatePositions, 300);
      
      // تحديث المواضع عند تغيير حجم الشاشة (responsive)
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updatePositions, 100);
      });
    }
  } catch(e) { console.error("Could not fetch announcements.", e); }

  closeBtn.addEventListener('click', () => {
      bar.classList.add('hidden');
      bar.style.display = 'none';
      if (header) header.style.top = '0px';
      document.body.style.paddingTop = '64px'; // Reset to header height only
      sessionStorage.setItem('announcementClosed', 'true');
  });
})();