// server.js (ESM)
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';

dotenv.config();
// Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_JSON || "{}");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// ===== TEMPORARY: Admin bypass (disabled) =====
const TEMP_ADMIN_BYPASS = false;

// ✅ قدّم كل الملفات الستاتيكية من نفس مجلد المشروع
app.use(express.static(__dirname)); // يخدّم index.html, courses.html, assets/... إلخ

// اتصال مونغو
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err.message));

// Schemas بسيطة للتجربة
// استبدل تعريف CourseSchema القديم بهذا
// server.js

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  teacher: String,
  price: Number,
  coverUrl: String,
  // ✅ أضف هذا السطر
  giftBookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }
});
  const Course = mongoose.model('Course', CourseSchema);
  

  const UserSchema = new mongoose.Schema({
    uid: { type: String, unique: true },      // Firebase UID
    email: { type: String, index: true },
    displayName: String,                      // الاسم
    role: { type: String, enum: ['user','admin'], default: 'user' },
  
    // ⬇️ بيانات الشحن/التواصل (يملؤها المستخدم مرة واحدة)
    phone: String,
    city: String,
    address: String,
    landmark: String, // أقرب معلم
  });
  const User = mongoose.model('User', UserSchema);
  
  
// بعد CourseSchema مباشرة
// لو مش موجود عندك من قبل
const LessonSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    title: String,
    videoUrl: String,
    isPreview: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  });
  const Lesson = mongoose.model('Lesson', LessonSchema);
  
  const BookSchema = new mongoose.Schema({
    title: String,
    author: String,
    price: Number,
    description: String,
    coverUrl: String,
    fileUrl: String, // PDF أو رابط شراء
  });
  const Book = mongoose.model('Book', BookSchema);
  
// server.js

const ArticleSchema = new mongoose.Schema({
  title: String,
  body: String,
  coverUrl: String, // ✅ أضف هذا السطر هنا
  authorUid: String,
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
});
  const Article = mongoose.model('Article', ArticleSchema);
  

  // server.js

const AnnouncementSchema = new mongoose.Schema({
  text: String,
  link: String,
  isActive: { type: Boolean, default: false },
  expiresAt: Date // تاريخ انتهاء صلاحية الإعلان
});
const Announcement = mongoose.model('Announcement', AnnouncementSchema);

  // --- NEW/MODIFIED Consultation Schema ---
const ConsultationSchema = new mongoose.Schema({
  userUid: { type: String, index: true, unique: true }, // Each user has ONE consultation thread
  userName: String,
  userEmail: String,
  status: { type: String, enum: ['new', 'pending_reply', 'closed'], default: 'new' },
  messages: [{
    sender: { type: String, enum: ['user', 'admin'] },
    text: String,
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
  const Consultation = mongoose.model('Consultation', ConsultationSchema);
  
 // ===== Orders
const OrderSchema = new mongoose.Schema({
    userUid: { type: String, index: true },
    items: [{
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      title: String,
      price: Number,
      qty: Number,
      coverUrl: String,
    }],
    total: Number,
    shipping: {
      name: String,
      phone: String,
      city: String,
      address: String,
      landmark: String,
    },
    status: {
      type: String,
      enum: ['pending','confirmed','processing','paid','shipped','delivered','cancelled'],
      default: 'pending'
    },
    code: { type: String, unique: true }, // رقم طلب مقروء
    tracking: {
      number: String,
      carrier: String,
      url: String,
      expectedAt: Date
    },
    notes: String,
    timeline: [{
      status: String,              // مثل pending/shipped...
      message: String,             // وصف موجز
      at: { type: Date, default: Date.now },
      by: String                   // admin uid أو "system"
    }]
  }, { timestamps: true });
  
  const Order = mongoose.model('Order', OrderSchema);
  
  // === Reviews (تقييمات الكتب)
const ReviewSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', index: true },
    userUid: { type: String, index: true },
    userName: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  });
  ReviewSchema.index({ bookId: 1, userUid: 1 }, { unique: true }); // تقييم واحد لكل مستخدم/كتاب
  const Review = mongoose.model('Review', ReviewSchema);
   // === START: Schemas for Articles Interactions ===
   const ArticleLikeSchema = new mongoose.Schema({
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    userUid: { type: String, required: true },
  });
  ArticleLikeSchema.index({ articleId: 1, userUid: 1 }, { unique: true });
  const ArticleLike = mongoose.model('ArticleLike', ArticleLikeSchema);
  
  const ArticleCommentSchema = new mongoose.Schema({
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    userUid: { type: String, required: true },
    userName: String,
    comment: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  });
  const ArticleComment = mongoose.model('ArticleComment', ArticleCommentSchema);
  // === END: Schemas for Articles Interactions ===
  
  
  // يتحقّق من توكن Firebase القادم من الفرونت (Authorization: Bearer <idToken>)
async function verifyFirebaseToken(req, res, next) {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: 'No token' });
    try {
      const decoded = await admin.auth().verifyIdToken(m[1]);
      req.user = decoded; // uid, email, ...
      next();
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  function requireAdmin(req, res, next) {
    if (TEMP_ADMIN_BYPASS) return next();
    if (!req.user) return res.status(401).json({ error: 'No user' });
    User.findOne({ uid: req.user.uid }).then(u => {
      if (!u || u.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      next();
    });
  }

  
// ---------- API ----------
app.get('/api/articles', async (req, res) => {
    const limit = Number(req.query.limit || 0);
    let query = Article.find({ isPublished: true }).sort({ publishedAt: -1 });
    if(limit > 0) {
        query = query.limit(limit);
    }
    const articles = await query.lean();
    res.json(articles);
});

app.post('/api/articles/:id/comment', verifyFirebaseToken, async (req, res) => {
    const { id } = req.params;
    const { uid, name, email } = req.user;
    const { comment } = req.body;
    if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    await ArticleComment.create({
        articleId: id,
        userUid: uid,
        userName: name || email.split('@')[0],
        comment: comment.slice(0, 500)
    });
    res.status(201).json({ success: true });
});
// حماية: تأكد أنه أدمن (ممكن بالـ UID أو claim من Firebase)
  // server.js -> NEW ANNOUNCEMENT SYSTEM API

// Public: Get all active announcements
app.get('/api/announcements', async (req, res) => {
  const now = new Date();
  const announcements = await Announcement.find({
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  }).sort({ _id: -1 }).lean();
  res.json(announcements);
});

// Admin: Get all announcements
app.get('/api/admin/announcements', verifyFirebaseToken, requireAdmin, async (req, res) => {
    const announcements = await Announcement.find().sort({ _id: -1 }).lean();
    res.json(announcements);
});

// Admin: Create a new announcement
app.post('/api/admin/announcements', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const { text, link, durationHours } = req.body;
  const newAnn = await Announcement.create({
    text,
    link,
    isActive: true,
    expiresAt: durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null
  });
  res.status(201).json(newAnn);
});

// Admin: Update an announcement
app.put('/api/admin/announcements/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const { text, link, durationHours, isActive } = req.body;
  const updatedAnn = await Announcement.findByIdAndUpdate(req.params.id, {
    text,
    link,
    isActive,
    expiresAt: durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null
  }, { new: true });
  res.json(updatedAnn);
});

// Admin: Delete an announcement
app.delete('/api/admin/announcements/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
// ===== Admin: Courses =====
app.get('/api/admin/courses', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const rows = await Course.find().sort({ _id:-1 }).lean();
    res.json(rows);
  });
  app.post('/api/admin/courses', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const c = await Course.create(req.body);
    res.json(c);
  });
  app.put('/api/admin/courses/:id', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const c = await Course.findByIdAndUpdate(req.params.id, req.body, {new:true});
    res.json(c);
  });
  app.delete('/api/admin/courses/:id', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    await Course.findByIdAndDelete(req.params.id);
    await Lesson.deleteMany({ courseId: req.params.id }); // تنظيف دروس الكورس
    res.json({ok:true});
  });
  

  // كتب (عام)
app.get('/api/books', async (req, res) => {
    const limit = Number(req.query.limit || 0);
    let q = Book.find().sort({ _id: -1 });
    if (limit) q = q.limit(limit);
    res.json(await q.lean());
  });
  
 // كتاب واحد + ملخص تقييم
app.get('/api/books/:id', async (req, res) => {
    try{
      const b = await Book.findById(req.params.id).lean();
      if(!b) return res.status(404).json({ error: 'Book not found' });
      const agg = await Review.aggregate([
        { $match: { bookId: new mongoose.Types.ObjectId(req.params.id) } },
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: "$rating" } } }
      ]);
      const rating = agg.length ? { count: agg[0].count, avg: Number(agg[0].avg.toFixed(2)) } : { count: 0, avg: 0 };
      res.json({ ...b, rating });
    }catch(e){ res.status(400).json({ error: 'Invalid id' }); }
  });
  
  // قراءة التقييمات
  app.get('/api/books/:id/reviews', async (req,res)=>{
    const rows = await Review.find({ bookId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(rows);
  });
  
  // إنشاء/تحديث تقييم (مطلوب دخول)
  app.post('/api/books/:id/reviews', verifyFirebaseToken, async (req,res)=>{
    const { rating, comment } = req.body || {};
    if(!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Invalid rating' });
    const doc = {
      bookId: req.params.id,
      userUid: req.user.uid,
      userName: req.user.name || req.user.displayName || (req.user.email ? req.user.email.split('@')[0] : 'مستخدم'),
      rating,
      comment: (comment||'').toString().slice(0, 1000)
    };
    try{
      const r = await Review.findOneAndUpdate(
        { bookId: doc.bookId, userUid: doc.userUid },
        doc,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      res.json(r);
    }catch(e){ res.status(400).json({ error: e.message }); }
  });
  

  // server.js

// server.js

// --- USER: Get IDs of all approved enrollments ---
app.get('/api/my/enrollments', verifyFirebaseToken, async (req, res) => {
  const enrollments = await Enrollment.find({
    userUid: req.user.uid,
    status: 'approved'
  }).select('courseId').lean();

  const courseIds = enrollments.map(e => e.courseId.toString());
  res.json(courseIds);
});

// API عام لجلب الإعلان النشط للمستخدمين
// server.js -> ✅ أضف هذا الـ API الجديد

// --- USER: Get enrollment status for a SINGLE course ---
app.get('/api/my/enrollment/status/:courseId', verifyFirebaseToken, async (req, res) => {
  const enrollment = await Enrollment.findOne({
    userUid: req.user.uid,
    courseId: req.params.courseId
  }).select('status').lean();

  if (enrollment) {
    res.json({ status: enrollment.status }); // e.g., 'pending', 'approved', 'rejected'
  } else {
    res.json({ status: 'not_enrolled' });
  }
});
  // قراءة البروفايل
app.get('/api/profile', verifyFirebaseToken, async (req, res) => {
    const u = await User.findOne({ uid: req.user.uid }).lean();
    res.json({
      name: u?.displayName || '',
      phone: u?.phone || '',
      city: u?.city || '',
      address: u?.address || '',
      landmark: u?.landmark || ''
    });
  });
  app.get('/book.html', (req,res)=> res.sendFile(path.join(__dirname, 'book.html')));

  // تحديث البروفايل
  app.put('/api/profile', verifyFirebaseToken, async (req, res) => {
    const { name, phone, city, address, landmark } = req.body || {};
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { displayName: name || '', phone: phone || '', city: city || '', address: address || '', landmark: landmark || '' },
      { new: true, upsert: true }
    );
    res.json({ ok: true });
  });

 // داخل server.js
app.post('/api/orders', verifyFirebaseToken, async (req, res) => {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Empty cart' });
    }
  
    // تأكد من بيانات الشحن (من الملف الشخصي)
    const u = await User.findOne({ uid: req.user.uid }).lean();
    if (!u || !u.phone || !u.city || !u.address) {
      return res.status(400).json({ error: 'PROFILE_INCOMPLETE' });
    }
  
    // اقبل id أو bookId
    const ids = items.map(i => i.id || i.bookId).filter(Boolean);
    const books = await Book.find({ _id: { $in: ids } }).lean();
    const map = new Map(books.map(b => [String(b._id), b]));
  
    const orderItems = [];
    let total = 0;
    for (const it of items) {
      const theId = it.id || it.bookId;
      const b = map.get(String(theId));
      if (!b) continue;
      const qty = Math.max(1, Number(it.qty || 1));
      const price = Number(b.price || 0);
      total += qty * price;
      orderItems.push({
        bookId: b._id,
        title: b.title,
        price,
        qty,
        coverUrl: b.coverUrl || ''
      });
    }
    if (orderItems.length === 0) return res.status(400).json({ error: 'No valid items' });
  
    // كود تتبع بسيط
    const code = 'IH' + Math.random().toString(36).slice(2, 8).toUpperCase();
  
    const order = await Order.create({
      userUid: req.user.uid,
      items: orderItems,
      total,
      shipping: {
        name: u.displayName || '',
        phone: u.phone || '',
        city: u.city || '',
        address: u.address || '',
        landmark: u.landmark || ''
      },
      status: 'pending',
      code
    });
  
    res.json({ ok: true, orderId: order._id, total, code });
  });
  
  // في server.js، مع بقية Schemas
const EnrollmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseTitle: String,
  userUid: { type: String, index: true },
  userName: String,
  userEmail: String,
  price: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  paymentId: { type: String, default: 'simulated_payment' } // للدفع المستقبلي
}, { timestamps: true });
const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
  
  // دروس الكورس (عام)
// - إن لم يكن هناك Authorization أو التوكن غير صالح -> يرجّع الدروس ذات isPreview فقط
// - إن وُجد توكن صحيح -> يرجّع كل الدروس (مؤقتًا بدون فحص شراء)
// === User: list my orders
app.get('/api/my/orders', verifyFirebaseToken, async (req, res) => {
    const limit = Math.min(50, Number(req.query.limit || 20));
    const rows = await Order.find({ userUid: req.user.uid })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(rows);
  });
  
  // === User: single order (ownership enforced)
  app.get('/api/my/orders/:id', verifyFirebaseToken, async (req, res) => {
    const o = await Order.findById(req.params.id).lean();
    if (!o || o.userUid !== req.user.uid) return res.status(404).json({ error: 'Not found' });
    res.json(o);
  });
// === Admin: list all orders
app.get('/api/admin/orders', verifyFirebaseToken, requireAdmin, async (req, res) => {
    const rows = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(rows);
  });
  
  // === Admin: update status / tracking / note
  app.patch('/api/admin/orders/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
    const { status, tracking, notes, message } = req.body || {};
    const update = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (tracking) update.tracking = tracking;
  
    const o = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: update,
        $push: { timeline: { status: status || 'update', message: message || '', by: req.user.uid } }
      },
      { new: true }
    ).lean();
  
    if (!o) return res.status(404).json({ error: 'Not found' });
    res.json(o);
  });
    
  // Lessons
  app.get('/api/admin/courses/:courseId/lessons', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const ls = await Lesson.find({ courseId: req.params.courseId }).sort({order:1,_id:1}).lean();
    res.json(ls);
  });
  app.post('/api/admin/courses/:courseId/lessons', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const l = await Lesson.create({ ...req.body, courseId: req.params.courseId });
    res.json(l);
  });
  app.delete('/api/admin/lessons/:id', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ok:true});
  });
  
  // ===== Admin: Books =====
  app.get('/api/admin/books', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const rows = await Book.find().sort({ _id:-1 }).lean();
    res.json(rows);
  });
  app.post('/api/admin/books', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const b = await Book.create(req.body);
    res.json(b);
  });
  app.put('/api/admin/books/:id', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const b = await Book.findByIdAndUpdate(req.params.id, req.body, {new:true});
    res.json(b);
  });
  app.delete('/api/admin/books/:id', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    await Book.findByIdAndDelete(req.params.id);
    res.json({ok:true});
  });
  
  // ===== Admin: Articles =====
  app.get('/api/admin/articles', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const rows = await Article.find().sort({ _id:-1 }).lean();
    res.json(rows);
  });
  app.post('/api/admin/articles', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const a = await Article.create({ ...req.body, authorUid: req.user.uid });
    res.json(a);
  });
  app.put('/api/admin/articles/:id', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const a = await Article.findByIdAndUpdate(req.params.id, req.body, {new:true});
    res.json(a);
  });
  app.post('/api/admin/articles/:id/publish', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const a = await Article.findByIdAndUpdate(req.params.id, { isPublished:true, publishedAt:new Date() }, {new:true});
    res.json(a);
  });
  app.post('/api/admin/articles/:id/unpublish', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    const a = await Article.findByIdAndUpdate(req.params.id, { isPublished:false, publishedAt:null }, {new:true});
    res.json(a);
  });
  app.delete('/api/admin/articles/:id', verifyFirebaseToken, requireAdmin, async (req,res)=>{
    await Article.findByIdAndDelete(req.params.id);
    res.json({ok:true});
  });
  
  // ===== Admin: Consultations =====
  // --- USER: Request to enroll in a course ---
app.post('/api/enrollments', verifyFirebaseToken, async (req, res) => {
  const { courseId } = req.body;
  const { uid, name, email } = req.user;

  const course = await Course.findById(courseId).lean();
  if (!course) return res.status(404).json({ error: 'Course not found' });

  // Check for existing pending or approved enrollment
  const existing = await Enrollment.findOne({ userUid: uid, courseId: courseId, status: { $in: ['pending', 'approved'] } });
  if (existing) {
    return res.status(409).json({ error: 'You have already sent an enrollment request for this course.' });
  }

  await Enrollment.create({
    courseId,
    courseTitle: course.title,
    userUid: uid,
    userName: name || email.split('@')[0],
    userEmail: email,
    price: course.price,
    status: 'pending'
  });
  res.status(201).json({ success: true, message: 'Enrollment request submitted for review.' });
});

// --- ADMIN: Get all enrollment requests ---
app.get('/api/admin/enrollments', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const enrollments = await Enrollment.find().sort({ createdAt: -1 }).lean();
  res.json(enrollments);
});

// --- ADMIN: Approve an enrollment ---
app.post('/api/admin/enrollments/:id/approve', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  res.json(enrollment);
});

// --- ADMIN: Reject an enrollment ---
app.post('/api/admin/enrollments/:id/reject', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  res.json(enrollment);
});
   // ===== Admin: Article Comments =====
   app.get('/api/admin/articles/:id/comments', verifyFirebaseToken, requireAdmin, async (req, res) => {
    const comments = await ArticleComment.find({ articleId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(comments);
});

app.delete('/api/admin/articles/:articleId/comments/:commentId', verifyFirebaseToken, requireAdmin, async (req, res) => {
    await ArticleComment.findByIdAndDelete(req.params.commentId);
    res.json({ success: true });
});
  
// server.js

app.get('/api/courses', async (req, res) => {
  const items = await Course.find().populate('giftBookId', 'title').lean();
  res.json(items);
});
// ===== START: API for Public Articles =====
    // Get all published articles


    // Get a single article by ID
    app.get('/api/articles/:id', async (req, res) => {
        try {
            const article = await Article.findOne({ _id: req.params.id, isPublished: true }).lean();
            if (!article) return res.status(404).json({ error: 'Article not found' });
            res.json(article);
        } catch (e) {
            res.status(400).json({ error: 'Invalid ID' });
        }
    });
    
    // Get likes and comments for an article
    app.get('/api/articles/:id/interactions', verifyFirebaseToken, async (req, res) => {
        const { id } = req.params;
        const { uid } = req.user;
        const [likesCount, userLiked, comments] = await Promise.all([
            ArticleLike.countDocuments({ articleId: id }),
            ArticleLike.findOne({ articleId: id, userUid: uid }).lean(),
            ArticleComment.find({ articleId: id }).sort({ createdAt: -1 }).lean()
        ]);
        res.json({
            likes: { count: likesCount, userLiked: !!userLiked },
            comments: comments
        });
    });

    // Like/Unlike an article
    app.post('/api/articles/:id/like', verifyFirebaseToken, async (req, res) => {
        const { id } = req.params;
        const { uid } = req.user;
        const existingLike = await ArticleLike.findOne({ articleId: id, userUid: uid });
        if (existingLike) {
            await existingLike.deleteOne();
        } else {
            await ArticleLike.create({ articleId: id, userUid: uid });
        }
        const totalLikes = await ArticleLike.countDocuments({ articleId: id });
        res.json({ totalLikes, userLiked: !existingLike });
    });

    // Add a comment

    // ===== END: API for Public Articles =====
app.get('/api/courses/:id', async (req, res) => {
  try {
    const item = await Course.findById(req.params.id).populate('giftBookId', 'title').lean(); // <-- السطر الجديد
    if (!item) return res.status(404).json({ error: 'Course not found' });
    res.json(item);
  } catch {
    res.status(400).json({ error: 'Invalid id' });
  }
});

// ===== Public: Lessons for a course (preview only in frontend) =====
// server.js

// ===== SECURED: Lessons for an enrolled user =====
app.get('/api/courses/:courseId/lessons', verifyFirebaseToken, async (req, res) => {
  try {
      const { courseId } = req.params;
      const { uid } = req.user;

      // ✅ التحقق من أن المستخدم مشترك وحالته "approved"
      const enrollment = await Enrollment.findOne({
          courseId: courseId,
          userUid: uid,
          status: 'approved'
      });

      // إذا لم يكن مشتركًا، أرجع رسالة خطأ "ممنوع"
      if (!enrollment) {
          return res.status(403).json({ error: 'User is not enrolled in this course.' });
      }

      // إذا كان مشتركًا، أرجع له الدروس
      const lessons = await Lesson.find({ courseId }).sort({ order: 1, _id: 1 }).lean();
      res.json(lessons);

  } catch (e) {
      res.status(400).json({ error: 'Invalid courseId' });
  }
});
  

// server.js -> ✅ أضف هذا الكود الجديد

// --- USER: Get all courses they are enrolled in ---
app.get('/api/my/courses', verifyFirebaseToken, async (req, res) => {
  try {
    // 1. Find all approved enrollments for the current user
    const enrollments = await Enrollment.find({ 
      userUid: req.user.uid, 
      status: 'approved' 
    }).select('courseId').lean();

    // 2. Extract the course IDs from the enrollments
    const courseIds = enrollments.map(e => e.courseId);

    // 3. Find all courses that match those IDs
    const courses = await Course.find({ 
      _id: { $in: courseIds } 
    }).populate('giftBookId', 'title').lean();

    res.json(courses);

  } catch (e) {
    console.error('Failed to get user courses:', e);
    res.status(500).json({ error: 'Server error' });
  }
});
// --- NEW: User gets their conversation ---
app.post('/api/consultations', verifyFirebaseToken, async (req, res) => {
  const { message } = req.body;
  const { uid, name, email } = req.user;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    const consultation = await Consultation.findOneAndUpdate(
      { userUid: uid },
      { 
        $push: { messages: { sender: 'user', text: message.slice(0, 2000) } },
        $set: { userName: name || email.split('@')[0], userEmail: email, status: 'pending_reply' }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(consultation);
  } catch (error) {
    console.error('Error in consultation:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- USER: Get their own conversation ---
app.get('/api/my/consultation', verifyFirebaseToken, async (req, res) => {
    try {
        const consultation = await Consultation.findOne({ userUid: req.user.uid }).lean();
        if (!consultation) {
            return res.status(404).json({ message: 'No consultation started yet.' });
        }
        res.json(consultation);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN: Get all conversation summaries ---
app.get('/api/admin/consultations', verifyFirebaseToken, requireAdmin, async (req,res)=>{
  const rows = await Consultation.find().sort({ updatedAt: -1 }).lean();
  res.json(rows);
});

// --- ADMIN: Get a single full conversation by ID ---
app.get('/api/admin/consultations/:id', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
      const consultation = await Consultation.findById(req.params.id).lean();
      if (!consultation) return res.status(404).json({ error: 'Not found' });
      res.json(consultation);
  } catch(e) {
      res.status(400).json({ error: 'Invalid ID' });
  }
});

// --- ADMIN: Send a reply to a conversation ---
app.post('/api/admin/consultations/:id/reply', verifyFirebaseToken, requireAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reply message cannot be empty' });
  }
  try {
      const consultation = await Consultation.findByIdAndUpdate(
          req.params.id,
          {
              $push: { messages: { sender: 'admin', text: message } },
              $set: { status: 'new' }
          },
          { new: true }
      );
      if (!consultation) return res.status(404).json({ error: 'Not found' });
      res.json(consultation);
  } catch (e) {
      res.status(500).json({ error: 'Server error' });
  }
});


// ---------- Routes للصفحات (اختياري/تأكيد) ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/courses.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'courses.html'));
});
app.get('/course.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'course.html'));
});
app.get('/checkout.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
// ... باقي الصفحات
app.get('/order-success.html', (req,res)=> res.sendFile(path.join(__dirname, 'order-success.html')));

// ✅ أضف هذا السطر
app.get('/admin-orders.html', (req,res)=> res.sendFile(path.join(__dirname, 'admin-orders.html')));

app.get('/orders.html', (req,res)=> res.sendFile(path.join(__dirname, 'orders.html')));
app.get('/order-success.html', (req,res)=> res.sendFile(path.join(__dirname, 'order-success.html')));
app.get('/articles.html', (req, res) => res.sendFile(path.join(__dirname, 'articles.html')));
app.get('/article.html', (req, res) => res.sendFile(path.join(__dirname, 'article.html')));
app.post('/api/auth/ensure', verifyFirebaseToken, async (req, res) => {
    const { uid, email, name } = {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name || req.user.displayName || ''
    };
    let u = await User.findOne({ uid });
    if (!u) {
      u = await User.create({ uid, email, displayName: name, role: 'user' });
    }
    res.json({ uid: u.uid, email: u.email, role: u.role });
  });

  app.post('/api/admin/grant', verifyFirebaseToken, async (req, res) => {
    const u = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { role: 'admin' },
      { new: true, upsert: true }
    );
    res.json({ ok: true, role: u.role });
  });
 
  // Set role for a user by email (admin-only)
  app.post('/api/admin/users/set-role', verifyFirebaseToken, requireAdmin, async (req, res) => {
    try{
      const { email, role } = req.body || {};
      const emailStr = (email||'').toLowerCase();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
      if(!validEmail || !role || !['user','admin'].includes(role)){
        return res.status(400).json({ error: 'Invalid payload' });
      }
      const u = await User.findOneAndUpdate(
        { email: emailStr },
        { email: emailStr, role },
        { new: true, upsert: true }
      );
      res.json({ ok:true, email: u.email, role: u.role });
    }catch(e){
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // List users (admin-only)
  app.get('/api/admin/users', verifyFirebaseToken, requireAdmin, async (req, res) => {
    try{
      const users = await User.find({}, { _id: 0, uid: 1, email: 1, displayName: 1, role: 1 }).sort({ role: -1, email: 1 }).lean();
      res.json(users);
    }catch(e){
      res.status(500).json({ error: 'Server error' });
    }
  });
 
// Logged-in user info (ensure user exists, return role, seed admin if configured)
app.get('/api/me', verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const email = (req.user.email || '').toLowerCase();
    const displayName = req.user.name || req.user.displayName || (email ? email.split('@')[0] : '');

    // Find or create the user
    let u = await User.findOne({ uid });
    if (!u) {
      u = await User.create({ uid, email, displayName, role: 'user' });
    } else {
      // keep email/name up to date if changed in Google
      const updates = {};
      if (email && u.email !== email) updates.email = email;
      if (displayName && u.displayName !== displayName) updates.displayName = displayName;
      if (Object.keys(updates).length) {
        u = await User.findOneAndUpdate({ uid }, { $set: updates }, { new: true });
      }
    }

    // Optional: seed admin emails (comma-separated) or specific hardcoded support
    const seedAdmins = (process.env.ADMIN_SEED_EMAILS || 'inot410@gmail.com,mmuradd1980@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    if ((email && seedAdmins.includes(email)) && u.role !== 'admin') {
      u = await User.findOneAndUpdate({ uid }, { role: 'admin' }, { new: true });
    }

    res.json({
      uid: uid,
      email: u.email || email,
      name: u.displayName || displayName,
      role: u.role || 'user'
    });
  });
  
  
  
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
