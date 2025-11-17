# Admin Panel Documentation

## Overview
The admin panel provides user management and activity monitoring capabilities for authorized administrators.

## Access Control
- **Admin User**: mrpurisujan@gmail.com
- **URL**: `/admin`
- Non-admin users are automatically redirected to `/dashboard`

## Features

### 1. User Management
- View all registered users
- See user details (name, email, profile image, provider)
- Track last login timestamp
- Promote users to admin
- Demote admins to regular users
- Delete users (cannot delete yourself)

### 2. Activity Monitoring
- View all user activities (file creation, imports)
- See activity details (user, action type, file name, timestamp)
- Monitor user engagement across the platform

## Session Configuration
- **Session Duration**: 1 year (effectively no expiration)
- **Strategy**: JWT-based authentication
- Users remain logged in until they explicitly log out

## API Routes

### `/api/admin/check` (GET)
Verifies if the current user has admin privileges.

**Response:**
```json
{
  "isAdmin": true,
  "user": {
    "name": "Mr. Puri Sujan",
    "email": "mrpurisujan@gmail.com"
  }
}
```

### `/api/admin/users` (GET)
Retrieves all users with admin status.

**Response:**
```json
{
  "users": [
    {
      "_id": "...",
      "name": "User Name",
      "email": "user@example.com",
      "isAdmin": false,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### `/api/admin/users` (DELETE)
Deletes a user from the system.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### `/api/admin/users` (POST)
Promotes or demotes admin status.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "action": "promote" // or "demote"
}
```

### `/api/admin/activities` (GET)
Retrieves all user activities sorted by timestamp.

**Response:**
```json
{
  "activities": [
    {
      "_id": "...",
      "userName": "User Name",
      "userEmail": "user@example.com",
      "action": "created",
      "fileName": "Math_Class_10_Final_Term",
      "fileType": "new",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "description": "User created the file..."
    }
  ]
}
```

## Database Collections

### `QusMaker.admin`
Stores admin user information.

**Schema:**
```javascript
{
  name: String,
  email: String (unique),
  image: String,
  googleId: String,
  provider: String,
  promotedAt: Date (optional),
  promotedBy: String (optional)
}
```

### `QusMaker.users`
Stores all registered users.

### `QusMaker.activities`
Stores user activity logs.

**Schema:**
```javascript
{
  userName: String,
  userEmail: String,
  action: String, // "created" or "imported"
  fileName: String,
  fileType: String, // "new" or "json"
  timestamp: Date,
  time: String,
  description: String
}
```

## Security Features
- Session-based authentication
- Admin-only route protection
- Prevent self-deletion
- Prevent self-demotion
- JWT token validation
- MongoDB connection security

## UI Components
- Responsive tables for users and activities
- Real-time data fetching
- Confirmation dialogs for destructive actions
- Role badges (Admin/User)
- Action badges (Created/Imported)
- Loading states and error handling
