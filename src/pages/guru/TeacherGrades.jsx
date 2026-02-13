import React, { useState, useEffect } from "react";
import { firestoreService } from "../../firebase/firestoreService";
import { useAuth } from "../../context/AuthContext";

const TeacherGrades = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [gradeData, setGradeData] = useState({});
  const [openInput, setOpenInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.school_id || !userData?.id) return;

    const fetchData = async () => {
      try {
        // Fetch classes taught by this teacher
        const classesData = await firestoreService.queryDocuments(
          "classes",
          [
            { field: "school_id", operator: "==", value: userData.school_id },
            { field: "teacher_id", operator: "==", value: userData.id },
          ],
          "grade_level",
        );
        setClasses(classesData);

        // Fetch subjects
        const subjectsData = await firestoreService.queryDocuments(
          "subjects",
          [{ field: "school_id", operator: "==", value: userData.school_id }],
          "name",
        );
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.school_id, userData?.id]);

  useEffect(() => {
    if (!selectedClass || !userData?.school_id) return;

    const fetchStudents = async () => {
      const studentsData = await firestoreService.queryDocuments(
        "users",
        [
          { field: "school_id", operator: "==", value: userData.school_id },
          { field: "class_id", operator: "==", value: selectedClass },
          { field: "role", operator: "==", value: "student" },
        ],
        "name",
      );
      setStudents(studentsData);
    };

    fetchStudents();
  }, [selectedClass, userData?.school_id]);

  useEffect(() => {
    if (!selectedClass || !selectedSubject || !userData?.school_id) return;

    const fetchGrades = async () => {
      const gradesData = await firestoreService.queryDocuments("grades", [
        { field: "school_id", operator: "==", value: userData.school_id },
        { field: "class_id", operator: "==", value: selectedClass },
        { field: "subject_id", operator: "==", value: selectedSubject },
      ]);

      const gradeMap = {};
      gradesData.forEach((grade) => {
        gradeMap[grade.student_id] = grade;
      });

      setGrades(gradeMap);
      setGradeData({
        ...gradeMap,
      });
    };

    fetchGrades();
  }, [selectedClass, selectedSubject, userData?.school_id]);

  const calculateTotalGrade = (assignment, midterm, final) => {
    const assignmentScore = parseFloat(assignment) || 0;
    const midtermScore = parseFloat(midterm) || 0;
    const finalScore = parseFloat(final) || 0;

    const total = assignmentScore * 0.3 + midtermScore * 0.3 + finalScore * 0.4;
    return total.toFixed(1);
  };

  const getGradeColor = (score) => {
    const numericScore = parseFloat(score);
    if (numericScore >= 85) return "bg-green-100 text-green-800";
    if (numericScore >= 70) return "bg-blue-100 text-blue-800";
    if (numericScore >= 55) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const handleGradeChange = async (studentId, type, value) => {
    setGradeData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [type]: value,
        total: calculateTotalGrade(
          type === "assignment" ? value : prev[studentId]?.assignment,
          type === "midterm" ? value : prev[studentId]?.midterm,
          type === "final" ? value : prev[studentId]?.final,
        ),
      },
    }));
  };

  const saveGrades = async () => {
    if (!selectedClass || !selectedSubject) return;
    setSaving(true);
    try {
      const batch = [];
      const updatedGradesMap = {};

      for (const studentId in gradeData) {
        const gradeId = `grade_${selectedClass}_${selectedSubject}_${studentId}`;
        const g = gradeData[studentId];

        const existing = await firestoreService.getDocument("grades", gradeId);

        const payload = {
          student_id: studentId,
          class_id: selectedClass,
          subject_id: selectedSubject,
          assignment: g.assignment || "",
          midterm: g.midterm || "",
          final: g.final || "",
          total: g.total || "",
          school_id: userData.school_id,
          updated_by: userData.id,
        };

        if (existing) {
          batch.push({
            type: "update",
            collection: "grades",
            id: gradeId,
            data: payload,
          });
        } else {
          batch.push({
            type: "set",
            collection: "grades",
            id: gradeId,
            data: {
              ...payload,
              recording_by: userData.id,
              created_at: new Date(),
            },
          });
        }
        updatedGradesMap[studentId] = payload;
      }
      await firestoreService.batchUpdate(batch);
      setGrades(updatedGradesMap);
      setGradeData(updatedGradesMap);
      setOpenInput(false);
      alert("nilai berhasil di simpan");
    } catch (error) {
      alert("gagal menyimpan nilai");
      console.error("error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Input Nilai Siswa
          </h2>
          <p className="text-gray-600 mt-1">
            Input dan perbarui nilai untuk mata pelajaran yang Anda ajar
          </p>
        </div>
        <button
          onClick={() => setOpenInput((prev) => !prev)}
          className={`rounded-xl p-4 font-medium text-white ${
            openInput ? "bg-gray-500 hover:bg-gray-600" : "btn-primary"
          }`}
        >
          {openInput ? "Batal" : "Update Nilai"}
        </button>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <option value="">Pilih Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.grade_level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mata Pelajaran
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input-field"
            disabled={subjects.length === 0}
          >
            <option value="">Pilih Mata Pelajaran</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grades Table */}
      {selectedClass && selectedSubject && (
        <div className="card flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tugas (30%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UTS (30%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UAS (40%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nilai Akhir
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Predikat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const grade = gradeData[student.id] || {};
                  const totalScore = parseFloat(grade.total) || 0;

                  const getPredicate = (score) => {
                    if (score >= 85) return "A";
                    if (score >= 70) return "B";
                    if (score >= 55) return "C";
                    if (score >= 0) return "D";
                    return "-";
                  };

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.nis || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          disabled={!openInput}
                          min="0"
                          max="100"
                          value={grade.assignment || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "assignment",
                              e.target.value,
                            )
                          }
                          className={`w-20 px-2 py-1 border rounded text-center ${
                            !openInput ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          placeholder="0-100"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          disabled={!openInput}
                          min="0"
                          max="100"
                          value={grade.midterm || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "midterm",
                              e.target.value,
                            )
                          }
                          className={`w-20 px-2 py-1 border rounded text-center ${
                            !openInput ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          placeholder="0-100"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          disabled={!openInput}
                          min="0"
                          max="100"
                          value={grade.final || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "final",
                              e.target.value,
                            )
                          }
                          className={`w-20 px-2 py-1 border rounded text-center ${
                            !openInput ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          placeholder="0-100"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade.total)}`}
                        >
                          {grade.total || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {getPredicate(totalScore)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {students.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada siswa di kelas ini
              </div>
            )}
          </div>
          {openInput && (
            <button
              onClick={saveGrades}
              className="btn-primary rounded-xl p-4 font-medium text-white self-end"
            >
              {saving ? "Menyimpan" : "Simpan nilai"}
            </button>
          )}
        </div>
      )}

      {/* Grade Summary */}
      {selectedClass && selectedSubject && students.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Statistik Nilai</h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {students.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Siswa</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {
                  students.filter((s) => {
                    const sourceGrades =
                      Object.keys(gradeData).length > 0 ? gradeData : grades;
                    const total = parseFloat(sourceGrades[s.id]?.total) || 0;
                    return total >= 85;
                  }).length
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Nilai A</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {
                  students.filter((s) => {
                    const total = parseFloat(grades[s.id]?.total) || 0;
                    return total >= 70 && total < 85;
                  }).length
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Nilai B</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {
                  students.filter((s) => {
                    const total = parseFloat(grades[s.id]?.total) || 0;
                    return total >= 55 && total < 70;
                  }).length
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Nilai C</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {
                  students.filter((s) => {
                    const total = parseFloat(grades[s.id]?.total) || 0;
                    return total < 55;
                  }).length
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Nilai D</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGrades;
