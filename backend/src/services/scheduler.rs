use std::time::Duration;
use tokio::time::interval;
use sqlx::{PgPool, Row};
use chrono::{Utc, DateTime};
use uuid::Uuid;

use crate::services::notification_service::NotificationService;

pub struct TaskScheduler {
    pool: PgPool,
    notification_service: NotificationService,
}

impl TaskScheduler {
    pub fn new(pool: PgPool, notification_service: NotificationService) -> Self {
        Self {
            pool,
            notification_service,
        }
    }

    pub fn start(&self) {
        let pool = self.pool.clone();
        let notification_service = self.notification_service.clone();

        // Execute every hour
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(3600));
            
            loop {
                interval.tick().await;
                
                if let Err(e) = Self::check_due_soon_tasks(&pool, &notification_service).await {
                    tracing::error!("Error checking due soon tasks: {}", e);
                }
                
                if let Err(e) = Self::check_overdue_tasks(&pool, &notification_service).await {
                    tracing::error!("Error checking overdue tasks: {}", e);
                }
            }
        });
    }

    async fn check_due_soon_tasks(
        pool: &PgPool, 
        notification_service: &NotificationService
    ) -> Result<(), Box<dyn std::error::Error>> {
        let now = Utc::now();
        let two_hours_from_now = now + chrono::Duration::hours(2);

        // Search for tasks due in the next 2 hours (simple query without complex subqueries)
        let due_soon_tasks = sqlx::query(
            r#"
            SELECT id, user_id, title, due_date
            FROM tasks 
            WHERE due_date BETWEEN $1 AND $2 
                AND status != 'done'
            "#,
        )
        .bind(now)
        .bind(two_hours_from_now)
        .fetch_all(pool)
        .await?;

        for task_row in &due_soon_tasks {
            let user_id: Uuid = task_row.get("user_id");
            let title: String = task_row.get("title");
            let due_date: DateTime<Utc> = task_row.get("due_date");
            
            let hours_until_due = (due_date - now).num_hours() as i32;
            
            let _ = notification_service
                .notify_task_due_soon(user_id, &title, hours_until_due)
                .await;
        }

        tracing::info!("Checked {} tasks for due soon notifications", due_soon_tasks.len());
        Ok(())
    }

    async fn check_overdue_tasks(
        pool: &PgPool, 
        notification_service: &NotificationService
    ) -> Result<(), Box<dyn std::error::Error>> {
        let now = Utc::now();

        // Search for overdue tasks (simple query)
        let overdue_tasks = sqlx::query(
            r#"
            SELECT id, user_id, title
            FROM tasks 
            WHERE due_date < $1 
                AND status != 'done'
            "#,
        )
        .bind(now)
        .fetch_all(pool)
        .await?;

        for task_row in &overdue_tasks {
            let user_id: Uuid = task_row.get("user_id");
            let title: String = task_row.get("title");
            
            let _ = notification_service
                .notify_task_overdue(user_id, &title, 0)
                .await;
        }

        tracing::info!("Checked {} tasks for overdue notifications", overdue_tasks.len());
        Ok(())
    }

    // Test method to manually execute checks
    #[allow(dead_code)]
    pub async fn run_checks_now(&self) -> Result<(), Box<dyn std::error::Error>> {
        Self::check_due_soon_tasks(&self.pool, &self.notification_service).await?;
        Self::check_overdue_tasks(&self.pool, &self.notification_service).await?;
        Ok(())
    }
}
