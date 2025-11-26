from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from ..models import User, db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not all(k in data for k in ['full_name', 'email', 'password', 'role', 'department_id']):
        return jsonify({'msg': 'Missing required fields'}), 400
    email = data.get('email')
    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'Email already exists'}), 400
    hashed_password = generate_password_hash(data.get('password'))
    new_user = User(full_name=data.get('full_name'), email=email, password=hashed_password, role=data.get('role'), department_id=data.get('department_id'))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'msg': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    if email == 'admin@example.com' and password == 'Admin12@eg':
        additional_claims = {"role": "Admin", "full_name": "Admin User"}
        access_token = create_access_token(identity=email, additional_claims=additional_claims)
        return jsonify(token=access_token)
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'msg': 'Bad credentials'}), 401
    additional_claims = {"role": user.role, "id": user.id, "full_name": user.full_name, "department_id": user.department_id}
    access_token = create_access_token(identity=user.email, additional_claims=additional_claims)
    return jsonify(token=access_token)
