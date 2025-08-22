use actix_web::{test, web, App, http::StatusCode};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;
use taskmaster_backend::handlers::{auth, tasks, stats, notifications};
use taskmaster_backend::models::{notification::NotificationResponse};
use taskmaster_backend::services::notification_service::NotificationService;
use taskmaster_backend::handlers::health_check;

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct ApiResponse<T> { success: bool, data: Option<T>, message: String }

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
        // auth
        .service(auth::register)
        // tasks under /tasks
        .service(web::scope("/tasks")
            .service(tasks::get_tasks)
            .service(tasks::create_task)
            .service(tasks::get_task)
            .service(tasks::update_task)
            .service(tasks::delete_task)
        )
        // stats under /stats
        .service(web::scope("/stats")
            .service(stats::get_task_statistics)
        )
        // notifications under /notifications
        .service(web::scope("/notifications")
            .service(notifications::get_notifications)
            .service(notifications::get_unread_count)
            .service(notifications::mark_as_read)
        )
        // health
    .service(health_check)
}

#[actix_web::test]
async fn test_health_check_ok() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    let req = test::TestRequest::get().uri("/health").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_web::test]
async fn test_stats_get_task_statistics() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // register and get token
    let email = format!("stats_user_{}@example.com", Uuid::new_v4());
    let reg_body = json!({
        "name": "Stats User",
        "email": email,
        "password": "password123",
    });
    let reg_req = test::TestRequest::post().uri("/register").set_json(&reg_body).to_request();
    let reg_resp = test::call_service(&app, reg_req).await;
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    #[derive(Debug, Deserialize)]
    struct RegData { token: String }
    let reg_body_json: ApiResponse<RegData> = test::read_body_json(reg_resp).await;
    let token = reg_body_json.data.unwrap().token;

    // Crea algunas tasks para tener datos
    for title in ["S1", "S2", "S3"] {
        let payload = json!({ "title": title });
        let req = test::TestRequest::post()
            .uri("/tasks")
            .insert_header(("Authorization", format!("Bearer {}", token)))
            .set_json(&payload)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::CREATED);
    }

    let req = test::TestRequest::get()
        .uri("/stats/statistics?period=day")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let _body: ApiResponse<serde_json::Value> = test::read_body_json(resp).await;
}

#[actix_web::test]
async fn test_notifications_websocket_auth_and_receive() {
    use awc::ws;
    use futures_util::{StreamExt, SinkExt};
    use actix_web::{App, HttpServer};
    use std::net::TcpListener;

    // Service + server with only WS route
    let pool = setup_test_db().await;
    let notification_service = NotificationService::new(pool.clone());
    let ns_for_app = notification_service.clone();

    // Bind ephemeral port
    let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
    let addr = listener.local_addr().unwrap();
    let ws_url = format!("ws://{}/ws/notifications", addr);

    // Start server in background
    let server = HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(ns_for_app.clone()))
            .route("/ws/notifications", web::get().to(notifications::websocket))
    })
    .listen(listener)
    .expect("listen")
    .run();
    actix_rt::spawn(server);

    // Connect WS client
    let (_resp, mut framed) = awc::Client::new()
        .ws(ws_url)
        .connect()
        .await
        .expect("ws connect");

    // Send auth message
    let user_id = Uuid::new_v4();
    let auth_msg = format!("{{\"user_id\":\"{}\"}}", user_id);
    framed.send(ws::Message::Text(auth_msg.into())).await.expect("send auth");

    // Expect authenticated ack
    let mut authed = false;
    for _ in 0..10 {
        if let Some(Ok(frame)) = framed.next().await {
            if let ws::Frame::Text(txt) = frame {
                let s = String::from_utf8_lossy(&txt);
                if s.contains("authenticated") { authed = true; break; }
            }
        }
    }
    assert!(authed, "should receive auth ack");

    // Broadcast a notification
    notification_service
        .notify_task_assigned(user_id, "WS Task", 1)
        .await
        .expect("notify");

    // Receive notification frame
    let mut got_notification = false;
    for _ in 0..20 {
        if let Some(Ok(frame)) = framed.next().await {
            if let ws::Frame::Text(txt) = frame {
                let s = String::from_utf8_lossy(&txt);
                if s.contains("\"type\":\"notification\"") { got_notification = true; break; }
            }
        }
    }
    assert!(got_notification, "should receive notification via WS");
}

#[actix_web::test]
async fn test_notifications_flow_get_list_count_mark_read() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_app(pool)).await;
    // register and get token
    let email = format!("stats_user_{}@example.com", Uuid::new_v4());
    let reg_body = json!({
        "name": "Stats User",
        "email": email,
        "password": "password123",
    });
    let reg_req = test::TestRequest::post().uri("/register").set_json(&reg_body).to_request();
    let reg_resp = test::call_service(&app, reg_req).await;
    assert_eq!(reg_resp.status(), StatusCode::CREATED);
    #[derive(Debug, Deserialize)]
    struct RegData2 { token: String }
    let reg_body_json: ApiResponse<RegData2> = test::read_body_json(reg_resp).await;
    let token = reg_body_json.data.unwrap().token;

    // Crear una task, lo que debería disparar una notificación "assigned"
    let payload = json!({ "title": "N1" });
    let req_c = test::TestRequest::post()
        .uri("/tasks")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .set_json(&payload)
        .to_request();
    let resp_c = test::call_service(&app, req_c).await;
    assert_eq!(resp_c.status(), StatusCode::CREATED);

    // get_notifications
    let req_g = test::TestRequest::get()
        .uri("/notifications")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp_g = test::call_service(&app, req_g).await;
    assert_eq!(resp_g.status(), StatusCode::OK);
    let list_body: ApiResponse<Vec<NotificationResponse>> = test::read_body_json(resp_g).await;
    let items = list_body.data.unwrap();
    assert!(!items.is_empty());
    let first_id = items[0].id;

    // get_unread_count
    let req_cu = test::TestRequest::get()
        .uri("/notifications/unread-count")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp_cu = test::call_service(&app, req_cu).await;
    assert_eq!(resp_cu.status(), StatusCode::OK);
    let _count_body: ApiResponse<serde_json::Value> = test::read_body_json(resp_cu).await;

    // mark_as_read
    let mark_body = json!({ "notification_ids": [first_id] });
    let req_m = test::TestRequest::post()
        .uri("/notifications/mark-read")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .set_json(&mark_body)
        .to_request();
    let resp_m = test::call_service(&app, req_m).await;
    assert_eq!(resp_m.status(), StatusCode::OK);
}
