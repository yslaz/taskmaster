use actix_web::{test, web, App, http::StatusCode};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;
use taskmaster_backend::handlers::auth;
use taskmaster_backend::models::CreateUserRequest;

async fn setup_test_db() -> PgPool {
    let database_url = "postgresql://admin:YWRtaW4=@192.168.200.4:5432/taskmaster";
    sqlx::PgPool::connect(database_url).await.expect("Failed to connect to test database")
}

fn create_app(pool: PgPool) -> App<impl actix_web::dev::ServiceFactory<actix_web::dev::ServiceRequest, Config = (), Response = actix_web::dev::ServiceResponse, Error = actix_web::Error, InitError = ()>> {
    App::new()
        .app_data(web::Data::new(pool))
        .service(auth::register)
}

#[actix_web::test]
async fn test_register_success() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    let unique_email = format!("test_{}@example.com", Uuid::new_v4());
    let request_data = json!({
        "name": "Test User",
        "email": unique_email,
        "password": "password123"
    });
    let req = test::TestRequest::post()
        .uri("/register")
        .set_json(&request_data)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::CREATED);
}

#[actix_web::test]
async fn test_register_validation_error() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    let invalid_data = json!({
        "name": "",
        "email": "invalid-email",
        "password": "123"
    });
    let req = test::TestRequest::post()
        .uri("/register")
        .set_json(&invalid_data)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}
