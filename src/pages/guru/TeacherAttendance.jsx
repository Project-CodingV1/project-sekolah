import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  isAfter,
  startOfDay,
} from "date-fns";
import { id } from "date-fns/locale";
import { firestoreService } from "../../firebase/firestoreService";
import { useAuth } from "../../context/AuthContext";

const TeacherAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lockedAttendance, setLockedAttendance] = useState({});
  const { userData } = useAuth();

  // Real-time listener untuk kelas yang diampu guru
  useEffect(() => {
    if (!userData?.school_id || !userData?.id) return;

    const unsubscribe = firestoreService.listenToCollection(
      "classes",
      [
        { field: "school_id", operator: "==", value: userData.school_id },
        { field: "teacher_id", operator: "==", value: userData.id },
      ],
      (data) => {
        setClasses(data);
        if (data.length > 0 && !selectedClass) {
          setSelectedClass(data[0].id);
        }
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userData?.school_id, userData?.id]);

  // Ambil siswa berdasarkan kelas terpilih
  useEffect(() => {
    if (!selectedClass || !userData?.school_id) return;

    const fetchStudents = async () => {
      setLoading(true);
      const studentsData = await firestoreService.queryDocuments(
        "users",
        [
          { field: "school_id", operator: "==", value: userData.school_id },
          { field: "class_id", operator: "==", value: selectedClass },
          { field: "role", operator: "==", value: "student" },
          { field: "status", operator: "==", value: "active" },
        ],
        "name",
      );
      setStudents(studentsData);
      setLoading(false);
    };

    fetchStudents();
  }, [selectedClass, userData?.school_id]);

  // Ambil data absensi untuk tanggal terpilih
  useEffect(() => {
    if (
      !selectedClass ||
      !selectedDate ||
      !userData?.school_id ||
      students.length === 0
    )
      return;

    const fetchAttendance = async () => {
      const attendanceData = await firestoreService.queryDocuments(
        "attendance",
        [
          { field: "school_id", operator: "==", value: userData.school_id },
          { field: "class_id", operator: "==", value: selectedClass },
          { field: "date", operator: "==", value: selectedDate },
        ],
      );

      // Format attendance data untuk state
      const attendanceMap = {};
      const lockMap = {};
      attendanceData.forEach((record) => {
        attendanceMap[record.student_id] = record.status;
        lockMap[record.student_id] = true;
      });

      // Set default attendance untuk siswa yang belum punya data
      students.forEach((student) => {
        if (!attendanceMap[student.id]) {
          attendanceMap[student.id] = "HADIR"; // Default value
        }
      });

      setAttendance(attendanceMap);
      setLockedAttendance(lockMap);
    };

    fetchAttendance();
  }, [selectedClass, selectedDate, userData?.school_id, students]);

  const handleAttendanceChange = (studentId, status) => {
    if (lockedAttendance[studentId]) return;
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleDateChange = (value) => {
    const today = startOfDay(new Date());
    const selected = startOfDay(new Date(value));

    if (isAfter(selected, today)) return;

    setSelectedDate(value);
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedDate || !userData?.school_id) {
      alert("Data tidak lengkap");
      return;
    }

    setSaving(true);

    try {
      const batchOperations = [];

      // Proses setiap siswa
      for (const studentId in attendance) {
        const attendanceId = `attendance_${selectedDate}_${selectedClass}_${studentId}`;
        const status = attendance[studentId];

        // Cek apakah sudah ada data absensi
        const existingAttendance = await firestoreService.getDocument(
          "attendance",
          attendanceId,
        );

        if (existingAttendance) {
          // Update existing
          batchOperations.push({
            type: "set",
            collection: "attendance",
            id: attendanceId,
            data: {
              status: status,
              updated_by: userData.id,
            },
          });
        } else {
          // Create new
          batchOperations.push({
            type: "set",
            collection: "attendance",
            id: attendanceId,
            data: {
              student_id: studentId,
              class_id: selectedClass,
              date: selectedDate,
              status: status,
              recorded_by: userData.id,
              school_id: userData.school_id,
            },
          });
        }
      }

      // Eksekusi batch operations
      await firestoreService.batchUpdate(batchOperations);
      const lockMap = {};
      Object.keys(attendance).forEach((studentId) => {
        lockMap[studentId] = true;
      });
      setLockedAttendance(lockMap);
      alert("Absensi berhasil disimpan");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Gagal menyimpan absensi");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      HADIR: "bg-green-100 text-green-800 border-green-200",
      IZIN: "bg-blue-100 text-blue-800 border-blue-200",
      SAKIT: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ALFA: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const isFutureDate = isAfter(
    startOfDay(new Date(selectedDate)),
    startOfDay(new Date()),
  );

  // Generate week dates
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 6 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: date,
      formatted: format(date, "yyyy-MM-dd"),
      display: format(date, "EEE", { locale: id }),
      isToday: isToday(date),
      isFuture: isAfter(startOfDay(date), today),
    };
  });

  if (loading && classes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Absensi Siswa</h2>
        <p className="text-gray-600 mt-1">Checklist kehadiran siswa per hari</p>
      </div>

      {/* Controls */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pilih Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field"
            disabled={classes.length === 0}
          >
            {classes.length === 0 ? (
              <option value="">Tidak ada kelas yang diampu</option>
            ) : (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.grade_level}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            value={selectedDate}
            max={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={saveAttendance}
            disabled={
              saving || isFutureDate || !selectedClass || students.length === 0
            }
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan Absensi"}
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card">
        <h3 className="font-medium text-gray-900 mb-3">Minggu Ini</h3>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {weekDates.map((day) => (
            <button
              key={day.formatted}
              onClick={() => day.isFuture && setSelectedDate(day.formatted)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border
                ${
                  day.isFuture
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : selectedDate === day.formatted
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
                  
                  ${
                    day.isToday ? "ring-2 ring-primary-500 ring-offset-2" : ""
                  }`}
            >
              <div className="text-sm font-medium">{day.display}</div>
              <div className="text-xs text-gray-500">
                {format(day.date, "dd/MM")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      {students.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NIS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Kehadiran
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.nis || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {["HADIR", "IZIN", "SAKIT", "ALFA"].map((status) => {
                          const isSelected = attendance[student.id] === status;
                          const isLocked = lockedAttendance[student.id];

                          return (
                            <button
                              key={status}
                              disabled={isLocked}
                              onClick={() =>
                                handleAttendanceChange(student.id, status)
                              }
                              className={`px-3 py-1 text-sm rounded-full border transition-colors
          ${
            isSelected
              ? getStatusColor(status)
              : "bg-white text-gray-700 border-gray-300"
          }
          ${isLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"}
        `}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="text-center py-8 text-gray-500">
          Tidak ada siswa di kelas ini
        </div>
      ) : null}
    </div>
  );
};

export default TeacherAttendance;
