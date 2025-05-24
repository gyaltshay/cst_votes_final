const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Function to create a new admin user
async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cst.edu.bt',
        password: hashedPassword,
        name: 'Admin',
        studentId: 'ADMIN001',
        department: 'Administration',
        yearOfStudy: 0,
        gender: 'Male',
        role: 'ADMIN',
        emailVerified: new Date()
      }
    });

    console.log('Admin user created successfully:', {
      email: admin.email,
      studentId: admin.studentId,
      role: admin.role
    });
    return admin;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

// Function to check if admin exists and create if not
async function checkAndCreateAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@cst.edu.bt',
        role: 'ADMIN'
      }
    });

    if (admin) {
      console.log('Admin user found:', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        studentId: admin.studentId
      });
      return admin;
    } else {
      console.log('Admin user not found. Creating new admin user...');
      return await createAdmin();
    }
  } catch (error) {
    console.error('Error checking/creating admin:', error);
    throw error;
  }
}

// Function to verify a specific user's email
async function verifyUserEmail(studentId) {
  try {
    const user = await prisma.user.update({
      where: { studentId: studentId },
      data: { emailVerified: new Date() }
    });
    console.log('Successfully verified email for:', user.studentId);
    return user;
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
}

// Main function to run specific operations based on command line arguments
async function main() {
  try {
    const operation = process.argv[2];
    const param = process.argv[3];

    switch (operation) {
      case 'create':
        await createAdmin();
        break;
      case 'check':
        await checkAndCreateAdmin();
        break;
      case 'verify-email':
        if (!param) {
          console.error('Please provide a studentId for email verification');
          process.exit(1);
        }
        await verifyUserEmail(param);
        break;
      default:
        console.log('Available operations:');
        console.log('  create    - Create a new admin user');
        console.log('  check     - Check if admin exists and create if not');
        console.log('  verify-email <studentId> - Verify email for a specific user');
    }
  } catch (error) {
    console.error('Operation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if it's called directly
if (require.main === module) {
  main();
}

// Export functions for use in other files
module.exports = {
  createAdmin,
  checkAndCreateAdmin,
  verifyUserEmail
}; 