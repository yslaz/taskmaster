use actix_web::{test, web, App, http::StatusCode};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use taskmaster_backend::handlers::{auth, tasks};
use taskmaster_backend::models::Task;
use taskmaster_backend::services::notification_service::NotificationService;

// Mirror ApiResponse used by backend
#[derive(Debug, Deserialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: String,
}

#[derive(Debug, Deserialize)]
struct DeletedResp { deleted: bool }

async fn setup_test_db() -> PgPool {
    let database_url = "postgresql://admin:YWRtaW4=@192.168.200.4:5432/taskmaster";
    sqlx::PgPool::connect(database_url)
        .await
        .expect("Failed to connect to test database")
}

fn create_app(pool: PgPool) -> App<impl actix_web::dev::ServiceFactory<actix_web::dev::ServiceRequest, Config = (), Response = actix_web::dev::ServiceResponse, Error = actix_web::Error, InitError = ()>> {
    let notification_service = NotificationService::new(pool.clone());
    App::new()
        .app_data(web::Data::new(pool))
        .app_data(web::Data::new(notification_service))
        // auth routes for registering user and getting token
        .service(auth::register)
        // mount task routes under /tasks
        .service(
            web::scope("/tasks")
                .service(tasks::get_tasks)
                .service(tasks::create_task)
                .service(tasks::get_task)
                .service(tasks::update_task)
                .service(tasks::delete_task)
        )
}

// Local DTO mirroring backend's TasksResponse
#[derive(Debug, Deserialize)]
struct TasksResponseDto {
    tasks: Vec<Task>,
    total: i64,
    page: u32,
    limit: u32,
    total_pages: u32,
}

#[actix_web::test]
async fn test_get_tasks_empty_then_populated() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;

    // Register user and get token
    let unique_email = format!("task_user_{}@example.com", Uuid::new_v4());
    let reg_body = json!({
        "name": "Tasks Tester",
        "email": unique_email,
        "password": "password123",
    });
    let reg_req = test::TestRequest::post().uri("/register").set_json(&reg_body).to_request();
    let reg_resp = test::call_service(&app, reg_req).await;
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    #[derive(Debug, Deserialize)]
    struct RegUser { id: Uuid }
    #[derive(Debug, Deserialize)]
    struct RegData { user: RegUser, token: String }
    let reg_body: ApiResponse<RegData> = test::read_body_json(reg_resp).await;
    let token = reg_body.data.unwrap().token;

    // Initially empty
    let req = test::TestRequest::get()
        .uri("/tasks")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: ApiResponse<TasksResponseDto> = test::read_body_json(resp).await;
    let data = body.data.expect("data must be present");
    assert_eq!(data.total, 0);
    assert!(data.tasks.is_empty());

    // Create two tasks
    // Create two tasks
    for title in ["Task A", "Task B"] {
        let payload = json!({
            "title": title,
            "description": "test desc",
            "tags": ["rust", "test"],
        });
        let req = test::TestRequest::post()
            .uri("/tasks")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&payload)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::CREATED);
    }

    // Fetch again
    let req2 = test::TestRequest::get()
        .uri("/tasks")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp2 = test::call_service(&app, req2).await;
    assert_eq!(resp2.status(), StatusCode::OK);
    let body2: ApiResponse<TasksResponseDto> = test::read_body_json(resp2).await;
    let data2 = body2.data.expect("data must be present");
    assert!(data2.total >= 2);
    assert!(data2.tasks.len() >= 2);
}

#[actix_web::test]
async fn test_create_task_success() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // Register and token
    let unique_email = format!("task_user_{}@example.com", Uuid::new_v4());
    let reg_body = json!({
        "name": "Tasks Tester",
        "email": unique_email,
        "password": "password123",
    });
    let reg_req = test::TestRequest::post().uri("/register").set_json(&reg_body).to_request();
    let reg_resp = test::call_service(&app, reg_req).await;
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    #[derive(Debug, Deserialize)]
    struct RegUser2 { id: Uuid }
    #[derive(Debug, Deserialize)]
    struct RegData2 { user: RegUser2, token: String }
    let reg_body2: ApiResponse<RegData2> = test::read_body_json(reg_resp).await;
    let token = reg_body2.data.unwrap().token;

    // Create task
    let payload = json!({
        "title": "New Task",
        "description": "test desc",
        "tags": ["rust", "test"],
    });
    let req = test::TestRequest::post()
        .uri("/tasks")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .set_json(&payload)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body: ApiResponse<Task> = test::read_body_json(resp).await;
    let task = body.data.unwrap();
    assert_eq!(task.title, "New Task");
}

#[actix_web::test]
async fn test_get_task_success() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // Register and token
    let unique_email = format!("task_user_{}@example.com", Uuid::new_v4());
    let reg_body = json!({
        "name": "Tasks Tester",
        "email": unique_email,
        "password": "password123",
    });
    let reg_req = test::TestRequest::post().uri("/register").set_json(&reg_body).to_request();
    let reg_resp = test::call_service(&app, reg_req).await;
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    #[derive(Debug, Deserialize)]
    struct RegUser3 { id: Uuid }
    #[derive(Debug, Deserialize)]
    struct RegData3 { user: RegUser3, token: String }
    let reg_body3: ApiResponse<RegData3> = test::read_body_json(reg_resp).await;
    let token = reg_body3.data.unwrap().token;

    // Create a task to fetch
    let payload = json!({
        "title": "Fetch Me",
        "description": "test desc",
        "tags": ["rust", "test"],
    });
    let req_c = test::TestRequest::post()
        .uri("/tasks")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .set_json(&payload)
        .to_request();
    let resp_c = test::call_service(&app, req_c).await;
    assert_eq!(resp_c.status(), StatusCode::CREATED);
    let body_c: ApiResponse<Task> = test::read_body_json(resp_c).await;
    let created = body_c.data.unwrap();

    let req = test::TestRequest::get()
        .uri(&format!("/tasks/{}", created.id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: ApiResponse<Task> = test::read_body_json(resp).await;
    let fetched = body.data.expect("task must be present");
    assert_eq!(fetched.id, created.id);
}

#[actix_web::test]
async fn test_update_task_success() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // Register and token
    let unique_email = format!("task_user_{}@example.com", Uuid::new_v4());
    let reg_body = json!({
        "name": "Tasks Tester",
        "email": unique_email,
        "password": "password123",
    });
    let reg_req = test::TestRequest::post().uri("/register").set_json(&reg_body).to_request();
    let reg_resp = test::call_service(&app, reg_req).await;
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    #[derive(Debug, Deserialize)]
    struct RegUser4 { id: Uuid }
    #[derive(Debug, Deserialize)]
    struct RegData4 { user: RegUser4, token: String }
    let reg_body4: ApiResponse<RegData4> = test::read_body_json(reg_resp).await;
    let token = reg_body4.data.unwrap().token;

    // Create a task to update
    let payload = json!({
        "title": "Update Me",
        "description": "test desc",
        "tags": ["rust", "test"],
    });
    let req_c = test::TestRequest::post()
        .uri("/tasks")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .set_json(&payload)
        .to_request();
    let resp_c = test::call_service(&app, req_c).await;
    assert_eq!(resp_c.status(), StatusCode::CREATED);
    let body_c: ApiResponse<Task> = test::read_body_json(resp_c).await;
    let created = body_c.data.unwrap();

    let update_payload = json!({
        "title": "Updated Title",
        "description": "Updated desc",
        "status": "done",
        "tags": ["updated"],
    });
    let req = test::TestRequest::put()
        .uri(&format!("/tasks/{}", created.id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .set_json(&update_payload)
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: ApiResponse<Task> = test::read_body_json(resp).await;
    let updated = body.data.expect("task must be present");
    assert_eq!(updated.title, "Updated Title");
}

#[actix_web::test]
async fn test_delete_task_success() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // Register and token
    let unique_email = format!("task_user_{}@example.com", Uuid::new_v4());
    let reg_body = json!({
        "name": "Tasks Tester",
        "email": unique_email,
        "password": "password123",
    });
    let reg_req = test::TestRequest::post().uri("/register").set_json(&reg_body).to_request();
    let reg_resp = test::call_service(&app, reg_req).await;
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    #[derive(Debug, Deserialize)]
    struct RegUser5 { id: Uuid }
    #[derive(Debug, Deserialize)]
    struct RegData5 { user: RegUser5, token: String }
    let reg_body5: ApiResponse<RegData5> = test::read_body_json(reg_resp).await;
    let token = reg_body5.data.unwrap().token;

    // Create task to delete
    let payload = json!({
        "title": "Delete Me",
        "description": "test desc",
        "tags": ["rust", "test"],
    });
    let req_c = test::TestRequest::post()
        .uri("/tasks")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .set_json(&payload)
        .to_request();
    let resp_c = test::call_service(&app, req_c).await;
    assert_eq!(resp_c.status(), StatusCode::CREATED);
    let body_c: ApiResponse<Task> = test::read_body_json(resp_c).await;
    let created = body_c.data.unwrap();

    let req = test::TestRequest::delete()
        .uri(&format!("/tasks/{}", created.id))
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: ApiResponse<DeletedResp> = test::read_body_json(resp).await;
    let data = body.data.expect("data must be present");
    assert!(data.deleted);
}
