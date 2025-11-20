// assets/js/login-prompt.js
// Custom login prompt modal - reusable across the site

/**
 * Shows a beautiful custom login prompt modal
 * @param {Object} options - Configuration options
 * @param {string} options.redirectUrl - URL to redirect to after login (optional)
 * @returns {Promise<boolean>} - Returns true if user clicked "تسجيل الدخول", false if "إلغاء"
 */
async function showLoginPrompt(options = {}) {
  const { redirectUrl = '' } = options;
  
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
    overlay.style.animation = 'fadeIn 0.2s ease-out';
    
    // Create modal box
    const modal = document.createElement('div');
    modal.className = 'w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden transform transition-all animate-scale-in';
    modal.style.animation = 'scaleIn 0.2s ease-out';
    
    modal.innerHTML = `
      <!-- Icon and Header -->
      <div class="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white">
        <div class="flex items-center gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-extrabold">تسجيل الدخول مطلوب</h3>
            <p class="text-teal-100 text-sm mt-0.5">الوصول إلى هذه الميزة يتطلب تسجيل الدخول</p>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="px-6 py-6">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-slate-700 leading-relaxed text-base">
              يجب تسجيل الدخول لإضافة الكتاب إلى السلة. 
              <span class="font-semibold text-teal-700">هل تريد تسجيل الدخول الآن؟</span>
            </p>
          </div>
        </div>
        
        <!-- Buttons -->
        <div class="mt-6 flex items-center gap-3 justify-start">
          <button id="loginConfirmBtn" class="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105">
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
              تسجيل الدخول
            </span>
          </button>
          <button id="loginCancelBtn" class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all">
            إلغاء
          </button>
        </div>
      </div>
    `;
    
    // Add styles for animations
    if (!document.getElementById('loginPromptStyles')) {
      const style = document.createElement('style');
      style.id = 'loginPromptStyles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `;
      document.head.appendChild(style);
    }
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Handle confirm button
    const confirmBtn = modal.querySelector('#loginConfirmBtn');
    const cancelBtn = modal.querySelector('#loginCancelBtn');
    
    function close(resolveValue) {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      modal.style.animation = 'scaleOut 0.2s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve(resolveValue);
      }, 200);
    }
    
    confirmBtn.addEventListener('click', () => {
      if (redirectUrl) {
        location.href = `login.html?next=${encodeURIComponent(redirectUrl)}`;
      } else {
        location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
      }
      close(true);
    });
    
    cancelBtn.addEventListener('click', () => close(false));
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close(false);
      }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// Make it globally available
window.showLoginPrompt = showLoginPrompt;

