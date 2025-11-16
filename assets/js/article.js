// assets/js/article.js
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    if (!articleId) {
        document.body.innerHTML = '<div class="text-center p-8">لم يتم تحديد مقال.</div>';
        return;
    }

    const articleContentEl = document.getElementById('articleContent');
    const commentsListEl = document.getElementById('commentsList');
    const likesCountEl = document.getElementById('likesCount');
    const likeBtn = document.getElementById('likeBtn');
    const commentForm = document.getElementById('commentForm');
    const commentLoginNote = document.getElementById('commentLoginNote');
    const submitCommentBtn = document.getElementById('submitComment');
    const commentInput = document.getElementById('commentInput');

    async function loadArticleData() {
        try {
            // Fetch article, likes, and comments in parallel
            const [articleRes, interactionsRes] = await Promise.all([
                fetch(`/api/articles/${articleId}`),
                authFetchMaybe(`/api/articles/${articleId}/interactions`) // Use authFetchMaybe for logged-in status
            ]);

            if (!articleRes.ok) throw new Error('Article not found');
            const article = await articleRes.json();
            
            // Render Article
            document.title = `${article.title} | منصة عين الأصالة`;
            articleContentEl.innerHTML = `
                <img src="${article.coverUrl || 'https://placehold.co/800x400/0d9488/ffffff?text=مقالة'}" alt="" class="w-full rounded-lg mb-6">
                <h1 class="!text-3xl !font-extrabold !text-teal-800">${article.title}</h1>
                <p class="lead !text-slate-600">نشر في ${new Date(article.publishedAt).toLocaleDateString('ar')}</p>
                <div class="mt-6">${article.body.replace(/\n/g, '<br>')}</div>
            `;

            // Render Interactions
            if (interactionsRes.ok) {
                const interactions = await interactionsRes.json();
                likesCountEl.textContent = interactions.likes.count;
                likeBtn.classList.toggle('text-rose-500', interactions.likes.userLiked);
                
                // Render Comments
                if (interactions.comments.length > 0) {
                     commentsListEl.innerHTML = interactions.comments.map(c => `
                        <div class="bg-white p-3 rounded-lg ring-1 ring-slate-100">
                            <p class="font-semibold text-sm text-slate-800">${c.userName}</p>
                            <p class="text-slate-600">${c.comment}</p>
                        </div>
                    `).join('');
                } else {
                    commentsListEl.innerHTML = `<p class="text-sm text-slate-500">لا توجد تعليقات بعد. كن أول من يعلق!</p>`;
                }
            }

        } catch (error) {
            console.error('Error loading article:', error);
            articleContentEl.innerHTML = '<h2>حدث خطأ أثناء تحميل المقال.</h2>';
        }
    }
    
    // Handle User State for Liking/Commenting
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            commentLoginNote.classList.add('hidden');
            commentForm.classList.remove('hidden');
        } else {
            commentLoginNote.classList.remove('hidden');
            commentForm.classList.add('hidden');
        }
    });

    // Like Button Logic
    likeBtn.addEventListener('click', async () => {
        try {
            await waitAuthReady();
            const res = await authFetch(`/api/articles/${articleId}/like`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to like');
            const data = await res.json();
            likesCountEl.textContent = data.totalLikes;
            likeBtn.classList.toggle('text-rose-500', data.userLiked);
        } catch (e) {
            window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
    });

    // Submit Comment Logic
    submitCommentBtn.addEventListener('click', async () => {
        const commentText = commentInput.value.trim();
        if (!commentText) return;

        try {
            await waitAuthReady();
            const res = await authFetch(`/api/articles/${articleId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: commentText })
            });
            if (!res.ok) throw new Error('Failed to post comment');
            commentInput.value = '';
            loadArticleData(); // Reload to show the new comment
        } catch (e) {
             window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
    });

    loadArticleData();
});