/**
 * Helper script to create an admin user in MongoDB
 *
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Run: node create-admin.js [email] [password] [name]
 *
 * Examples:
 * node create-admin.js admin@bikehub.com admin123 "Admin User"
 * node create-admin.js (will prompt for details)
 *
 * Or use MongoDB shell directly:
 * mongosh
 * use bikehub
 * db.users.updateOne(
 *   { email: "your-email@example.com" },
 *   { $set: { role: "admin" } }
 * )
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./server/models/User.model.js";
import bcrypt from "bcryptjs";

dotenv.config({ path: "./server/.env" });

const createAdmin = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/bikehub"
    );
    console.log("✅ Connected to MongoDB\n");

    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || "Admin User";

    if (!email || !password) {
      console.log("Usage: node create-admin.js <email> <password> [name]");
      console.log("\nExample:");
      console.log(
        '  node create-admin.js admin@bikehub.com admin123 "Admin User"'
      );
      process.exit(1);
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists, update role
      user.role = "admin";
      await user.save();
      console.log(`✅ Existing user ${email} is now an admin!`);
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });

      console.log(`✅ New admin user created successfully!`);
    }

    console.log(`\n📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🔑 Role: ${user.role}`);
    console.log(
      `\nYou can now login with these credentials at http://localhost:3000/login`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createAdmin();
