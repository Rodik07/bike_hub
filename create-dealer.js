/**
 * Helper script to create a dealer user in MongoDB
 * 
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Run: node create-dealer.js [email] [password] [name]
 * 
 * Examples:
 * node create-dealer.js dealer@bikehub.com dealer123 "Dealer Name"
 * 
 * Note: After creating the dealer user, you also need to create a dealer record
 * in the dealers collection with the same email address.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.model.js';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './server/.env' });

const createDealer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bikehub');
    console.log('✅ Connected to MongoDB\n');

    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Dealer User';
    
    if (!email || !password) {
      console.log('Usage: node create-dealer.js <email> <password> [name]');
      console.log('\nExample:');
      console.log('  node create-dealer.js dealer@bikehub.com dealer123 "Dealer Name"');
      process.exit(1);
    }
    
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists, update role
      user.role = 'dealer';
      await user.save();
      console.log(`✅ Existing user ${email} is now a dealer!`);
    } else {
      // Create new dealer user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'dealer'
      });
      
      console.log(`✅ New dealer user created successfully!`);
    }
    
    console.log(`\n📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🔑 Role: ${user.role}`);
    console.log(`\n⚠️  Important: You also need to create a dealer record in the admin panel`);
    console.log(`   with the same email address (${email}) for the dealer to access their dashboard.`);
    console.log(`\nYou can now login with these credentials at http://localhost:3000/login`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createDealer();

