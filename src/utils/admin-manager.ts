import { DBService } from '../db/db-service';

/**
 * Utility to manage admin users
 * This should be used in development or through a secure admin interface
 */

export class AdminManager {
  /**
   * Set a user as admin by email
   * This should be called when the user first logs in
   */
  static async setAdminByEmail(email: string): Promise<void> {
    try {
      await DBService.exec(
        'UPDATE user_profile SET is_admin = 1 WHERE email = ?',
        [email]
      );
      console.log(`Admin access granted to: ${email}`);
    } catch (error) {
      console.error('Failed to set admin:', error);
      throw error;
    }
  }

  /**
   * Remove admin access from a user
   */
  static async removeAdminByEmail(email: string): Promise<void> {
    try {
      await DBService.exec(
        'UPDATE user_profile SET is_admin = 0 WHERE email = ?',
        [email]
      );
      console.log(`Admin access removed from: ${email}`);
    } catch (error) {
      console.error('Failed to remove admin:', error);
      throw error;
    }
  }

  /**
   * Check if a user is admin
   */
  static async isAdmin(email: string): Promise<boolean> {
    try {
      const result = await DBService.get<{ is_admin: number }>(
        'SELECT is_admin FROM user_profile WHERE email = ?',
        [email]
      );
      return result?.is_admin === 1;
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }

  /**
   * List all admin users
   */
  static async listAdmins(): Promise<Array<{ email: string; username: string }>> {
    try {
      return await DBService.getAll<{ email: string; username: string }>(
        'SELECT email, username FROM user_profile WHERE is_admin = 1'
      );
    } catch (error) {
      console.error('Failed to list admins:', error);
      return [];
    }
  }

  /**
   * Initialize first admin (use this in development)
   */
  static async initializeFirstAdmin(email: string): Promise<void> {
    try {
      const existingAdmins = await this.listAdmins();
      if (existingAdmins.length === 0) {
        await this.setAdminByEmail(email);
        console.log(`First admin initialized: ${email}`);
      } else {
        console.log('Admin already exists, skipping initialization');
      }
    } catch (error) {
      console.error('Failed to initialize first admin:', error);
      throw error;
    }
  }
}

/**
 * Development helper - run this in browser console to set yourself as admin
 * 
 * Usage:
 * 1. Log in to your app
 * 2. Open browser console
 * 3. Run: window.makeMeAdmin()
 * 4. Refresh the page
 */
export const setupAdminHelper = () => {
  (window as any).makeMeAdmin = async () => {
    try {
      // Get current user email from auth context
      const authContext = document.querySelector('[data-auth-context]');
      if (!authContext) {
        console.error('User not logged in');
        return;
      }

      // This is a simplified approach - in production, you'd want a secure admin interface
      const email = prompt('Enter your email to make admin:');
      if (!email) return;

      await AdminManager.setAdminByEmail(email);
      alert('Admin access granted! Refresh the page to see changes.');
    } catch (error) {
      console.error('Failed to make admin:', error);
      alert('Failed to grant admin access');
    }
  };

  console.log('Admin helper ready! Run window.makeMeAdmin() in console to make yourself admin.');
};
