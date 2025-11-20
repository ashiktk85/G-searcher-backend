import { AuthService } from './auth.service.js';

// Initialize admin user with hashed password
// Default credentials: admin@admin.com / admin123
// In production, change these credentials or use environment variables
const initializeAdmin = async () => {
  const hashedPassword = await AuthService.hashPassword('123');
  return {
    id: 1,
    email: 'admin',
    password: hashedPassword,
    name: 'Admin'
  };
};

// In-memory user store (replace with database in production)
let users = [];
let adminInitialized = false;

// Initialize admin on first access
const ensureAdminExists = async () => {
  if (!adminInitialized) {
    const admin = await initializeAdmin();
    users.push(admin);
    adminInitialized = true;
  }
};

export class UserService {
  static async findUserByEmail(email) {
    await ensureAdminExists();
    return users.find(user => user.email === email);
  }

  static async findUserById(id) {
    await ensureAdminExists();
    return users.find(user => user.id === parseInt(id));
  }

  // Only admin exists, so we only need methods to find admin
  // No need for getAllUsers, updateUser, or deleteUser
}

