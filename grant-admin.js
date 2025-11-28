import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  email: { type: String, index: true },
  displayName: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  city: String,
  address: String,
  landmark: String,
});

const User = mongoose.model('User', UserSchema);

async function grantAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const email = 'mmuradd1980@gmail.com';
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true, upsert: false }
    );

    if (user) {
      console.log(`✅ Admin role granted to: ${email}`);
      console.log(`   User: ${user.displayName || user.email}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log(`⚠️  User with email ${email} not found in database.`);
      console.log(`   The user will automatically get admin role when they log in next time.`);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error granting admin:", err);
    process.exit(1);
  }
}

grantAdmin();

