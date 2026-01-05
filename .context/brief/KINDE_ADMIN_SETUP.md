# Kinde Admin Role Setup Guide

## Overview
Instead of hardcoding admin emails, we'll use Kinde's built-in role and permission system to manage admin access.

## Step 1: Create Admin Role in Kinde

1. Go to your Kinde dashboard: https://jaxreset.kinde.com
2. Navigate to **Settings > Roles**
3. Click **Create role**
4. Enter:
   - **Name**: `Admin`
   - **Key**: `admin`
   - **Description**: `Administrators with access to admin dashboard`
5. Click **Create role**

## Step 2: Create Admin Permission

1. In the same Roles section, click on the **Admin** role you just created
2. Go to **Permissions** tab
3. Click **Add permission**
4. Enter:
   - **Name**: `Admin Access`
   - **Key**: `admin:access`
   - **Description**: `Grants access to admin dashboard`
5. Click **Create permission**

## Step 3: Assign Admin Role to Users

### Method A: Individual User Assignment
1. Go to **Settings > Users**
2. Find the user you want to make admin
3. Click **View details**
4. Go to **Roles** tab
5. Click **Assign role**
6. Select **Admin** role
7. Click **Assign**

### Method B: Bulk Assignment (Multiple Users)
1. Go to **Settings > Users**
2. Select multiple users using checkboxes
3. Click **Bulk actions**
4. Select **Assign roles**
5. Choose **Admin** role
6. Click **Assign**

## Step 4: Verify the Setup

1. Log in with a user who has the Admin role
2. Open browser console and run:
   ```javascript
   // Check if user has admin permission
   window.kinde.getPermissions().then(p => {
     console.log('Admin permission:', p.permissions.some(perm => perm.key === 'admin:access' && perm.isGranted));
   });
   ```

3. Try accessing `/admin` - should work for admin users
4. Try with a non-admin user - should redirect to `/dashboard`

## Code Integration

The system is already configured to check for the `admin:access` permission:

```typescript
const permissions = await getPermissions();
const isAdmin = permissions.permissions.some((perm: any) => perm.key === 'admin:access' && perm.isGranted);
```

## Benefits of Using Kinde Roles

1. **Centralized Management**: All role management in Kinde dashboard
2. **Real-time Updates**: Changes take effect immediately on next login
3. **Scalable**: Easy to add more roles and permissions
4. **Audit Trail**: Kinde tracks all role assignments
5. **Security**: No hardcoded admin emails in source code

## Additional Roles You Can Create

- **Editor**: Can edit chapters but not access admin settings
- **Moderator**: Can manage user content
- **Viewer**: Read-only access to admin data

## Troubleshooting

### User not getting admin access?
1. Verify the user has the Admin role in Kinde
2. Check the permission key is exactly `admin:access`
3. Ensure the user has logged out and logged back in after role assignment
4. Check browser console for permission errors

### Permission not working?
1. Verify the permission is assigned to the role
2. Check the permission key matches exactly in code (`admin:access`)
3. Ensure the role is assigned to the user

This approach is much more maintainable and secure than hardcoding admin emails!
