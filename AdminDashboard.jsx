import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button, Form, Accordion, Nav, Tab } from 'react-bootstrap';
import { Trash, Building, CalendarCheck, CheckCircleFill, MortarboardFill, Book, PencilSquare, Power, FileEarmarkPdf } from 'react-bootstrap-icons';
import api from '../../api';
import useDarkMode from '../../useDarkMode';
import ReportCharts from './ReportCharts';

function AdminDashboard() {
  const [theme] = useDarkMode();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [semesterFormData, setSemesterFormData] = useState({ year: new Date().getFullYear(), semester_number: '1', start_date: '', end_date: '' });
  const [programFormData, setProgramFormData] = useState({ name: '', level: 'Degree', department_id: '', duration_in_years: '3' });
  const [subjectFormData, setSubjectFormData] = useState({ name: '', code: '', program_id: '', year_of_study: '1' });
  const [userFormData, setUserFormData] = useState({ full_name: '', email: '', password: '', role: 'CR', department_id: '' });
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [editFormData, setEditFormData] = useState({});
  const [reportFilters, setReportFilters] = useState({ start_date: '', end_date: '', department_id: '' });
  const [reportData, setReportData] = useState(null);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = () => {
    fetchUsers();
    fetchDepartments();
    fetchSemesters();
    fetchPrograms();
    fetchSubjects();
  };

  async function fetchUsers() {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (error) { toast.error('Failed to fetch users'); }
  }
  async function fetchDepartments() {
    try {
      const res = await api.get('/api/departments');
      setDepartments(res.data);
      if (res.data.length > 0) {
        if (!userFormData.department_id) setUserFormData(prev => ({ ...prev, department_id: res.data[0].id }));
        if (!programFormData.department_id) setProgramFormData(prev => ({ ...prev, department_id: res.data[0].id }));
      }
    } catch (error) { toast.error('Failed to fetch departments'); }
  }
  async function fetchSemesters() {
    try {
      const res = await api.get('/api/admin/semesters');
      setSemesters(res.data);
    } catch (error) { toast.error('Failed to fetch semesters'); }
  }
  async function fetchPrograms() {
    try {
      const res = await api.get('/api/admin/programs');
      setPrograms(res.data);
    } catch (error) { toast.error('Failed to fetch programs'); }
  }
  async function fetchSubjects() {
    try {
      const res = await api.get('/api/admin/subjects');
      setSubjects(res.data);
    } catch (error) { toast.error('Failed to fetch subjects'); }
  }
  
  const handleUserFormChange = (e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
  const handleSemesterFormChange = (e) => setSemesterFormData({ ...semesterFormData, [e.target.name]: e.target.value });
  const handleProgramFormChange = (e) => setProgramFormData({ ...programFormData, [e.target.name]: e.target.value });
  const handleSubjectFormChange = (e) => setSubjectFormData({ ...subjectFormData, [e.target.name]: e.target.value });
  const openModal = (type, data) => { setModalState({ isOpen: true, type, data }); setEditFormData(data); };
  const closeModal = () => { setModalState({ isOpen: false, type: null, data: null }); setEditFormData({}); };
  const handleEditFormChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/departments', { name: newDepartmentName });
      toast.success(`Department created!`); setNewDepartmentName(''); fetchDepartments();
    } catch (error) { toast.error(error.response?.data?.msg || 'Failed to create department'); }
  };
   const handleAddSemester = async (e) => {
    e.preventDefault();
    try {
        await api.post('/api/admin/semesters', semesterFormData);
        toast.success('Semester created!'); fetchSemesters();
    } catch (error) { toast.error(error.response?.data?.msg || 'Failed to create semester'); }
  };
  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!programFormData.department_id) { toast.warn("Please select a department."); return; }
    try {
      await api.post('/api/admin/programs', programFormData);
      toast.success("Program created!"); fetchPrograms();
    } catch (error) { toast.error(error.response?.data?.msg || "Failed to create program"); }
  };
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectFormData.program_id) { toast.warn("Please select a program."); return; }
    try {
      await api.post('/api/admin/subjects', subjectFormData);
      toast.success("Subject created!"); fetchSubjects();
    } catch (error) { toast.error(error.response?.data?.msg || "Failed to create subject"); }
  };
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!userFormData.department_id) { toast.error("Please select a department."); return; }
    try {
      await api.post('/api/admin/users', userFormData);
      toast.success('User added!'); fetchUsers();
    } catch (error) { toast.error(error.response?.data?.msg || 'Failed to add user'); }
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    const { type, data } = modalState;
    const endpoint = `/api/admin/${type === 'user' ? 'users' : `${type}s`}/${data.id}`;
    try {
      await api.put(endpoint, editFormData);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated!`);
      closeModal();
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.msg || `Failed to update ${type}`);}
  };

  const handleDelete = async (type, id) => {
    const endpoint = `/api/admin/${type === 'user' ? 'users' : `${type}s`}/${id}`;
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await api.delete(endpoint);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted!`);
        fetchAllData();
      } catch (error) { toast.error(error.response?.data?.msg || `Failed to delete ${type}`);}
    }
  };
  
  const handleActivateSemester = async (id) => {
    if (window.confirm('Are you sure you want to activate this semester?')) {
        try {
            await api.post(`/api/admin/semesters/activate/${id}`);
            toast.success('Semester activated!'); fetchSemesters();
        } catch (error) { toast.error(error.response?.data?.msg || 'Failed to activate semester'); }
    }
  };

  const handleDeactivateSemester = async () => {
    if (window.confirm('Are you sure? This will deactivate the current active semester.')) {
        try {
            await api.post(`/api/admin/semesters/deactivate`);
            toast.success('Semester deactivated!'); fetchSemesters();
        } catch (error) { toast.error(error.response?.data?.msg || 'Failed to deactivate semester'); }
    }
  };
  
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!reportFilters.department_id || !reportFilters.start_date || !reportFilters.end_date) {
      toast.warn("Please select a department and a full date range."); return;
    }
    try {
      const res = await api.post('/api/reports/generate', reportFilters);
      setReportData(res.data);
      toast.success("Report generated successfully!");
    } catch (error) { toast.error(error.response?.data?.msg || "Failed to generate report"); }
  };

  const handleGenerateCsvReport = async () => {
    if (!reportData) {
      toast.warn("Please generate a report first before downloading."); return;
    }
    try {
      const response = await api.post('/api/reports/generate-csv', reportFilters, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const departmentName = departments.find(d => d.id == reportFilters.department_id)?.name || 'report';
      link.setAttribute('download', `attendance-report-${departmentName.replace(" ", "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Report CSV is downloading!");
    } catch (error) {
      toast.error("Failed to generate CSV report.");
    }
  };

  return (
    <>
      <div className="container-fluid p-4">
        <h1 className="h2 mb-4 fw-bold">Admin Dashboard</h1>

        {/* --- REPORT GENERATOR --- */}
        <div className="card shadow-sm mb-4">
          <div className="card-header"><h5 className="mb-0"><FileEarmarkPdf className="me-2"/>Generate Report</h5></div>
          <div className="card-body">
            <form onSubmit={handleGenerateReport} className="row g-3 align-items-end">
              <div className="col-md-4"><label htmlFor="reportDepartment" className="form-label">Department</label><select name="department_id" className="form-select" onChange={(e) => setReportFilters({...reportFilters, department_id: e.target.value})} required><option value="">-- Select Department --</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="col-md-3"><label htmlFor="reportStartDate" className="form-label">Start Date</label><input type="date" name="start_date" className="form-control" onChange={(e) => setReportFilters({...reportFilters, start_date: e.target.value})} required/></div>
              <div className="col-md-3"><label htmlFor="reportEndDate" className="form-label">End Date</label><input type="date" name="end_date" className="form-control" onChange={(e) => setReportFilters({...reportFilters, end_date: e.target.value})} required/></div>
              <div className="col-md-2"><button className="btn btn-info w-100" type="submit">Generate</button></div>
            </form>
            
            {reportData && (
              <div className="mt-4">
                <hr/>
                <h4>Report Results</h4>
                <Tab.Container defaultActiveKey="summary">
                  <Nav variant="tabs" className="mb-3">
                    <Nav.Item><Nav.Link eventKey="summary">Summary & Details</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="visuals">Visual Report</Nav.Link></Nav.Item>
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey="summary">
                      <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-success" onClick={handleGenerateCsvReport}>
                          <FileEarmarkPdf className="me-2"/>Download as CSV
                        </button>
                      </div>
                      <div className="p-3 my-3 rounded border">
                        <strong>Department:</strong> {reportData.summary.department_name}<br/>
                        <strong>Period:</strong> {reportData.summary.period}<br/>
                        <strong>Total Classes Recorded:</strong> {reportData.summary.total_classes_recorded}<br/>
                        <strong>Overall Attendance Rate:</strong> <span className="fw-bold fs-5">{reportData.summary.overall_attendance_rate}%</span>
                      </div>
                      <div className="row my-3">
                        <div className="col-md-6 mb-3 mb-md-0"><div className="card text-center h-100"><div className="card-body">
                          <h6 className="card-title text-muted">Most Present Lecturer</h6>
                          <p className="card-text fs-4 fw-bold">{reportData.highlights.most_present_lecturer || 'N/A'}</p>
                        </div></div></div>
                        <div className="col-md-6"><div className="card text-center h-100"><div className="card-body">
                          <h6 className="card-title text-muted">Lecturer with Most Absences</h6>
                          <p className="card-text fs-4 fw-bold">{reportData.highlights.highest_absence_lecturer || 'N/A'}</p>
                        </div></div></div>
                      </div>
                      <div className="table-responsive">
                        <table className={`table table-bordered ${theme === 'dark' ? 'table-dark' : ''}`}>
                          <thead><tr><th>Lecturer</th><th>Total Classes</th><th>Attended</th><th>Missed</th><th>Attendance Rate</th></tr></thead>
                          <tbody>{reportData.breakdown.map(lec => (<tr key={lec.lecturer_name}><td>{lec.lecturer_name}</td><td>{lec.total_classes}</td><td>{lec.classes_attended}</td><td>{lec.classes_missed}</td><td>{lec.attendance_rate}%</td></tr>))}</tbody>
                        </table>
                      </div>
                    </Tab.Pane>
                    <Tab.Pane eventKey="visuals">
                      <div className="card">
                        <div className="card-body">
                          <ReportCharts reportData={reportData} />
                        </div>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>
            )}
          </div>
        </div>

        {/* --- SEMESTERS --- */}
        <div className="card shadow-sm mb-4">
          <div className="card-header"><h5 className="mb-0"><CalendarCheck className="me-2"/>Manage Semesters</h5></div>
          <div className="card-body">
            <h6 className="card-title">Add New Semester</h6>
            <form onSubmit={handleAddSemester} className="row g-3 align-items-end mb-4">
                <div className="col-md-3"><label htmlFor="year" className="form-label">Year</label><input type="number" name="year" className="form-control" value={semesterFormData.year} onChange={handleSemesterFormChange} required /></div>
                <div className="col-md-2"><label htmlFor="semester_number" className="form-label">Semester</label><select name="semester_number" className="form-select" value={semesterFormData.semester_number} onChange={handleSemesterFormChange}><option value="1">1</option><option value="2">2</option></select></div>
                <div className="col-md-3"><label htmlFor="start_date" className="form-label">Start Date</label><input type="date" name="start_date" className="form-control" value={semesterFormData.start_date} onChange={handleSemesterFormChange} required/></div>
                <div className="col-md-3"><label htmlFor="end_date" className="form-label">End Date</label><input type="date" name="end_date" className="form-control" value={semesterFormData.end_date} onChange={handleSemesterFormChange} required/></div>
                <div className="col-md-1"><button className="btn btn-primary w-100" type="submit">Add</button></div>
            </form>
            <Accordion><Accordion.Item eventKey="0"><Accordion.Header>View Existing Semesters ({semesters.length})</Accordion.Header><Accordion.Body>
            <div className="table-responsive"><table className="table table-striped table-hover align-middle">
                <thead className="table-light"><tr><th>Semester</th><th>Period</th><th className="text-center">Status</th><th className="text-center">Actions</th></tr></thead>
                <tbody>
                  {semesters.map(s => (<tr key={s.id}><td><strong>{s.year} - Sem {s.semester_number}</strong></td><td>{s.start_date} to {s.end_date}</td><td className="text-center">{s.is_active ? (<span className="badge bg-success">Active</span>) : (<span className="badge bg-secondary">Inactive</span>)}</td><td className="text-center"><div className="btn-group">{s.is_active ? (<button title="Deactivate" className="btn btn-warning btn-sm" onClick={handleDeactivateSemester}><Power/></button>) : (<button title="Set Active" className="btn btn-success btn-sm" onClick={() => handleActivateSemester(s.id)}><CheckCircleFill/></button>)}<button title="Edit" className="btn btn-outline-secondary btn-sm" onClick={() => openModal('semester', s)}><PencilSquare /></button><button title="Delete" className="btn btn-outline-danger btn-sm" onClick={() => handleDelete('semester', s.id)}><Trash /></button></div></td></tr>))}
                </tbody>
            </table></div>
            </Accordion.Body></Accordion.Item></Accordion>
          </div>
        </div>
        
        {/* --- PROGRAMS & SUBJECTS --- */}
        <div className="row mb-4">
            <div className="col-lg-6 mb-4 mb-lg-0"><div className="card shadow-sm h-100"><div className="card-header"><h5 className="mb-0"><MortarboardFill className="me-2"/>Manage Programs</h5></div><div className="card-body"><form onSubmit={handleAddProgram}>
                <div className="mb-3"><label htmlFor="programName" className="form-label">Program Name</label><input type="text" name="name" className="form-control" value={programFormData.name} onChange={handleProgramFormChange} placeholder="e.g., Bachelor of IT" required/></div>
                <div className="row"><div className="col-md-4 mb-3"><label htmlFor="programLevel" className="form-label">Level</label><select name="level" className="form-select" value={programFormData.level} onChange={handleProgramFormChange}><option>Degree</option><option>Diploma</option><option>Certificate</option><option>Masters</option></select></div><div className="col-md-4 mb-3"><label htmlFor="programDepartment" className="form-label">Department</label><select name="department_id" className="form-select" value={programFormData.department_id} onChange={handleProgramFormChange} required><option value="">-- Select --</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div className="col-md-4 mb-3"><label htmlFor="duration_in_years" className="form-label">Duration (Yrs)</label><input type="number" name="duration_in_years" className="form-control" value={programFormData.duration_in_years} onChange={handleProgramFormChange} required /></div></div>
                <button type="submit" className="btn btn-primary">Add Program</button>
            </form><hr/><Accordion><Accordion.Item eventKey="0"><Accordion.Header>View Existing Programs ({programs.length})</Accordion.Header><Accordion.Body>
            <ul className="list-group">{programs.map(p => <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center"><div>{p.name}<br/><small className="text-muted">{p.department_name}</small></div><div className="btn-group"><button className="btn btn-outline-secondary btn-sm" onClick={() => openModal('program', p)}><PencilSquare /></button><button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete('program', p.id)}><Trash /></button></div></li>)}</ul>
            </Accordion.Body></Accordion.Item></Accordion></div></div></div>
            <div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-header"><h5 className="mb-0"><Book className="me-2"/>Manage Subjects</h5></div><div className="card-body"><form onSubmit={handleAddSubject}>
                <div className="row"><div className="col-md-5 mb-3"><label htmlFor="subjectName" className="form-label">Subject Name</label><input type="text" name="name" className="form-control" value={subjectFormData.name} onChange={handleSubjectFormChange} placeholder="e.g., Intro to Programming" required/></div><div className="col-md-3 mb-3"><label htmlFor="subjectCode" className="form-label">Code</label><input type="text" name="code" className="form-control" value={subjectFormData.code} onChange={handleSubjectFormChange} placeholder="e.g., IT101" required/></div><div className="col-md-4 mb-3"><label htmlFor="year_of_study" className="form-label">Year of Study</label><input type="number" name="year_of_study" className="form-control" value={subjectFormData.year_of_study} onChange={handleSubjectFormChange} required /></div></div>
                <div className="mb-3"><label htmlFor="subjectProgram" className="form-label">Program</label><select name="program_id" className="form-select" value={subjectFormData.program_id} onChange={handleSubjectFormChange} required><option value="">-- Select --</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <button type="submit" className="btn btn-primary">Add Subject</button>
            </form><hr/><Accordion><Accordion.Item eventKey="0"><Accordion.Header>View Existing Subjects ({subjects.length})</Accordion.Header><Accordion.Body>
            <ul className="list-group">{subjects.map(s => <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center"><div>{s.code} - {s.name}<br/><small className="text-muted">{s.program_name}</small></div><div className="btn-group"><button className="btn btn-outline-secondary btn-sm" onClick={() => openModal('subject', s)}><PencilSquare /></button><button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete('subject', s.id)}><Trash /></button></div></li>)}</ul>
            </Accordion.Body></Accordion.Item></Accordion></div></div></div>
        </div>

        {/* --- DEPARTMENTS & USERS --- */}
        <div className="row">
            <div className="col-lg-5 mb-4"><div className="card shadow-sm h-100"><div className="card-header"><h5 className="mb-0"><Building className="me-2"/>Manage Departments</h5></div><div className="card-body"><form onSubmit={handleAddDepartment} className="mb-4"><label htmlFor="departmentName" className="form-label">Add New Department</label><div className="input-group"><input type="text" id="departmentName" className="form-control" placeholder="e.g., Faculty of Science" value={newDepartmentName} onChange={(e) => setNewDepartmentName(e.target.value)}/><button className="btn btn-primary" type="submit">Add</button></div></form>
            <Accordion><Accordion.Item eventKey="0"><Accordion.Header>View Existing Departments ({departments.length})</Accordion.Header><Accordion.Body>
            <ul className="list-group">{departments.map(dept => (<li key={dept.id} className="list-group-item d-flex justify-content-between align-items-center">{dept.name}<div className="btn-group"><button className="btn btn-outline-secondary btn-sm" onClick={() => openModal('department', dept)}><PencilSquare /></button><button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete('department', dept.id)}><Trash /></button></div></li>))}</ul>
            </Accordion.Body></Accordion.Item></Accordion></div></div></div>
            <div className="col-lg-7 mb-4"><div className="card shadow-sm h-100"><div className="card-header bg-primary text-white"><h5 className="mb-0">Add New User</h5></div><div className="card-body"><form onSubmit={handleAddUser} className="row g-3"><div className="col-md-6"><label htmlFor="fullName" className="form-label">Full Name</label><input type="text" name="full_name" className="form-control" value={userFormData.full_name} onChange={handleUserFormChange} required /></div><div className="col-md-6"><label htmlFor="email" className="form-label">Email</label><input type="email" name="email" className="form-control" value={userFormData.email} onChange={handleUserFormChange} required /></div><div className="col-md-6"><label htmlFor="password" className="form-label">Password</label><input type="password" name="password" className="form-control" value={userFormData.password} onChange={handleUserFormChange} required /></div><div className="col-md-6"><label htmlFor="role" className="form-label">Role</label><select name="role" className="form-select" value={userFormData.role} onChange={handleUserFormChange}><option value="CR">Class Representative</option><option value="Lecturer">Lecturer</option><option value="HOD">Head of Department</option></select></div><div className="col-md-12"><label htmlFor="department_id" className="form-label">Department</label><select name="department_id" id="department_id" className="form-select" value={userFormData.department_id} onChange={handleUserFormChange} required><option value="" disabled>-- Select --</option>{departments.map(dept => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}</select></div><div className="col-12 text-end"><button className="btn btn-primary" type="submit">Add User</button></div></form></div></div></div>
        </div>

        <div className="card shadow-sm mt-4">
          <div className="card-header"><h5 className="mb-0">Manage Users</h5></div>
          <div className="card-body p-0">
            <div className="table-responsive"><table className="table table-striped table-hover align-middle">
              <thead className="table-dark"><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th className="text-center">Actions</th></tr></thead>
              <tbody>{users.map((user, index) => (<tr key={user.id}><th>{index + 1}</th><td>{user.full_name}</td><td>{user.email}</td><td><span className={`badge bg-${getRoleBadge(user.role)}`}>{user.role}</span></td><td>{user.department_name}</td><td className="text-center"><div className="btn-group"><button className="btn btn-outline-secondary btn-sm" onClick={() => openModal('user', user)}><PencilSquare /></button><button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete('user', user.id)}><Trash /></button></div></td></tr>))}</tbody>
            </table></div>
          </div>
        </div>
      </div>

      <Modal show={modalState.isOpen} onHide={closeModal} centered dialogClassName="glassmorphism">
        <Modal.Header closeButton><Modal.Title>Edit {modalState.type}</Modal.Title></Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body>
            {modalState.type === 'department' && (<Form.Group><Form.Label>Department Name</Form.Label><Form.Control type="text" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} /></Form.Group>)}
            {modalState.type === 'semester' && (<>
                <Form.Group className="mb-3"><Form.Label>Year</Form.Label><Form.Control type="number" name="year" value={editFormData.year || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Semester Number</Form.Label><Form.Select name="semester_number" value={editFormData.semester_number || ''} onChange={handleEditFormChange}><option value="1">1</option><option value="2">2</option></Form.Select></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Start Date</Form.Label><Form.Control type="date" name="start_date" value={editFormData.start_date || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group><Form.Label>End Date</Form.Label><Form.Control type="date" name="end_date" value={editFormData.end_date || ''} onChange={handleEditFormChange} /></Form.Group>
            </>)}
            {modalState.type === 'program' && (<>
                <Form.Group className="mb-3"><Form.Label>Program Name</Form.Label><Form.Control type="text" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Level</Form.Label><Form.Select name="level" value={editFormData.level || ''} onChange={handleEditFormChange}><option>Degree</option><option>Diploma</option><option>Certificate</option><option>Masters</option></Form.Select></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Duration (Years)</Form.Label><Form.Control type="number" name="duration_in_years" value={editFormData.duration_in_years || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group><Form.Label>Department</Form.Label><Form.Select name="department_id" value={editFormData.department_id || ''} onChange={handleEditFormChange}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Form.Select></Form.Group>
            </>)}
            {modalState.type === 'subject' && (<>
                <Form.Group className="mb-3"><Form.Label>Subject Name</Form.Label><Form.Control type="text" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Subject Code</Form.Label><Form.Control type="text" name="code" value={editFormData.code || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Year of Study</Form.Label><Form.Control type="number" name="year_of_study" value={editFormData.year_of_study || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group><Form.Label>Program</Form.Label><Form.Select name="program_id" value={editFormData.program_id || ''} onChange={handleEditFormChange}>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group>
            </>)}
            {modalState.type === 'user' && (<>
                <Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" name="full_name" value={editFormData.full_name || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={editFormData.email || ''} onChange={handleEditFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Role</Form.Label><Form.Select name="role" value={editFormData.role || ''} onChange={handleEditFormChange}><option value="CR">CR</option><option value="Lecturer">Lecturer</option><option value="HOD">HOD</option></Form.Select></Form.Group>
                <Form.Group><Form.Label>Department</Form.Label><Form.Select name="department_id" value={editFormData.department_id || ''} onChange={handleEditFormChange}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Form.Select></Form.Group>
                <small className="d-block mt-3 text-muted">Password cannot be changed from this form.</small>
            </>)}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" type="submit">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

const getRoleBadge = (role) => {
  switch (role) {
    case 'Admin': return 'danger';
    case 'HOD': return 'warning text-dark';
    case 'Lecturer': return 'info text-dark';
    case 'CR': return 'success';
    default: return 'secondary';
  }
};

export default AdminDashboard;