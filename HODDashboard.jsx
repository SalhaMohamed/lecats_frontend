import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Nav, Button } from 'react-bootstrap';
import { CalendarPlus, Table, CheckCircleFill, Download, Clipboard2Check, Trash } from 'react-bootstrap-icons';
import api from '../../api';

function HODDashboard() {
  const [view, setView] = useState('timetable');
  
  // State for Timetable Management
  const [schedules, setSchedules] = useState([]);
  const [specialSchedules, setSpecialSchedules] = useState([]); // New state for special classes
  const [subjects, setSubjects] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [scheduleFormData, setScheduleFormData] = useState({
    subject_id: '',
    lecturer_id: '',
    day_of_week: 'Monday',
    start_time: '',
    end_time: ''
  });
  const [specialScheduleFormData, setSpecialScheduleFormData] = useState({
    subject_id: '',
    lecturer_id: '',
    class_date: '',
    start_time: '',
    end_time: '',
    target_department_id: ''
  });
  
  // State for Pending Verifications
  const [pendingAttendances, setPendingAttendances] = useState([]);

  useEffect(() => {
    fetchHODData();
    fetchSchedules();
    fetchPending();
    fetchDepartments();
  }, []);
  
  async function fetchHODData() {
    try {
      const res = await api.get('/api/hod/data-for-timetable');
      setSubjects(res.data.subjects);
      setLecturers(res.data.lecturers);
    } catch (error) {
      toast.error('Failed to fetch subjects and lecturers');
    }
  }

  async function fetchSchedules() {
    try {
      const res = await api.get('/api/hod/schedules');
      setSchedules(res.data.weekly_schedules);
      setSpecialSchedules(res.data.special_schedules); // Set the new state
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to fetch schedules');
    }
  }

  async function fetchPending() {
    try {
      const res = await api.get('/api/hod/attendance/pending');
      setPendingAttendances(res.data);
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to fetch pending attendance');
    }
  }

  async function fetchDepartments() {
    try {
      const res = await api.get('/api/departments');
      setDepartments(res.data);
    } catch (error) {
      toast.error("Could not load departments");
    }
  }

  const handleScheduleFormChange = (e) => {
    setScheduleFormData({ ...scheduleFormData, [e.target.name]: e.target.value });
  };
  
  const handleSpecialScheduleFormChange = (e) => {
    setSpecialScheduleFormData({ ...specialScheduleFormData, [e.target.name]: e.target.value });
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/hod/schedules', scheduleFormData);
      toast.success('Class added to timetable successfully!');
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to schedule class');
    }
  };

  const handleAddSpecialSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/hod/special-schedules', specialScheduleFormData);
      toast.success('Special class scheduled successfully!');
      fetchSchedules(); // Refresh to show new special class
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to schedule special class');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (window.confirm('Are you sure you want to remove this class from the schedule?')) {
      try {
        await api.delete(`/api/hod/schedules/${id}`);
        toast.success('Scheduled class deleted successfully!');
        fetchSchedules();
      } catch (error) {
        toast.error(error.response?.data?.msg || 'Failed to delete scheduled class');
      }
    }
  };

  const handleDeleteSpecialSchedule = async (id) => {
    if (window.confirm('Are you sure you want to delete this special class?')) {
      try {
        await api.delete(`/api/hod/special-schedules/${id}`);
        toast.success('Special class deleted!');
        fetchSchedules(); // Refresh both lists
      } catch (error) {
        toast.error(error.response?.data?.msg || 'Failed to delete special class');
      }
    }
  };

  const handleVerify = async (id) => {
    if (window.confirm('Are you sure you want to verify this attendance record?')) {
      try {
        await api.post(`/api/hod/attendance/verify/${id}`);
        toast.success('Attendance verified successfully!');
        fetchPending();
      } catch (error) {
        toast.error(error.response?.data?.msg || 'Failed to verify attendance');
      }
    }
  };

  const renderTimetableManager = () => (
    <>
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center"><CalendarPlus size={20} className="me-2"/><h5 className="mb-0">Schedule a Regular (Weekly) Class</h5></div>
        <div className="card-body">
          <form onSubmit={handleAddSchedule} className="row g-3 align-items-end">
            <div className="col-md-4"><label htmlFor="subject_id" className="form-label">Subject</label><select name="subject_id" className="form-select" onChange={handleScheduleFormChange} required><option value="">-- Select Subject --</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="col-md-3"><label htmlFor="lecturer_id" className="form-label">Lecturer</label><select name="lecturer_id" className="form-select" onChange={handleScheduleFormChange} required><option value="">-- Select Lecturer --</option>{lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}</select></div>
            <div className="col-md-2"><label htmlFor="day_of_week" className="form-label">Day</label><select name="day_of_week" className="form-select" onChange={handleScheduleFormChange}><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select></div>
            <div className="col-md-3 row g-2"><div className="col-6"><label htmlFor="start_time" className="form-label">From</label><input type="time" name="start_time" className="form-control" onChange={handleScheduleFormChange} required/></div><div className="col-6"><label htmlFor="end_time" className="form-label">To</label><input type="time" name="end_time" className="form-control" onChange={handleScheduleFormChange} required/></div></div>
            <div className="col-12 text-end"><button className="btn btn-primary" type="submit">Add to Schedule</button></div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center">
          <CalendarPlus size={20} className="me-2 text-warning"/>
          <h5 className="mb-0">Schedule a Special (One-Time) Class</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddSpecialSchedule} className="row g-3 align-items-end">
            <div className="col-md-6 col-lg-3"><label className="form-label">Subject</label><select name="subject_id" className="form-select" onChange={handleSpecialScheduleFormChange} required><option value="">-- Select Subject --</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="col-md-6 col-lg-3"><label className="form-label">Lecturer</label><select name="lecturer_id" className="form-select" onChange={handleSpecialScheduleFormChange} required><option value="">-- Select Lecturer --</option>{lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}</select></div>
            <div className="col-md-6 col-lg-3"><label className="form-label">Target Department (for CR)</label><select name="target_department_id" className="form-select" onChange={handleSpecialScheduleFormChange} required><option value="">-- Select Department --</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="col-md-6 col-lg-3"><label className="form-label">Date</label><input type="date" name="class_date" className="form-control" onChange={handleSpecialScheduleFormChange} required/></div>
            <div className="col-md-8 col-lg-3"><div className="row g-2"><div className="col-6"><label className="form-label">From</label><input type="time" name="start_time" className="form-control" onChange={handleSpecialScheduleFormChange} required/></div><div className="col-6"><label className="form-label">To</label><input type="time" name="end_time" className="form-control" onChange={handleSpecialScheduleFormChange} required/></div></div></div>
            <div className="col-12 text-end"><button className="btn btn-warning" type="submit">Add Special Schedule</button></div>
          </form>
        </div>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-header d-flex align-items-center"><Table size={20} className="me-2"/><h5 className="mb-0">Current Weekly Timetable (Active Semester)</h5></div>
        <div className="card-body p-0"><div className="table-responsive"><table className="table table-striped mb-0 align-middle">
            <thead className="table-light"><tr><th>Subject</th><th>Lecturer</th><th>Day</th><th>Time</th><th className="text-center">Action</th></tr></thead>
            <tbody>{schedules.length > 0 ? schedules.map(s => (<tr key={s.id}><td><strong>{s.subject_name}</strong></td><td>{s.lecturer_name}</td><td>{s.day_of_week}</td><td>{s.start_time} - {s.end_time}</td><td className="text-center"><button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteSchedule(s.id)}><Trash/></button></td></tr>)) : <tr><td colSpan="5" className="text-center text-muted p-4">No classes scheduled yet.</td></tr>}</tbody>
        </table></div></div>
      </div>
      
      <div className="card shadow-sm mt-4">
        <div className="card-header bg-warning d-flex align-items-center"><Table size={20} className="me-2"/><h5 className="mb-0">Upcoming Special Schedules</h5></div>
        <div className="card-body p-0"><div className="table-responsive"><table className="table table-striped mb-0 align-middle">
            <thead className="table-light"><tr><th>Subject</th><th>Lecturer</th><th>Date</th><th>Time</th><th className="text-center">Action</th></tr></thead>
            <tbody>{specialSchedules.length > 0 ? specialSchedules.map(s => (<tr key={s.id}><td><strong>{s.subject_name}</strong></td><td>{s.lecturer_name}</td><td>{s.class_date}</td><td>{s.start_time} - {s.end_time}</td><td className="text-center"><button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteSpecialSchedule(s.id)}><Trash/></button></td></tr>)) : <tr><td colSpan="5" className="text-center text-muted p-4">No special classes scheduled.</td></tr>}</tbody>
        </table></div></div>
      </div>
    </>
  );

  const renderPendingVerifications = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-light d-flex justify-content-between align-items-center"><h5 className="mb-0">Pending Attendance Verification</h5><span className="badge bg-warning text-dark rounded-pill">{pendingAttendances.length} Pending</span></div>
      <div className="card-body p-0">
        {pendingAttendances.length === 0 ? (<div className="text-center p-5"><Clipboard2Check size={40} className="mb-3 text-success"/><h4>All Caught Up!</h4><p className="text-muted">No pending records to verify.</p></div>) : (<div className="table-responsive"><table className="table table-striped table-hover mb-0 align-middle">
            <thead className="table-dark"><tr><th>Course</th><th>Lecturer</th><th>CR</th><th className="text-center">Status</th><th>Submitted On</th><th>Excuse File</th><th className="text-center">Action</th></tr></thead>
            <tbody>{pendingAttendances.map((att) => (<tr key={att.id}><td><strong>{att.course}</strong></td><td>{att.lecturer_name}</td><td>{att.cr_name}</td><td className="text-center">{att.present ? <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Present</span> : <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">Absent</span>}</td><td>{new Date(att.timestamp).toLocaleString()}</td><td className="text-center">{att.excuse_file ? (<a href={`http://localhost:5000/uploads/${att.excuse_file}`} target="_blank" rel="noreferrer" className="btn btn-outline-info btn-sm"><Download size={14} className="me-1"/> View PDF</a>) : ( <span className="text-muted">-</span> )}</td><td className="text-center"><button className="btn btn-success btn-sm" onClick={() => handleVerify(att.id)}><CheckCircleFill size={14} className="me-1" /> Verify</button></td></tr>))}</tbody>
        </table></div>)}
      </div>
    </div>
  );

  return (
    <div className="container-fluid p-4">
      <h1 className="h2 mb-4 fw-bold">HOD Dashboard</h1>
      <Nav variant="pills" activeKey={view} onSelect={(selectedKey) => setView(selectedKey)} className="mb-3">
        <Nav.Item><Nav.Link eventKey="timetable">Timetable Manager</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="verification">Pending Verifications <span className="badge bg-danger ms-1">{pendingAttendances.length}</span></Nav.Link></Nav.Item>
      </Nav>

      {view === 'timetable' && renderTimetableManager()}
      {view === 'verification' && renderPendingVerifications()}
    </div>
  );
}

export default HODDashboard;