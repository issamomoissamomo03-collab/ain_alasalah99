import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  teacher: String,
  price: Number,
});

const Course = mongoose.model('Course', CourseSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    await Course.deleteMany({}); // احذف أي بيانات قديمة

    await Course.insertMany([
      {
        title: "شرح كتاب فقه العبادات",
        description: "دورة في أساسيات فقه العبادات",
        teacher: "د. عبد الرحمن السلمي",
        price: 50
      },
      {
        title: "مدخل إلى علوم الحديث",
        description: "أساسيات علم الحديث وتاريخه",
        teacher: "أ. مريم القاسمي",
        price: 70
      },
      {
        title: "أساسيات العقيدة",
        description: "تعلم أركان العقيدة الصحيحة",
        teacher: "الشيخ صالح الأنصاري",
        price: 60
      }
    ]);

    console.log("✅ Data seeded successfully");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  }
}

seed();
