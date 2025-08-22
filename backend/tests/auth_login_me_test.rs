use actix_web::{test, web, App, http::StatusCode};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use taskmaster_backend::handlers::auth;

// Mirror the ApiResponse shape used by the backend for JSON parsing in tests
#[derive(Debug, Deserialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: String,
}

#[derive(Debug, Deserialize)]
struct UserResponse {
    id: Uuid,
    name: String,
    email: String,
    // created_at exists, but we don't need it for assertions—still include to satisfy deserialization if present
    #[allow(dead_code)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct AuthPayload {
    user: UserResponse,
    token: String,
}

async fn setup_test_db() -> PgPool {
    let database_url = "postgresql://admin:YWRtaW4=@192.168.200.4:5432/taskmaster";
    sqlx::PgPool::connect(database_url)
        .await
        .expect("Failed to connect to test database")
}

fn create_app(pool: PgPool) -> App<impl actix_web::dev::ServiceFactory<actix_web::dev::ServiceRequest, Config = (), Response = actix_web::dev::ServiceResponse, Error = actix_web::Error, InitError = ()>> {
    App::new()
        .app_data(web::Data::new(pool))
        .service(auth::register)
        .service(auth::login)
        .service(auth::me)
}

#[actix_web::test]
async fn test_login_success() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // Register user first
    let email = format!("user_{}@example.com", Uuid::new_v4());
    let password = "password123";
    let register_data = json!({
        "name": "Auth User",
        "email": email,
        "password": password,
    });
    let register_req = test::TestRequest::post()
        .uri("/register")
        .set_json(&register_data)
        .to_request();
    let register_resp = test::call_service(&app, register_req).await;
    assert_eq!(register_resp.status(), StatusCode::CREATED);

    // Login with same credentials
    let login_data = json!({
        "email": email,
        "password": password,
    });

    let req = test::TestRequest::post()
        .uri("/login")
        .set_json(&login_data)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Ensure token exists in response
    let body: ApiResponse<AuthPayload> = test::read_body_json(resp).await;
    assert!(body.data.as_ref().is_some());
    assert!(!body.data.as_ref().unwrap().token.is_empty());
}

#[actix_web::test]
async fn test_login_invalid_password() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    let email = format!("user_{}@example.com", Uuid::new_v4());
    let password = "password123";
    let register_data = json!({
        "name": "Auth User",
        "email": email,
        "password": password,
    });
    let register_req = test::TestRequest::post()
        .uri("/register")
        .set_json(&register_data)
        .to_request();
    let register_resp = test::call_service(&app, register_req).await;
    assert_eq!(register_resp.status(), StatusCode::CREATED);

    let bad_login = json!({
        "email": email,
        "password": "wrong_password",
    });

    let req = test::TestRequest::post()
        .uri("/login")
        .set_json(&bad_login)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[actix_web::test]
async fn test_login_validation_error() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;

    let invalid_login = json!({
        "email": "not-an-email",
        "password": "",
    });

    let req = test::TestRequest::post()
        .uri("/login")
        .set_json(&invalid_login)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[actix_web::test]
async fn test_me_success() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // Register and then use returned token
    let email = format!("user_{}@example.com", Uuid::new_v4());
    let register_data = json!({
        "name": "Auth User",
        "email": email,
        "password": "password123",
    });
    let register_req = test::TestRequest::post()
        .uri("/register")
        .set_json(&register_data)
        .to_request();
    let register_resp = test::call_service(&app, register_req).await;
    assert_eq!(register_resp.status(), StatusCode::CREATED);
    let body: ApiResponse<AuthPayload> = test::read_body_json(register_resp).await;
    let token = body.data.as_ref().expect("data should be Some").token.clone();

    let req = test::TestRequest::get()
        .uri("/me")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_web::test]
async fn test_me_unauthorized_no_header() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;

    let req = test::TestRequest::get()
        .uri("/me")
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[actix_web::test]
async fn test_me_invalid_token() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;

    let req = test::TestRequest::get()
        .uri("/me")
        .insert_header(("Authorization", "Bearer invalid.token.here"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}
