import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button, Nav } from 'react-bootstrap';
import { Upload, PencilSquare, InfoCircleFill, CalendarEvent } from 'react-bootstrap-icons';
import api from '../../api';

function LecturerDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [specialSchedules, setSpecialSchedules] = useState([]); // New state for special classes
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  
  const [showModal, setShowModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setIsLoading(true);
    try {
      const res = await api.get('/api/lecturer/dashboard-data');
      setSchedule(res.data.weekly_schedule);
      setSpecialSchedules(res.data.special_schedules); // Set the new state
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  const handleShowModal = (attendanceRecord) => {
    setSelectedAttendance(attendanceRecord);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAttendance(null);
    setSelectedFile(null);
    setComment('');
  };
  
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmitExcuse = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warn('Please select a PDF file to upload.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('comment', comment);

    try {
      await api.post(`/api/lecturer/attendance/${selectedAttendance.id}/excuse`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Excuse uploaded successfully!');
      handleCloseModal();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to upload excuse');
    } finally {
      setIsUploading(false);
    }
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const classesForDay = schedule.filter(s => s.day_of_week === activeDay);

  return (
    <>
      <div className="container-fluid p-4">
        <h1 className="h2 mb-4 fw-bold">Lecturer Dashboard</h1>
        
        {specialSchedules.length > 0 && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0"><CalendarEvent className="me-2"/>Upcoming Special Classes</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {specialSchedules.map(s => (
                  <li key={s.id} className="list-group-item">
                    <strong>{s.subject_name}</strong> on {new Date(s.class_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <br />
                    <small className="text-muted">{s.start_time} - {s.end_time}</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-header">
            <Nav variant="tabs" activeKey={activeDay} onSelect={(k) => setActiveDay(k)}>
              {daysOfWeek.map(day => (
                <Nav.Item key={day}><Nav.Link eventKey={day}>{day}</Nav.Link></Nav.Item>
              ))}
            </Nav>
          </div>
          <div className="card-body">
            {isLoading ? <p>Loading schedule...</p> : (
              classesForDay.length === 0 ? (
                <p className="text-muted text-center p-3">No classes scheduled for {activeDay}.</p>
              ) : (
                classesForDay.map(s => (
                  <div key={s.id} className="mb-4">
                    <h5>{s.subject_name}</h5>
                    <p className="text-muted mb-2"><em>For Program: {s.program_name}</em></p>
                    <p className="text-muted">{s.start_time} - {s.end_time}</p>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th className="text-center">Status</th>
                            <th>Recorded By (CR)</th>
                            <th className="text-center">Excuse</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.attendance_history.length === 0 ? (
                            <tr><td colSpan="5" className="text-center text-muted fst-italic">No attendance records yet.</td></tr>
                          ) : (
                            s.attendance_history.map(att => (
                              <tr key={att.id}>
                                <td>{new Date(att.timestamp).toLocaleDateString()}</td>
                                <td className="text-center">
                                  {att.present ? <span className="badge bg-success">Present</span> : <span className="badge bg-danger">Absent</span>}
                                </td>
                                <td>{att.cr_name}</td>
                                <td className="text-center">
                                  {att.excuse_file ? <span className="badge bg-info">Submitted</span> : <span className="badge bg-secondary">None</span>}
                                </td>
                                <td className="text-center">
                                  {!att.present && !att.excuse_file && (
                                    <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(att)}>
                                      <PencilSquare className="me-1"/> Submit Excuse
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton><Modal.Title>Submit Excuse</Modal.Title></Modal.Header>
        <form onSubmit={handleSubmitExcuse}>
          <Modal.Body>
            <p className="text-muted">For absence on <strong>{new Date(selectedAttendance?.timestamp).toLocaleString()}</strong></p>
            <div className="alert alert-warning d-flex align-items-center"><InfoCircleFill className="me-2"/><div>Excuse must be a PDF and submitted within 24 hours.</div></div>
            <div className="mb-3"><label htmlFor="pdfFile" className="form-label"><Upload className="me-2"/>Excuse PDF</label><input type="file" accept="application/pdf" className="form-control" id="pdfFile" onChange={handleFileChange} required/></div>
            <div className="mb-3"><label htmlFor="comment" className="form-label">Optional Comment</label><textarea id="comment" className="form-control" value={comment} onChange={(e) => setComment(e.target.value)} rows="3" placeholder="Provide a brief reason..."/></div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Submit Excuse'}</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}

export default LecturerDashboard;