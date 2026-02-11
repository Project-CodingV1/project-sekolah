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



Buat Super Admin secara manual di Firebase Console:

Buka Authentication → Tambah user

Buka Firestore → Collection users → Create document dengan ID sama dengan UID user

Data user:

json
{
  "name": "Super Admin",
  "email": "superadmin@sekolahapp.com",
  "role": "super_admin",
  "created_at": serverTimestamp(),
  "updated_at": serverTimestamp()
}
Login sebagai Super Admin dan buat sekolah pertama:

Email: superadmin@sekolahapp.com

Password: (sesuai yang dibuat di Firebase Console)

Buat admin sekolah melalui interface Super Admin

Login sebagai admin sekolah untuk setup data sekolah

STRUKTUR FILE LENGKAP YANG DIBUAT
text
src/
 ├─ assets/
 ├─ components/
 │   ├─ Sidebar.jsx
 │   ├─ BottomNav.jsx
 │   ├─ ProtectedRoute.jsx
 │   └─ Loader.jsx
 │
 ├─ pages/
 │   ├─ auth/
 │   │   └─ Login.jsx
 │   │
 │   ├─ superadmin/
 │   │   ├─ Schools.jsx
 │   │   ├─ Packages.jsx
 │   │   ├─ Monitoring.jsx
 │   │   └─ Settings.jsx
 │   │
 │   ├─ admin/
 │   │   ├─ Master.jsx
 │   │   ├─ Academic.jsx
 │   │   ├─ Attendance.jsx
 │   │   ├─ Grades.jsx
 │   │   ├─ Finance.jsx
 │   │   └─ Announcements.jsx
 │   │
 │   ├─ guru/
 │   │   ├─ TeacherClasses.jsx
 │   │   ├─ TeacherAttendance.jsx
 │   │   ├─ TeacherGrades.jsx
 │   │   └─ TeacherSchedule.jsx
 │   │
 │   ├─ murid/
 │   │   ├─ StudentClasses.jsx
 │   │   ├─ StudentSchedule.jsx
 │   │   ├─ StudentGrades.jsx
 │   │   ├─ StudentAttendance.jsx
 │   │   └─ StudentPayments.jsx
 │   │
 │   └─ orangtua/
 │       ├─ ParentChildren.jsx
 │       ├─ ParentAttendance.jsx
 │       ├─ ParentGrades.jsx
 │       ├─ ParentAnnouncements.jsx
 │       └─ ParentPayments.jsx
 │
 ├─ context/
 │   ├─ AuthContext.jsx
 │   └─ SchoolContext.jsx
 │
 ├─ firebase/
 │   ├─ firebaseConfig.js
 │   ├─ authService.js
 │   └─ firestoreService.js
 │
 ├─ routes/
 │   └─ AppRoutes.jsx
 │
 ├─ hooks/
 │   └─ useAuth.js
 │
 ├─ App.jsx
 ├─ main.jsx
 └─ index.css