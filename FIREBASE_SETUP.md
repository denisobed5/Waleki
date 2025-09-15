# Firebase Setup for Waleki Water Monitoring System

## ✅ What's Already Done

The Waleki project has been fully integrated with Firebase! Here's what's been implemented:

- ✅ Firebase configuration file created
- ✅ Firebase Authentication integrated
- ✅ Firebase Realtime Database for devices and readings
- ✅ Firebase Firestore for user profiles
- ✅ Real-time listeners for live data updates
- ✅ Complete replacement of the REST API backend

## 🔧 Firebase Console Setup Required

You need to configure a few settings in your Firebase Console:

### 1. Enable Authentication

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password** authentication
3. Save changes

### 2. Set up Realtime Database Rules

1. Go to Firebase Console → Realtime Database → Rules
2. Copy the contents of `firebase-realtime-rules.json` and paste them
3. Publish the rules

### 3. Set up Firestore Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the contents of `firestore-rules.txt` and paste them
3. Publish the rules

## 🚀 How to Run

1. **Start the development server**:
   ```bash
   pnpm run dev:frontend-only
   ```

2. **Open your browser** and go to `http://localhost:8080`

3. **Create your first user**:
   - Open browser developer console
   - Run: `initDemoUsers()`
   - This will create admin@waleki.com / admin123 and user@waleki.com / user123

4. **Login** at `/login` with:
   - Email: `admin@waleki.com`
   - Password: `admin123`

## 🌟 Real-time Features

Your app now has:

- **Live Dashboard** - Stats update in real-time
- **Real-time Device Monitoring** - Device status changes instantly
- **Live Water Level Charts** - Readings stream to charts in real-time
- **Multi-user Support** - Multiple users can monitor simultaneously
- **Persistent Data** - All data stored securely in Firebase

## 📡 IoT Device Integration

To send data from your Raspberry Pi sensors to Firebase:

```javascript
// Example: Send sensor reading
await FirebaseService.ingestData({
  deviceId: 1,
  level: 2.45,      // Water level in meters
  temperature: 22.1, // Temperature in Celsius
  batteryLevel: 87   // Battery percentage
});
```

## 🔒 Security

The app uses Firebase Authentication and Security Rules to ensure:
- Only authenticated users can access data
- Users can only modify their own profiles
- All device data is protected by authentication

## 🛠️ Troubleshooting

If you see any errors:

1. **Check Firebase configuration** - Make sure your API keys are correct
2. **Enable required Firebase services** - Auth, Realtime DB, and Firestore
3. **Set up security rules** - Copy the rules from the provided files
4. **Check browser console** - Look for any initialization errors

## 📱 Features Available

- ✅ User authentication (login/logout)
- ✅ Real-time dashboard with live stats
- ✅ Device management (add/edit/delete devices)
- ✅ Live device readings and charts
- ✅ Real-time notifications
- ✅ Data export (JSON/CSV)
- ✅ Multi-user support
- ✅ Mobile responsive design

Your Waleki water monitoring system is now fully powered by Firebase! 🎉