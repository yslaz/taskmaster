use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware::Logger};
use dotenvy::dotenv;
use std::env;
use tracing::{info, error};
use tracing_subscriber;

mod database;
mod models;
mod handlers;
mod middleware;
mod utils;
mod services;

use database::create_pool;
use services::notification_service::NotificationService;
use services::scheduler::TaskScheduler;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let server_host = env::var("SERVER_HOST")
        .unwrap_or_else(|_| "0.0.0.0".to_string());
    
    let server_port = env::var("SERVER_PORT")
        .unwrap_or_else(|_| "8000".to_string())
        .parse::<u16>()
        .expect("SERVER_PORT must be a valid number");

    let cors_origin = env::var("CORS_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    info!("Connecting to database...");
    info!("Database URL: {}", database_url.replace(&database_url.split('@').nth(0).unwrap_or(""), "***:***"));
    
    let pool = match create_pool(&database_url).await {
        Ok(pool) => {
            info!("✅ Successfully connected to database");
            pool
        }
        Err(e) => {
            error!("❌ Failed to create database pool: {}", e);
            error!("🔍 Troubleshooting tips:");
            error!("   1. Verify the DATABASE_URL is correct");
            error!("   2. Check if the database server is running");
            error!("   3. Verify network connectivity to the remote server");
            error!("   4. Check firewall settings");
            error!("   5. Verify database credentials");
            panic!("Failed to create database pool: {}", e);
        }
    };
    
    info!("Running migrations...");
    if let Err(e) = database::run_migrations(&pool).await {
        error!("Failed to run migrations: {}", e);
        panic!("Migration failed");
    }
    
    // Initialize notification service
    let notification_service = NotificationService::new(pool.clone());
    
    // Initialize and start task scheduler
    info!("Starting task scheduler...");
    let scheduler = TaskScheduler::new(pool.clone(), notification_service.clone());
    scheduler.start();
    
    info!("Starting server at {}:{}", server_host, server_port);

    HttpServer::new(move || {
        let cors = if cors_origin == "*" {
            Cors::permissive()
        } else {
            Cors::default()
                .allowed_origin(&cors_origin)
                .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
                .allowed_headers(vec!["Content-Type", "Authorization"])
                .supports_credentials()
                .max_age(3600)
        };

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(notification_service.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api/v1")
                    .service(handlers::health_check)
                    .service(
                        web::scope("/auth")
                            .service(handlers::auth::register)
                            .service(handlers::auth::login)
                            .service(handlers::auth::me)
                    )
                    .service(
                        web::scope("/tasks")
                            .service(handlers::tasks::get_tasks)
                            .service(handlers::tasks::create_task)
                            .service(handlers::tasks::get_task)
                            .service(handlers::tasks::update_task)
                            .service(handlers::tasks::delete_task)
                    )
                    .service(
                        web::scope("/notifications")
                            .service(handlers::notifications::get_notifications)
                            .service(handlers::notifications::get_unread_count)
                            .service(handlers::notifications::mark_as_read)
                    )
                    .service(handlers::stats::get_task_statistics)
            )
            // WebSocket endpoint
            .route("/ws/notifications", web::get().to(handlers::notifications::websocket))
    })
    .bind(format!("{}:{}", server_host, server_port))?
    .run()
    .await
}
