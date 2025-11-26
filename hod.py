from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from datetime import date, time
from sqlalchemy.exc import IntegrityError
from ..models import db, User, Program, Subject, Semester, ClassSchedule, Attendance, SpecialSchedule

hod_bp = Blueprint('hod', __name__, url_prefix='/api/hod')

# Helper function to get HOD's department ID from token
def get_hod_department_id_from_token():
    claims = get_jwt()
    if claims.get('role') != 'HOD':
        return None
    return claims.get('department_id')

@hod_bp.route('/data-for-timetable', methods=['GET'])
@jwt_required()
def get_hod_timetable_data():
    department_id = get_hod_department_id_from_token()
    if department_id is None:
        return jsonify({'msg': 'Forbidden'}), 403

    lecturers = User.query.filter_by(role='Lecturer', department_id=department_id).all()
    programs_in_dept = Program.query.filter_by(department_id=department_id).all()
    program_ids = [p.id for p in programs_in_dept]
    subjects = Subject.query.filter(Subject.program_id.in_(program_ids)).all()

    return jsonify({
        'lecturers': [{'id': l.id, 'full_name': l.full_name} for l in lecturers],
        'subjects': [{'id': s.id, 'name': f"{s.program.name}: {s.code} - {s.name}"} for s in subjects]
    })

@hod_bp.route('/schedules', methods=['GET', 'POST'])
@jwt_required()
def manage_hod_schedules():
    department_id = get_hod_department_id_from_token()
    if department_id is None:
        return jsonify({'msg': 'Forbidden'}), 403
    
    active_semester = Semester.query.filter_by(is_active=True).first()
    if not active_semester:
        # For GET requests, it's okay to return empty, but POST needs an active semester.
        if request.method == 'POST':
            return jsonify({'msg': 'No active semester set'}), 404
        # For GET request, we can still fetch special schedules
        
    if request.method == 'GET':
        # Get regular weekly schedules
        schedules = ClassSchedule.query.join(Subject).join(Program).filter(
            Program.department_id == department_id,
            ClassSchedule.semester_id == active_semester.id if active_semester else -1 # Avoid error if no active semester
        ).all()
        
        # Get upcoming special schedules created by this HOD
        today = date.today()
        special_schedules = SpecialSchedule.query.filter(
            SpecialSchedule.creating_hod_id == get_jwt()['id'],
            SpecialSchedule.class_date >= today
        ).order_by(SpecialSchedule.class_date).all()

        return jsonify({
            'weekly_schedules': [s.to_dict() for s in schedules],
            'special_schedules': [s.to_dict() for s in special_schedules]
        })

    if request.method == 'POST':
        data = request.json
        new_schedule = ClassSchedule(
            subject_id=data['subject_id'], lecturer_id=data['lecturer_id'], day_of_week=data['day_of_week'],
            start_time=time.fromisoformat(data['start_time']), end_time=time.fromisoformat(data['end_time']),
            semester_id=active_semester.id
        )
        try:
            db.session.add(new_schedule)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'This exact class schedule already exists.'}), 409
        return jsonify({'msg': 'Class scheduled successfully'}), 201

@hod_bp.route('/schedules/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_hod_schedule(schedule_id):
    department_id = get_hod_department_id_from_token()
    if department_id is None:
        return jsonify({'msg': 'Forbidden'}), 403

    schedule_item = db.session.get(ClassSchedule, schedule_id)
    if not schedule_item:
        return jsonify({'msg': 'Schedule not found'}), 404
    if schedule_item.subject.program.department_id != department_id:
        return jsonify({'msg': 'Forbidden: Cannot delete schedule from another department'}), 403

    db.session.delete(schedule_item)
    db.session.commit()
    return jsonify({'msg': 'Scheduled class deleted successfully'})

@hod_bp.route('/special-schedules/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_special_schedule(schedule_id):
    hod_id = get_jwt()['id']
    schedule_item = db.session.get(SpecialSchedule, schedule_id)
    if not schedule_item:
        return jsonify({'msg': 'Special schedule not found'}), 404
    if schedule_item.creating_hod_id != hod_id:
        return jsonify({'msg': 'Forbidden: You can only delete special schedules you created.'}), 403
    db.session.delete(schedule_item)
    db.session.commit()
    return jsonify({'msg': 'Special scheduled class deleted successfully'})

@hod_bp.route('/attendance/pending', methods=['GET'])
@jwt_required()
def hod_pending_attendance():
    department_id = get_hod_department_id_from_token()
    if department_id is None:
        return jsonify({'msg': 'Forbidden'}), 403

    attendances = Attendance.query.join(ClassSchedule).join(Subject).join(Program).filter(
        Attendance.verified == False,
        Program.department_id == department_id
    ).order_by(Attendance.timestamp.desc()).all()

    return jsonify([att.to_dict() for att in attendances])

@hod_bp.route('/attendance/verify/<int:attendance_id>', methods=['POST'])
@jwt_required()
def verify_attendance(attendance_id):
    department_id = get_hod_department_id_from_token()
    if department_id is None:
        return jsonify({'msg': 'Forbidden'}), 403
    
    attendance = db.session.get(Attendance, attendance_id)
    if not attendance:
        return jsonify({'msg': 'Attendance record not found'}), 404
    if attendance.schedule.subject.program.department_id != department_id:
        return jsonify({'msg': 'Forbidden'}), 403

    attendance.verified = True
    db.session.commit()
    return jsonify({'msg': 'Attendance verified'})

@hod_bp.route('/special-schedules', methods=['POST'])
@jwt_required()
def add_special_schedule():
    hod_id = get_jwt()['id']
    data = request.json
    required_fields = ['subject_id', 'lecturer_id', 'class_date', 'start_time', 'end_time', 'target_department_id']
    if not all(field in data for field in required_fields):
        return jsonify({'msg': 'Missing required fields'}), 400

    new_special_class = SpecialSchedule(
        subject_id=data['subject_id'],
        lecturer_id=data['lecturer_id'],
        class_date=date.fromisoformat(data['class_date']),
        start_time=time.fromisoformat(data['start_time']),
        end_time=time.fromisoformat(data['end_time']),
        creating_hod_id=hod_id,
        target_department_id=data['target_department_id']
    )
    db.session.add(new_special_class)
    db.session.commit()
    return jsonify({'msg': 'Special class scheduled successfully'}), 201