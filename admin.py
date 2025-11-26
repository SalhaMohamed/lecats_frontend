# app/routes/admin.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.security import generate_password_hash
from datetime import date
from ..models import db, Department, Semester, Program, Subject, User, ClassSchedule, Attendance
from sqlalchemy.exc import IntegrityError

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# --- DEPARTMENT ROUTES ---
@admin_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    departments = Department.query.order_by(Department.name).all()
    return jsonify([d.to_dict() for d in departments])

@admin_bp.route('/departments', methods=['POST'])
@jwt_required()
def create_department():
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    data = request.json
    new_department = Department(name=data['name'])
    try:
        db.session.add(new_department)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'msg': 'Department with this name already exists'}), 400
    return jsonify(new_department.to_dict()), 201

@admin_bp.route('/departments/<int:department_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_single_department(department_id):
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    department = db.session.get(Department, department_id)
    if not department: return jsonify({'msg': 'Department not found'}), 404
    if request.method == 'PUT':
        data = request.json
        department.name = data.get('name', department.name)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Department with this name already exists'}), 400
        return jsonify(department.to_dict())
    if request.method == 'DELETE':
        if department.programs or department.users:
            return jsonify({'msg': 'Cannot delete: Department has programs or users'}), 400
        db.session.delete(department)
        db.session.commit()
        return jsonify({'msg': 'Department deleted'})

# --- SEMESTER ROUTES ---
@admin_bp.route('/semesters', methods=['GET', 'POST'])
@jwt_required()
def manage_semesters():
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    if request.method == 'GET':
        semesters = Semester.query.order_by(Semester.year.desc(), Semester.semester_number.desc()).all()
        return jsonify([s.to_dict() for s in semesters])
    if request.method == 'POST':
        data = request.json
        new_semester = Semester(year=int(data['year']), semester_number=int(data['semester_number']), start_date=date.fromisoformat(data['start_date']), end_date=date.fromisoformat(data['end_date']))
        try:
            db.session.add(new_semester)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Semester for this year and number already exists'}), 400
        return jsonify(new_semester.to_dict()), 201

@admin_bp.route('/semesters/<int:semester_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_single_semester(semester_id):
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    semester = db.session.get(Semester, semester_id)
    if not semester: return jsonify({'msg': 'Semester not found'}), 404
    if request.method == 'PUT':
        data = request.json
        semester.year = data.get('year', semester.year)
        semester.semester_number = data.get('semester_number', semester.semester_number)
        semester.start_date = date.fromisoformat(data.get('start_date', semester.start_date.isoformat()))
        semester.end_date = date.fromisoformat(data.get('end_date', semester.end_date.isoformat()))
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Semester for this year and number already exists'}), 400
        return jsonify(semester.to_dict())
    if request.method == 'DELETE':
        if ClassSchedule.query.filter_by(semester_id=semester.id).first():
            return jsonify({'msg': 'Cannot delete: Semester is used in a timetable'}), 400
        db.session.delete(semester)
        db.session.commit()
        return jsonify({'msg': 'Semester deleted'})

@admin_bp.route('/semesters/activate/<int:semester_id>', methods=['POST'])
@jwt_required()
def activate_semester(semester_id):
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    Semester.query.filter_by(is_active=True).update({'is_active': False})
    target_semester = db.session.get(Semester, semester_id)
    if not target_semester: return jsonify({'msg': 'Semester not found'}), 404
    target_semester.is_active = True
    db.session.commit()
    return jsonify({'msg': f"Semester {target_semester.year} - {target_semester.semester_number} has been activated."})

@admin_bp.route('/semesters/deactivate', methods=['POST'])
@jwt_required()
def deactivate_semester():
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    active_semester = Semester.query.filter_by(is_active=True).first()
    if active_semester:
        active_semester.is_active = False
        db.session.commit()
        return jsonify({'msg': 'Semester deactivated successfully.'})
    return jsonify({'msg': 'No active semester to deactivate.'})

# --- PROGRAM ROUTES ---
@admin_bp.route('/programs', methods=['GET', 'POST'])
@jwt_required()
def manage_programs():
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    if request.method == 'GET':
        programs = Program.query.join(Department).order_by(Program.name).all()
        return jsonify([p.to_dict() for p in programs])
    if request.method == 'POST':
        data = request.json
        new_program = Program(name=data['name'], level=data['level'], department_id=data['department_id'], duration_in_years=data['duration_in_years'])
        try:
            db.session.add(new_program)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Program with this name already exists'}), 400
        return jsonify(new_program.to_dict()), 201

@admin_bp.route('/programs/<int:program_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_single_program(program_id):
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    program = db.session.get(Program, program_id)
    if not program: return jsonify({'msg': 'Program not found'}), 404
    if request.method == 'PUT':
        data = request.json
        program.name = data.get('name', program.name)
        program.level = data.get('level', program.level)
        program.department_id = data.get('department_id', program.department_id)
        program.duration_in_years = data.get('duration_in_years', program.duration_in_years)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Program with this name already exists'}), 400
        return jsonify(program.to_dict())
    if request.method == 'DELETE':
        if program.subjects:
            return jsonify({'msg': 'Cannot delete: Program has subjects'}), 400
        db.session.delete(program)
        db.session.commit()
        return jsonify({'msg': 'Program deleted'})

# --- SUBJECT ROUTES ---
@admin_bp.route('/subjects', methods=['GET', 'POST'])
@jwt_required()
def manage_subjects():
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    if request.method == 'GET':
        subjects = Subject.query.join(Program).order_by(Subject.name).all()
        return jsonify([s.to_dict() for s in subjects])
    if request.method == 'POST':
        data = request.json
        new_subject = Subject(name=data['name'], code=data['code'], program_id=data['program_id'], year_of_study=data['year_of_study'])
        try:
            db.session.add(new_subject)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Subject with this code already exists'}), 400
        return jsonify(new_subject.to_dict()), 201

@admin_bp.route('/subjects/<int:subject_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_single_subject(subject_id):
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    subject = db.session.get(Subject, subject_id)
    if not subject: return jsonify({'msg': 'Subject not found'}), 404
    if request.method == 'PUT':
        data = request.json
        subject.name = data.get('name', subject.name)
        subject.code = data.get('code', subject.code)
        subject.program_id = data.get('program_id', subject.program_id)
        subject.year_of_study = data.get('year_of_study', subject.year_of_study)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Subject with this code already exists'}), 400
        return jsonify(subject.to_dict())
    if request.method == 'DELETE':
        if ClassSchedule.query.filter_by(subject_id=subject.id).first():
            return jsonify({'msg': 'Cannot delete: Subject is in a timetable'}), 400
        db.session.delete(subject)
        db.session.commit()
        return jsonify({'msg': 'Subject deleted'})

# --- USER ROUTES ---
@admin_bp.route('/users', methods=['GET', 'POST'])
@jwt_required()
def manage_users():
    claims = get_jwt()
    if claims.get('role') != 'Admin': return jsonify({'msg': 'Forbidden'}), 403
    if request.method == 'GET':
        users = User.query.order_by(User.id).all()
        return jsonify([u.to_dict() for u in users])
    if request.method == 'POST':
        data = request.json
        new_user = User(full_name=data.get('full_name'), email=data.get('email'), password=generate_password_hash(data.get('password')), role=data.get('role'), department_id=data.get('department_id'))
        try:
            db.session.add(new_user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'User with this email already exists'}), 400
        return jsonify(new_user.to_dict()), 201

@admin_bp.route('/users/<int:user_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_single_user(user_id):
    claims = get_jwt()
    if claims.get('role') != 'Admin':
        return jsonify({'msg': 'Forbidden'}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    if request.method == 'PUT':
        data = request.json
        user.full_name = data.get('full_name', user.full_name)
        user.email = data.get('email', user.email)
        user.role = data.get('role', user.role)
        user.department_id = data.get('department_id', user.department_id)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'User with this email already exists'}), 400
        return jsonify(user.to_dict())

    if request.method == 'DELETE':
        if user.role == 'Lecturer' and ClassSchedule.query.filter_by(lecturer_id=user_id).first():
            return jsonify({'msg': 'Cannot delete: Lecturer is assigned to a class in the timetable.'}), 400
        
        if user.role == 'CR' and Attendance.query.filter_by(cr_id=user_id).first():
            return jsonify({'msg': 'Cannot delete: CR has existing attendance records.'}), 400
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({'msg': 'User deleted successfully'})