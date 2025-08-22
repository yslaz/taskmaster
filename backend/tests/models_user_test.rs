use taskmaster_backend::models::user::{User, UserResponse, CreateUserRequest, LoginRequest};
use chrono::Utc;
use uuid::Uuid;
use validator::Validate;

#[test]
fn test_user_response_from_user() {
    let user = User {
        id: Uuid::new_v4(),
        name: "Test User".to_string(),
        email: "test@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let user_id = user.id;
    let user_name = user.name.clone();
    let user_email = user.email.clone();
    let user_created_at = user.created_at;
    
    let response = UserResponse::from(user);

    assert_eq!(response.id, user_id);
    assert_eq!(response.name, user_name);
    assert_eq!(response.email, user_email);
    assert_eq!(response.created_at, user_created_at);
}

#[test]
fn test_create_user_request_validation_valid() {
    let request = CreateUserRequest {
        name: "Valid Name".to_string(),
        email: "valid@example.com".to_string(),
        password: "validpassword123".to_string(),
    };

    assert!(request.validate().is_ok());
}

#[test]
fn test_create_user_request_validation_invalid_name() {
    let request = CreateUserRequest {
        name: "A".to_string(),
        email: "valid@example.com".to_string(),
        password: "validpassword123".to_string(),
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_create_user_request_validation_invalid_email() {
    let request = CreateUserRequest {
        name: "Valid Name".to_string(),
        email: "invalid-email".to_string(),
        password: "validpassword123".to_string(),
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_create_user_request_validation_invalid_password() {
    let request = CreateUserRequest {
        name: "Valid Name".to_string(),
        email: "valid@example.com".to_string(),
        password: "short".to_string(),
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_login_request_validation_valid() {
    let request = LoginRequest {
        email: "valid@example.com".to_string(),
        password: "password123".to_string(),
    };

    assert!(request.validate().is_ok());
}

#[test]
fn test_login_request_validation_invalid_email() {
    let request = LoginRequest {
        email: "invalid-email".to_string(),
        password: "password123".to_string(),
    };

    assert!(request.validate().is_err());
}

#[test]
fn test_login_request_validation_empty_password() {
    let request = LoginRequest {
        email: "valid@example.com".to_string(),
        password: "".to_string(),
    };

    assert!(request.validate().is_err());
}