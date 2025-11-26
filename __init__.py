from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
import os

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    with app.app_context():
        from . import models

        from .routes.auth import auth_bp
        app.register_blueprint(auth_bp)
        from .routes.admin import admin_bp
        app.register_blueprint(admin_bp)
        from .routes.hod import hod_bp
        app.register_blueprint(hod_bp)
        from .routes.lecturer import lecturer_bp
        app.register_blueprint(lecturer_bp)
        from .routes.cr import cr_bp
        app.register_blueprint(cr_bp)
        from .routes.shared import shared_bp
        app.register_blueprint(shared_bp)
        
        db.create_all()

    return app