import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const API = `${API_BASE_URL}/students`;

function fetchStudents() {
  return axios.get(API);
}

function getErrorMessage(error, fallback) {
  if (error.response) {
    return error.response.data?.message || fallback;
  }
  return "Could not connect to the server. Check that the backend is running, then try again.";
}

function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [age, setAge] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [listError, setListError] = useState("");
  const [message, setMessage] = useState(null);

  const getStudents = async () => {
    setIsLoading(true);
    setListError("");
    try {
      const response = await fetchStudents();
      setStudents(response.data);
    } catch (error) {
      setListError(getErrorMessage(error, "We could not load the student list."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    fetchStudents()
      .then((response) => {
        if (isCurrent) {
          setStudents(response.data);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setListError(getErrorMessage(error, "We could not load the student list."));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const clearForm = () => {
    setName("");
    setCourse("");
    setAge("");
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const student = { name: name.trim(), course: course.trim(), age: Number(age) };
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, student);
        setMessage({ type: "success", text: `${student.name}’s record has been updated.` });
      } else {
        await axios.post(API, student);
        setMessage({ type: "success", text: `${student.name} has been added to the list.` });
      }
      clearForm();
      await getStudents();
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "We could not save this student. Please try again."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (student) => {
    setName(student.name);
    setCourse(student.course);
    setAge(String(student.age));
    setEditingId(student._id);
    setMessage({ type: "info", text: `You’re editing ${student.name}’s record.` });
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name}’s record? This cannot be undone.`)) {
      return;
    }

    setDeletingId(student._id);
    setMessage(null);
    try {
      await axios.delete(`${API}/${student._id}`);
      setMessage({ type: "success", text: `${student.name}’s record has been deleted.` });
      await getStudents();
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "We could not delete this student. Please try again."),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    clearForm();
    setMessage({ type: "info", text: "Editing cancelled. Your student list was not changed." });
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">SR</div>
        <div>
          <p className="eyebrow">STUDENT RECORDS</p>
          <h1>Student Management</h1>
          <p className="header-description">
            Keep student details organized in one simple place.
          </p>
        </div>
      </header>

      <main className="content">
        {message && (
          <div className={`notice notice-${message.type}`} role="status" aria-live="polite">
            <span>{message.text}</span>
            <button
              className="notice-dismiss"
              type="button"
              aria-label="Dismiss message"
              onClick={() => setMessage(null)}
            >
              ×
            </button>
          </div>
        )}

        <section className="card form-card" aria-labelledby="form-title">
          <div className="section-heading">
            <span className="step-number" aria-hidden="true">1</span>
            <div>
              <h2 id="form-title">{editingId ? "Update a student" : "Add a student"}</h2>
              <p>
                {editingId
                  ? "Change the details below, then save your update."
                  : "Fill in these three details to create a student record."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-fields">
              <div className="field">
                <label htmlFor="student-name">Full name</label>
                <input
                  id="student-name"
                  type="text"
                  placeholder="For example, Alex Santos"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  maxLength={100}
                  required
                  disabled={isSaving}
                />
              </div>
              <div className="field">
                <label htmlFor="student-course">Course or program</label>
                <input
                  id="student-course"
                  type="text"
                  placeholder="For example, Information Technology"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  maxLength={100}
                  required
                  disabled={isSaving}
                />
              </div>
              <div className="field age-field">
                <label htmlFor="student-age">Age</label>
                <input
                  id="student-age"
                  type="number"
                  placeholder="e.g. 20"
                  min="1"
                  max="150"
                  step="1"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  inputMode="numeric"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : editingId ? "Save changes" : "Add student"}
              </button>
              {editingId && (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              )}
              <p className="form-hint">All fields are required.</p>
            </div>
          </form>
        </section>

        <section className="card list-card" aria-labelledby="list-title">
          <div className="section-heading list-heading">
            <span className="step-number" aria-hidden="true">2</span>
            <div>
              <h2 id="list-title">Your student list</h2>
              <p>View, update, or remove a student record.</p>
            </div>
            <span className="student-count" aria-label={`${students.length} students`}>
              {students.length} {students.length === 1 ? "student" : "students"}
            </span>
          </div>

          {isLoading ? (
            <p className="list-state" role="status">Loading student records…</p>
          ) : listError ? (
            <div className="list-state list-error" role="alert">
              <p>{listError}</p>
              <button className="button button-secondary" type="button" onClick={getStudents}>
                Try again
              </button>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">+</span>
              <h3>Your list is ready</h3>
              <p>Add your first student using the form above. Their details will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <caption className="sr-only">Saved student records</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Course or program</th>
                    <th scope="col">Age</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="student-name">{student.name}</td>
                      <td>{student.course}</td>
                      <td>{student.age}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="button button-small button-secondary"
                            type="button"
                            onClick={() => handleEdit(student)}
                          >
                            Edit
                          </button>
                          <button
                            className="button button-small button-danger"
                            type="button"
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === student._id}
                          >
                            {deletingId === student._id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer>Student Management <span aria-hidden="true">·</span> Simple, organized records</footer>
    </div>
  );
}

export default App;
