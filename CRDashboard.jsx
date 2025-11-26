import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ClockHistory, Check2Circle } from 'react-bootstrap-icons';
import api from '../../api'; // Using the central api instance

function CRDashboard() {
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaysSchedule();
  }, []);

  async function fetchTodaysSchedule() {
    setIsLoading(true);
    try {
      // UPDATED to use api instance
      const res = await api.get('/api/cr/todays-schedule');
      setTodaysSchedule(res.data);
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to fetch today\'s schedule');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (scheduleId, isPresent) => {
    try {
      // UPDATED to use api instance
      await api.post('/api/attendance', {
        class_schedule_id: scheduleId,
        present: isPresent,
      });
      toast.success('Attendance submitted successfully!');
      fetchTodaysSchedule();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to submit attendance');
    }
  };
  
  const renderSchedule = () => {
    if (isLoading) {
      return <div className="text-center p-5">Loading schedule...</div>;
    }
    if (todaysSchedule.length === 0) {
      return (
        <div className="text-center p-5">
          <ClockHistory size={40} className="mb-3 text-muted"/>
          <h4>No Classes Scheduled for Today</h4>
          <p className="text-muted">There is nothing to report at the moment.</p>
        </div>
      );
    }
    return (
      <ul className="list-group">
        {todaysSchedule.map((schedule) => (
          <li key={schedule.schedule_id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="mb-2 mb-md-0">
              <div className="fw-bold">{schedule.subject_name}</div>
              <small className="text-muted">{schedule.start_time} - {schedule.end_time} | {schedule.lecturer_name}</small>
            </div>
            <div>
              {schedule.submitted ? (
                <span className="badge bg-success-subtle text-success-emphasis p-2"><Check2Circle className="me-1"/> Submitted</span>
              ) : (
                <div className="btn-group" role="group">
                  <button className="btn btn-outline-success" onClick={() => handleSubmit(schedule.schedule_id, true)}>Present</button>
                  <button className="btn btn-outline-danger" onClick={() => handleSubmit(schedule.schedule_id, false)}>Absent</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow-lg" style={{ width: '40rem', maxWidth: '90vw' }}>
        <div className="card-body p-4 p-md-5">
          <h2 className="card-title text-center fw-bold">Submit Today's Attendance</h2>
          <p className="text-center text-muted mb-4">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {renderSchedule()}
        </div>
      </div>
    </div>
  );
}

export default CRDashboard;