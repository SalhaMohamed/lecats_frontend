# app/models.py
from . import db
from datetime import datetime, timezone

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    users = db.relationship('User', backref='department', lazy=True, cascade="all, delete-orphan")
    programs = db.relationship('Program', backref='department', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {'id': self.id, 'name': self.name}
        
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None
        }

class Semester(db.Model):
    __tablename__ = 'semester'
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    semester_number = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    __table_args__ = (db.UniqueConstraint('year', 'semester_number', name='_year_semester_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'year': self.year,
            'semester_number': self.semester_number,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'is_active': self.is_active
        }

class Program(db.Model):
    __tablename__ = 'program'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False)
    level = db.Column(db.String(50), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    duration_in_years = db.Column(db.Integer, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'duration_in_years': self.duration_in_years
        }

class Subject(db.Model):
    __tablename__ = 'subject'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    program_id = db.Column(db.Integer, db.ForeignKey('program.id'), nullable=False)
    program = db.relationship('Program', backref='subjects')
    year_of_study = db.Column(db.Integer, nullable=False, default=1)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'program_id': self.program_id,
            'program_name': self.program.name if self.program else None,
            'year_of_study': self.year_of_study
        }

class ClassSchedule(db.Model):
    __tablename__ = 'class_schedule'
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey('semester.id'), nullable=False)
    day_of_week = db.Column(db.String(15), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    subject = db.relationship('Subject')
    lecturer = db.relationship('User')
    semester = db.relationship('Semester')
    
    def to_dict(self):
        return {
            'id': self.id,
            'subject_name': self.subject.name if self.subject else None,
            'lecturer_name': self.lecturer.full_name if self.lecturer else None,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M'),
            'end_time': self.end_time.strftime('%H:%M')
        }

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    class_schedule_id = db.Column(db.Integer, db.ForeignKey('class_schedule.id'), nullable=False)
    cr_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    present = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    verified = db.Column(db.Boolean, default=False)
    excuse_comment = db.Column(db.Text)
    excuse_file = db.Column(db.String(300))
    excuse_uploaded_at = db.Column(db.DateTime)
    schedule = db.relationship('ClassSchedule', backref='attendances')
    
    def to_dict(self):
        cr_user = db.session.get(User, self.cr_id)
        return {
            'id': self.id,
            'present': self.present,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'verified': self.verified,
            'cr_name': cr_user.full_name if cr_user else 'N/A',
            'excuse_comment': self.excuse_comment,
            'excuse_file': self.excuse_file,
        }
        

class SpecialSchedule(db.Model):
    __tablename__ = 'special_schedule'
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    creating_hod_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
   

    subject = db.relationship('Subject')
    lecturer = db.relationship('User', foreign_keys=[lecturer_id])
    hod = db.relationship('User', foreign_keys=[creating_hod_id])
    target_department = db.relationship('Department')
    
    def to_dict(self):
        return {
            'id': self.id,
            'subject_name': self.subject.name if self.subject else None,
            'lecturer_name': self.lecturer.full_name if self.lecturer else None,
            'class_date': self.class_date.isoformat(),
            'start_time': self.start_time.strftime('%H:%M'),
            'end_time': self.end_time.strftime('%H:%M')
        }