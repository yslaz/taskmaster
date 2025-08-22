use actix_web::Result;
use uuid::Uuid;

fn setup_test_env() {
    dotenvy::from_filename(".env").ok();
    
    // Set test environment variables if .env didn't work
    if std::env::var("JWT_SECRET").is_err() {
        std::env::set_var("JWT_SECRET", "test_secret_key_for_testing_12345");
    }
    if std::env::var("JWT_EXPIRATION_HOURS").is_err() {
        std::env::set_var("JWT_EXPIRATION_HOURS", "24");
    }
}

#[test]
fn test_create_and_verify_token_ok() -> Result<()> {
    setup_test_env();
    
    use taskmaster_backend::utils::jwt::{create_token, verify_token};
    use chrono::Utc;

    let email = "utils.tester@example.com";
    let user_id = Uuid::new_v4();

    let token = create_token(email, &user_id)?;
    assert!(!token.is_empty(), "token should not be empty");

    let claims = verify_token(&token)?;
    assert_eq!(claims.sub, email);
    assert_eq!(claims.user_id, user_id.to_string());
    assert!(claims.exp > Utc::now().timestamp(), "exp should be in the future");
    assert!(claims.iat <= claims.exp, "iat should be <= exp");

    Ok(())
}

#[test]
fn test_verify_token_invalid_fails() {
    setup_test_env();
    
    use taskmaster_backend::utils::jwt::verify_token;

    let err = verify_token("invalid.token.string").err();
    assert!(err.is_some(), "verify_token should fail for invalid tokens");
}
