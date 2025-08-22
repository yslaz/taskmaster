use uuid::Uuid;
use chrono::Utc;
use sqlx::{PgPool, Row};

async fn test_pool() -> PgPool {
    // Uses DATABASE_URL from env; ensure it points to your test DB
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set for service tests");
    PgPool::connect(&db_url).await.expect("pool connect")
}

async fn ensure_user_exists(pool: &PgPool, desired_id: Uuid, email: &str) -> Uuid {
    // Upsert by email; return the actual id to use
    let row = sqlx::query(
        r#"
        INSERT INTO users (id, name, email, password_hash, created_at)
        VALUES ($1, 'Svc Tester', $2, '$2b$12$C6UzMDM.H6dfI/f/IKcEe.6sI6k9Hkq1i5Vh5b9q2qFQn1m4pAtG2', NOW())
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        "#
    )
    .bind(desired_id)
    .bind(email)
    .fetch_one(pool)
    .await
    .expect("upsert user");
    row.get::<Uuid, _>("id")
}

#[actix_rt::test]
async fn test_create_and_list_and_mark_read_and_unread_count() {
    use taskmaster_backend::services::notification_service::NotificationService;
    use taskmaster_backend::models::notification::CreateNotification;

    let pool = test_pool().await;
    let service = NotificationService::new(pool.clone());
    let desired_id = Uuid::new_v4();
    let email = format!("svc-notif-{}@example.com", Utc::now().timestamp());
    let user_id = ensure_user_exists(&pool, desired_id, &email).await;

    // create_notification
    let created = service.create_notification(CreateNotification{
        user_id,
        notification_type: "task_assigned".into(),
        title: "Assigned".into(),
        message: "A task".into(),
        metadata: None,
    }).await.expect("create_notification");
    assert_eq!(created.title, "Assigned");

    // get_user_notifications
    let list = service.get_user_notifications(user_id, Some(10), Some(0)).await.expect("list");
    assert!(!list.is_empty());

    // get_unread_count
    let count_before = service.get_unread_count(user_id).await.expect("count");
    assert!(count_before >= 1);

    // mark_as_read
    let ids: Vec<i32> = list.iter().map(|n| n.id).collect();
    service.mark_as_read(ids, user_id).await.expect("mark read");

    let count_after = service.get_unread_count(user_id).await.expect("count after");
    assert_eq!(count_after, 0);
}

#[actix_rt::test]
async fn test_helper_notifications_builders() {
    use taskmaster_backend::services::notification_service::NotificationService;

    let pool = test_pool().await;
    let service = NotificationService::new(pool.clone());
    let desired_id = Uuid::new_v4();
    let email = format!("svc-helpers-{}@example.com", Utc::now().timestamp());
    let user_id = ensure_user_exists(&pool, desired_id, &email).await;

    let n1 = service.notify_task_due_soon(user_id, "Task A", 2).await.expect("due soon");
    assert_eq!(n1.notification_type, "task_due_soon");

    let n2 = service.notify_task_assigned(user_id, "Task B", 42).await.expect("assigned");
    assert_eq!(n2.notification_type, "task_assigned");

    let n3 = service.notify_task_completed(user_id, "Task C", 7).await.expect("completed");
    assert_eq!(n3.notification_type, "task_completed");

    let n4 = service.notify_task_overdue(user_id, "Task D", 3).await.expect("overdue");
    assert_eq!(n4.notification_type, "task_overdue");
}
