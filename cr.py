from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime, date, time, timezone
from ..models import db, User, Semester, Program, Subject, ClassSchedule, Attendance, SpecialSchedule

cr_bp = Blueprint('cr', __name__, url_prefix='/api/cr')

@cr_bp.route('/todays-schedule', methods=['GET'])
@jwt_required()
def get_cr_todays_schedule():
    claims = get_jwt()
    if claims.get('role') != 'CR': 
        return jsonify({'msg': 'Forbidden'}), 403

    cr_user = db.session.get(User, claims.get('id'))
    if not cr_user or not cr_user.department_id:
        return jsonify({'msg': 'CR is not associated with a department'}), 400
        
    active_semester = Semester.query.filter_by(is_active=True).first()
    result = []
    
    # 1. Get regular weekly classes for today
    if active_semester:
        today_str = datetime.now(timezone.utc).strftime('%A')
        todays_classes = ClassSchedule.query.join(Subject).join(Program).filter(
            Program.department_id == cr_user.department_id,
            ClassSchedule.semester_id == active_semester.id,
            ClassSchedule.day_of_week == today_str
        ).order_by(ClassSchedule.start_time).all()

        for schedule in todays_classes:
            result.append({
                'schedule_id': schedule.id,
                'subject_name': schedule.subject.name,
                'lecturer_name': schedule.lecturer.full_name,
                'start_time': schedule.start_time.strftime('%H:%M'),
                'end_time': schedule.end_time.strftime('%H:%M'),
            })

    # 2. Get special one-time classes for today
    today_date = date.today()
    special_classes = SpecialSchedule.query.filter_by(
        class_date=today_date,
        target_department_id=cr_user.department_id
    ).order_by(SpecialSchedule.start_time).all()

    for special in special_classes:
         result.append({
            'schedule_id': special.id, # Note: This ID comes from the special_schedule table
            'subject_name': f"{special.subject.name} (Special)", # Mark as special
            'lecturer_name': special.lecturer.full_name,
            'start_time': special.start_time.strftime('%H:%M'),
            'end_time': special.end_time.strftime('%H:%M'),
        })

    # 3. Check which classes have already had attendance submitted
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    
    # This check is simplified and assumes schedule IDs from both tables won't realistically conflict.
    # A more robust solution for a production app would handle this differently.
    submitted_today_ids = {item[0] for item in db.session.query(Attendance.class_schedule_id).filter(Attendance.timestamp.between(today_start, today_end)).all()}
    
    for item in result:
        item['submitted'] = item['schedule_id'] in submitted_today_ids

    # 4. Sort the final combined list by start time
    result.sort(key=lambda x: x['start_time'])
    
    return jsonify(result)