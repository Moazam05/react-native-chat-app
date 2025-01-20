# React Native Chat App

A real-time chat application built with React Native CLI. This app supports both iOS and Android platforms with features like real-time messaging, image sharing and file sharing.

## 🌟 Features

- Real-time messaging using Socket.IO
- File and image sharing
- Cross-platform (iOS & Android)
- Redux state management
- AsyncStorage for local data persistence
- Toast notifications


## 📱 Backend Server

This app requires a backend server. The server repository can be found at:
[React Native Chat App Server](https://github.com/Moazam05/react-native-chat-app-server)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/Moazam05/react-native-chat-app.git
cd react-native-chat-app
```

2. Install dependencies:
```bash
npm install
```

3. iOS specific setup:
```bash
cd ios
pod install
cd ..
```

4. Create a `.env` file in the root directory:
```env
# Android URLs
ANDROID_API_URL='[your-network-ip-addresss]:5000/api/v1/'
ANDROID_SOCKET_URL='[your-network-ip-addresss]:5000'

# iOS URLs
IOS_API_URL='http://localhost:5000/api/v1/'
IOS_SOCKET_URL='http://localhost:5000'
```

## 🏃‍♂️ Running the App

### iOS
```bash
# Normal run
npm run ios

# Clean build
npm run ios-clean
```

### Android
```bash
# Normal run
npm run android

# Clean build
npm run android-clean
```

### Metro Bundler
```bash
npm start
```


## 📱 Supported Platforms

- iOS: Tested on iOS 13 and above
- Android: API level 21 (Android 5.0) and above

## 🔧 Environment Setup

For development:
- iOS: Uses localhost URLs (http://localhost:5000)
- Android: Uses your network IP address (Example: http://192.168.100.2:5000)
  - To find your IP address:
    - Windows: Run `ipconfig` in CMD
    - Mac/Linux: Run `ifconfig` in terminal
  - Replace `[your-network-ip-addresss]` in .env file with your actual IP address

Note: Make sure your backend server is running on port 5000 before starting the app.

## Author

Salman Muazam

## 🔗 Links

- [Backend Repository](https://github.com/Moazam05/react-native-chat-app-server)
- [React Native Documentation](https://reactnative.dev/)

## Screenshots

![Not Found](https://i.postimg.cc/htTydsYf/1.jpg)
![Not Found](https://i.postimg.cc/GmwzdYpr/2.jpg)
![Not Found](https://i.postimg.cc/YSt3mHgs/3.jpg)
![Not Found](https://i.postimg.cc/hhF84WcM/4.jpg)
![Not Found](https://i.postimg.cc/SN836m2S/5.jpg)
![Not Found](https://i.postimg.cc/DzfN3sC0/6.jpg)
![Not Found](https://i.postimg.cc/9098YBf8/7.jpg)
