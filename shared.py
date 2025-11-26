import os
import csv
import io
from flask import Blueprint, request, jsonify, send_from_directory, make_response, current_app
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime, date, time
from ..models import db, Attendance, ClassSchedule, User, Subject, Program, Department

shared_bp = Blueprint('shared', __name__)

# --- PUBLIC ROUTE ---
@shared_bp.route('/api/departments', methods=['GET'])
def get_public_departments():
    try:
        departments = Department.query.order_by(Department.name).all()
        return jsonify([d.to_dict() for d in departments])
    except Exception as e:
        return jsonify({'msg': 'Failed to retrieve departments', 'error': str(e)}), 500

# --- SHARED FUNCTIONALITY ---
@shared_bp.route('/api/attendance', methods=['POST'])
@jwt_required()
def submit_attendance():
    claims = get_jwt()
    if claims.get('role') != 'CR': return jsonify({'msg': 'Only CR can submit attendance'}), 403
    data = request.json
    class_schedule_id = data.get('class_schedule_id')
    present = data.get('present')
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    existing_attendance = Attendance.query.filter(Attendance.class_schedule_id == class_schedule_id, Attendance.timestamp.between(today_start, today_end)).first()
    if existing_attendance: return jsonify({'msg': 'Attendance for this class has already been submitted today'}), 409
    new_attendance = Attendance(class_schedule_id=class_schedule_id, cr_id=claims.get('id'), present=present)
    db.session.add(new_attendance)
    db.session.commit()
    return jsonify({'msg': 'Attendance recorded successfully'}), 201

@shared_bp.route('/uploads/<filename>')
def download_file(filename):
    directory = os.path.abspath(current_app.config['UPLOAD_FOLDER'])
    return send_from_directory(directory, filename)

# --- REPORT GENERATION ROUTES ---
def get_report_data(filters):
    start_date_str = filters.get('start_date')
    end_date_str = filters.get('end_date')
    department_id = filters.get('department_id')
    if not all([start_date_str, end_date_str, department_id]):
        return None, "Missing required report filters"
    start_date = date.fromisoformat(start_date_str)
    end_date = date.fromisoformat(end_date_str)
    department = db.session.get(Department, int(department_id))
    if not department:
        return None, "Department not found"
    records = db.session.query(Attendance).join(ClassSchedule).join(User, User.id == ClassSchedule.lecturer_id).filter(
        User.department_id == department_id,
        Attendance.verified == True,
        Attendance.timestamp >= start_date,
        Attendance.timestamp <= datetime.combine(end_date, time.max)
    ).all()
    report_data = {}
    total_classes = len(records)
    total_present = sum(1 for r in records if r.present)
    for record in records:
        lecturer = record.schedule.lecturer
        if lecturer.id not in report_data:
            report_data[lecturer.id] = {'lecturer_name': lecturer.full_name, 'total_classes': 0, 'classes_attended': 0}
        report_data[lecturer.id]['total_classes'] += 1
        if record.present:
            report_data[lecturer.id]['classes_attended'] += 1
    overall_attendance_rate = (total_present / total_classes * 100) if total_classes > 0 else 0
    detailed_breakdown = []
    for lec_id, data in report_data.items():
        rate = (data['classes_attended'] / data['total_classes'] * 100) if data['total_classes'] > 0 else 0
        detailed_breakdown.append({
            'lecturer_name': data['lecturer_name'],
            'total_classes': data['total_classes'],
            'classes_attended': data['classes_attended'],
            'classes_missed': data['total_classes'] - data['classes_attended'],
            'attendance_rate': round(rate, 2)
        })
    
    # --- NEW STATISTICAL HIGHLIGHTS ---
    highlights = {
        'most_present_lecturer': None,
        'highest_absence_lecturer': None
    }
    if detailed_breakdown:
        most_present = sorted(detailed_breakdown, key=lambda x: x['classes_attended'], reverse=True)
        highlights['most_present_lecturer'] = f"{most_present[0]['lecturer_name']} ({most_present[0]['classes_attended']} classes)"
        
        highest_absence = sorted(detailed_breakdown, key=lambda x: (x['classes_missed'] / x['total_classes'] if x['total_classes'] > 0 else 0), reverse=True)
        highlights['highest_absence_lecturer'] = f"{highest_absence[0]['lecturer_name']} ({highest_absence[0]['classes_missed']} missed)"

    final_report = {
        'summary': {
            'department_name': department.name,
            'period': f"{start_date_str} to {end_date_str}",
            'total_classes_recorded': total_classes,
            'overall_attendance_rate': round(overall_attendance_rate, 2)
        },
        'breakdown': sorted(detailed_breakdown, key=lambda x: x['lecturer_name']),
        'highlights': highlights
    }
    return final_report, None

@shared_bp.route('/api/reports/generate', methods=['POST'])
@jwt_required()
def generate_report():
    claims = get_jwt()
    if claims.get('role') != 'Admin':
        return jsonify({'msg': 'Forbidden'}), 403
    report_data, error = get_report_data(request.json)
    if error:
        return jsonify({'msg': error}), 400
    return jsonify(report_data)

@shared_bp.route('/api/reports/generate-csv', methods=['POST'])
@jwt_required()
def generate_report_csv():
    claims = get_jwt()
    if claims.get('role') != 'Admin':
        return jsonify({'msg': 'Forbidden'}), 403
    report_data, error = get_report_data(request.json)
    if error:
        return jsonify({'msg': error}), 400
    summary = report_data['summary']
    breakdown = report_data['breakdown']
    highlights = report_data['highlights']
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Lecturer Attendance Report'])
    writer.writerow(['Department:', summary['department_name']])
    writer.writerow(['Period:', summary['period']])
    writer.writerow([])
    writer.writerow(['STATISTICAL HIGHLIGHTS'])
    writer.writerow(['Most Present:', highlights.get('most_present_lecturer', 'N/A')])
    writer.writerow(['Most Absences:', highlights.get('highest_absence_lecturer', 'N/A')])
    writer.writerow([])
    writer.writerow(['DETAILED BREAKDOWN'])
    writer.writerow(['Lecturer Name', 'Attended', 'Missed', 'Total Classes', 'Attendance Rate (%)'])
    
    for item in breakdown:
        writer.writerow([
            item['lecturer_name'],
            item['classes_attended'],
            item['classes_missed'],
            item['total_classes'],
            item['attendance_rate']
        ])
    
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f"attachment; filename=attendance_report_{summary['department_name'].replace(' ', '_')}.csv"
    return response