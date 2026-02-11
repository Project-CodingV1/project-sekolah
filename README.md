# 1. Install dependencies

npm install

# 2. Setup Firebase

# - Buat project di Firebase Console

# - Enable Authentication (Email/Password)

# - Enable Firestore Database

# - Copy config ke .env file

# - Deploy security rules:

firebase deploy --only firestore:rules

# 3. Jalankan aplikasi development

npm run dev

# 4. Untuk production build

npm run build
npm run preview
