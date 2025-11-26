import os
from datetime import datetime, timedelta, date, timezone
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.utils import secure_filename
from ..models import db, User, Semester, ClassSchedule, Attendance, SpecialSchedule

lecturer_bp = Blueprint('lecturer', __name__, url_prefix='/api/lecturer')

@lecturer_bp.route('/dashboard-data', methods=['GET'])
@jwt_required()
def get_lecturer_dashboard_data():
    claims = get_jwt()
    if claims.get('role') != 'Lecturer': 
        return jsonify({'msg': 'Forbidden'}), 403
        
    lecturer_id = claims.get('id')
    
    # --- Get Regular Weekly Schedule ---
    active_semester = Semester.query.filter_by(is_active=True).first()
    schedule_data = []
    if active_semester:
        schedules = ClassSchedule.query.filter_by(
            lecturer_id=lecturer_id, 
            semester_id=active_semester.id
        ).order_by(ClassSchedule.day_of_week, ClassSchedule.start_time).all()
        schedule_ids = [s.id for s in schedules]
        all_attendances = Attendance.query.filter(Attendance.class_schedule_id.in_(schedule_ids)).all()
        attendance_map = {}
        for att in all_attendances:
            if att.class_schedule_id not in attendance_map: 
                attendance_map[att.class_schedule_id] = []
            attendance_map[att.class_schedule_id].append(att.to_dict())
        for s in schedules:
            schedule_data.append({
                'id': s.id, 'subject_name': s.subject.name, 'day_of_week': s.day_of_week, 'program_name': s.subject.program.name,
                'start_time': s.start_time.strftime('%H:%M'), 'end_time': s.end_time.strftime('%H:%M'), 
                'attendance_history': attendance_map.get(s.id, [])
            })
    
    # --- Get Upcoming Special Schedules ---
    today = date.today()
    special_schedules = SpecialSchedule.query.filter(
        SpecialSchedule.lecturer_id == lecturer_id,
        SpecialSchedule.class_date >= today
    ).order_by(SpecialSchedule.class_date, SpecialSchedule.start_time).all()

    special_schedule_data = [{
        'id': s.id,
        'subject_name': s.subject.name,
        'class_date': s.class_date.isoformat(),
        'start_time': s.start_time.strftime('%H:%M'),
        'end_time': s.end_time.strftime('%H:%M')
    } for s in special_schedules]

    return jsonify({
        'weekly_schedule': schedule_data,
        'special_schedules': special_schedule_data
    })

@lecturer_bp.route('/attendance/<int:attendance_id>/excuse', methods=['POST'])
@jwt_required()
def upload_excuse(attendance_id):
    claims = get_jwt()
    if claims.get('role') != 'Lecturer': 
        return jsonify({'msg': 'Forbidden'}), 403
        
    attendance = db.session.get(Attendance, attendance_id)
    if not attendance: 
        return jsonify({'msg': 'Attendance record not found'}), 404
    if attendance.schedule.lecturer_id != claims.get('id'): 
        return jsonify({'msg': 'Unauthorized'}), 403
    # Use datetime.utcnow() for correct timezone-naive comparison
    if attendance.timestamp + timedelta(hours=24) < datetime.now(timezone.utc):
        return jsonify({'msg': 'Excuse submission window has expired (24 hours)'}), 400
        
    file = request.files.get('file')
    if not file or file.filename == '':
        return jsonify({'msg': 'No file selected'}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'msg': 'Only PDF files are allowed'}), 400

    filename = secure_filename(f"excuse_{attendance_id}_{file.filename}")
    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
    
    attendance.excuse_file = filename
    attendance.excuse_comment = request.form.get('comment')
    # Use datetime.utcnow() for consistency
    attendance.excuse_uploaded_at = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({'msg': 'Excuse uploaded successfully'})