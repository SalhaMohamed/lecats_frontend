import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EyeFill, EyeSlashFill, CardChecklist, PersonVideo3, BarChartFill, MoonStarsFill, SunFill } from 'react-bootstrap-icons';
import { Nav, Tab } from 'react-bootstrap';
import useDarkMode from '../../useDarkMode';
import api from '../../api'; // Using our central api instance

function LandingPage() {
  // State for Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // State for Register Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [role, setRole] = useState('CR');
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  
  const navigate = useNavigate();
  const [theme, toggleTheme] = useDarkMode();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/api/departments');
        setDepartments(res.data);
      } catch (error) {
        toast.error("Could not load departments for registration.");
      }
    };
    fetchDepartments();
  }, []);

  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { 
        email: loginEmail.trim(), 
        password: loginPassword 
      });
      localStorage.setItem('token', res.data.token);
      toast.success('Login Successful');
      const user = parseJwt(res.data.token);
      if (user) {
        navigate(`/${user.role.toLowerCase()}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Invalid email or password');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', {
        full_name: fullName.trim(), 
        email: email.trim(), 
        password: password, 
        role, 
        department_id: departmentId
      });
      toast.success('Registered successfully! Please login.');
      setActiveTab('login');
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top">
        <div className="container">
          <a className="navbar-brand" href="#home">LECATS</a>
          <div className="d-flex align-items-center">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><a className="nav-link" href="#features">Features</a></li>
              <li className="nav-item"><a className="nav-link" href="#login">Login / Register</a></li>
              <li className="nav-item"><a className="nav-link" href="#contact">Contact</a></li>
            </ul>
            <div className="form-check form-switch ms-3">
              <input className="form-check-input" type="checkbox" role="switch" id="themeSwitcher" checked={theme === 'dark'} onChange={toggleTheme} style={{cursor: 'pointer'}} />
              <label className="form-check-label text-light">{theme === 'dark' ? <MoonStarsFill/> : <SunFill/>}</label>
            </div>
          </div>
        </div>
      </nav>

      <section id="home" className="d-flex align-items-center text-center text-white" style={{ minHeight: '100vh', background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container">
          <h1 className="display-3 fw-bold">Lecturer's Class Attendance Tracking System</h1>
          <p className="lead my-4">Modernizing accountability and transparency to improve performance at The State University of Zanzibar.</p>
          <a href="#login" className="btn btn-primary btn-lg">Get Started</a>
        </div>
      </section>

      <section id="features" className="py-5">
        <div className="container"><div className="row text-center">
            <div className="col-md-4"><CardChecklist size={40} className="mb-3 text-primary"/><h4 className="fw-bold">Efficient Tracking</h4><p>Class Reps can submit attendance in seconds from their dashboard.</p></div>
            <div className="col-md-4"><PersonVideo3 size={40} className="mb-3 text-primary"/><h4 className="fw-bold">Full Transparency</h4><p>Lecturers and HODs have instant access to attendance records and excuses.</p></div>
            <div className="col-md-4"><BarChartFill size={40} className="mb-3 text-primary"/><h4 className="fw-bold">Powerful Reporting</h4><p>Admins can generate detailed CSV reports for any department and date range.</p></div>
        </div></div>
      </section>
      
      <section id="login" className="py-5 bg-light">
        <div className="container" style={{ maxWidth: '600px' }}>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="pills" justify className="mb-3">
              <Nav.Item><Nav.Link eventKey="login">Login</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="register">Register</Nav.Link></Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="login">
                <div className="card shadow-sm glassmorphism"><div className="card-body p-4">
                  <h3 className="text-center mb-3">Welcome Back</h3>
                  <form onSubmit={handleLoginSubmit}>
                    <div className="form-floating mb-3"><input type="email" className="form-control" id="loginEmail" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required /><label htmlFor="loginEmail">Email address</label></div>
                    <div className="form-floating mb-3 position-relative"><input type={showLoginPassword ? "text" : "password"} className="form-control" id="loginPassword" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required /><label htmlFor="loginPassword">Password</label><span className="position-absolute top-50 end-0 translate-middle-y me-3" onClick={() => setShowLoginPassword(!showLoginPassword)} style={{ cursor: 'pointer' }}>{showLoginPassword ? <EyeSlashFill/> : <EyeFill/>}</span></div>
                    <div className="d-grid"><button className="btn btn-primary" type="submit">Login</button></div>
                  </form>
                </div></div>
              </Tab.Pane>
              <Tab.Pane eventKey="register">
                <div className="card shadow-sm glassmorphism"><div className="card-body p-4">
                  <h3 className="text-center mb-3">Create an Account</h3>
                  <form onSubmit={handleRegisterSubmit}>
                    <div className="form-floating mb-3"><input type="text" className="form-control" id="fullName" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required /><label htmlFor="fullName">Full Name</label></div>
                    <div className="form-floating mb-3"><input type="email" className="form-control" id="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /><label htmlFor="email">Email address</label></div>
                    <div className="row g-2 mb-3"><div className="col-md"><div className="form-floating"><select className="form-select" id="role" value={role} onChange={e => setRole(e.target.value)} required><option value="CR">Class Representative</option><option value="Lecturer">Lecturer</option><option value="HOD">Head of Department</option></select><label htmlFor="role">Your Role</label></div></div><div className="col-md"><div className="form-floating"><select className="form-select" id="department" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required><option value="" disabled>-- Select Department --</option>{departments.map(dept => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}</select><label htmlFor="department">Your Department</label></div></div></div>
                    <div className="form-floating mb-3 position-relative">
                      <input 
                        type={showRegisterPassword ? "text" : "password"} 
                        className="form-control" id="password" 
                        placeholder="Password" value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,10}$"
                        title="Password must be 6-10 characters and include an uppercase, lowercase, number, and special character."
                      />
                      <label htmlFor="password">Password</label>
                      <span className="position-absolute top-50 end-0 translate-middle-y me-3" onClick={() => setShowRegisterPassword(!showRegisterPassword)} style={{ cursor: 'pointer' }}>{showRegisterPassword ? <EyeSlashFill/> : <EyeFill/>}</span>
                    </div>
                    <div className="d-grid"><button className="btn btn-primary" type="submit">Register</button></div>
                  </form>
                </div></div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
      </section>

      <footer id="contact" className="py-5 bg-dark text-white text-center">
        <div className="container">
          <h4 className="mb-3">Contact Information</h4>
          <p>For any inquiries about the LECATS project, please feel free to reach out.</p>
          <p className="mb-0"><strong>Salha Abdalla Mohamed</strong></p>
          <p><a href="mailto:salhaabdalla108@gmail.com" className="text-white">salhaabdalla108@gmail.com</a></p>
          <p><a href="https://github.com/SalhaMohamed" className="text-white" target="_blank" rel="noopener noreferrer">GitHub Profile</a></p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;