import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
MIN_PASSWORD_LEN = 8


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # Validation
    errors = {}
    if not name:
        errors["name"] = "Name is required."
    if not email:
        errors["email"] = "Email is required."
    elif not EMAIL_RE.match(email):
        errors["email"] = "Enter a valid email address."
    if not password:
        errors["password"] = "Password is required."
    elif len(password) < MIN_PASSWORD_LEN:
        errors["password"] = f"Password must be at least {MIN_PASSWORD_LEN} characters."

    if errors:
        return jsonify({"errors": errors}), 422

    if User.query.filter_by(email=email).first():
        return jsonify({"errors": {"email": "An account with this email already exists."}}), 409

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"message": "Account created successfully.", "token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 422

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"message": "Login successful.", "token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200
