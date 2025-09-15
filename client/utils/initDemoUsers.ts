import { FirebaseService } from '../services/firebaseService';

export async function initializeDemoUsers() {
  try {
    console.log('Initializing demo users...');
    
    // Create admin user
    const adminUser = await FirebaseService.register(
      'admin',
      'admin@waleki.com',
      'admin123',
      'admin'
    );
    console.log('Created admin user:', adminUser);

    // Create regular user
    const regularUser = await FirebaseService.register(
      'user',
      'user@waleki.com', 
      'user123',
      'user'
    );
    console.log('Created regular user:', regularUser);

    console.log('Demo users initialized successfully!');
    return { adminUser, regularUser };
  } catch (error) {
    console.error('Error initializing demo users:', error);
    throw error;
  }
}

// Helper function to run this in console
(window as any).initDemoUsers = initializeDemoUsers;