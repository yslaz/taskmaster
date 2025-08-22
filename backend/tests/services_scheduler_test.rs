use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;

async fn test_pool() -> PgPool {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set for service tests");
    PgPool::connect(&db_url).await.expect("pool connect")
}

async fn ensure_user_exists(pool: &PgPool, user_id: Uuid, email: &str) {
    let _ = sqlx::query(
        r#"
        INSERT INTO users (id, name, email, password_hash, created_at)
        VALUES ($1, 'Scheduler Tester', $2, '$2b$12$C6UzMDM.H6dfI/f/IKcEe.6sI6k9Hkq1i5Vh5b9q2qFQn1m4pAtG2', NOW())
        ON CONFLICT (email) DO NOTHING
        "#
    )
    .bind(user_id)
    .bind(email)
    .execute(pool)
    .await
    .expect("insert user");
}

#[actix_rt::test]
async fn test_scheduler_new_and_run_checks_now() {
    use taskmaster_backend::services::notification_service::NotificationService;
    use taskmaster_backend::services::scheduler::TaskScheduler;

    let pool = test_pool().await;
    let service = NotificationService::new(pool.clone());
    let scheduler = TaskScheduler::new(pool.clone(), service.clone());

    // Should not panic
    scheduler.start();

    // Can run checks on empty DB without errors
    scheduler.run_checks_now().await.expect("run_checks_now");
}
