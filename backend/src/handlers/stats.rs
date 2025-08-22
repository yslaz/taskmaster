use actix_web::{web, get, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::collections::HashMap;

use crate::middleware::auth::AuthenticatedUser;
use crate::utils::response::ApiResponse;

#[derive(Debug, Serialize)]
pub struct TaskStats {
    // General statistics
    pub total_tasks: i64,
    pub tasks_by_status: HashMap<String, i64>,
    pub tasks_by_priority: HashMap<String, i64>,
    pub completion_rate: f64,
    
    // Period-specific statistics
    pub period_summary: PeriodSummary,
    
    // Data for charts (time series)
    pub time_series: TimeSeries,
    
    // Additional statistics
    pub overdue_tasks: i64,
    pub due_today: i64,
    pub due_this_week: i64,
}

#[derive(Debug, Serialize)]
pub struct PeriodSummary {
    pub period: String,
    pub from_date: Option<String>,
    pub to_date: Option<String>,
    pub tasks_created: i64,
    pub tasks_completed: i64,
    pub tasks_updated: i64,
}

#[derive(Debug, Serialize)]
pub struct TimeSeries {
    pub labels: Vec<String>,
    pub created: Vec<i64>,
    pub completed: Vec<i64>,
    pub updated: Vec<i64>,
}

#[derive(Debug, Deserialize)]
pub struct StatsQuery {
    pub period: Option<String>,        // day, week, month, year
    pub from_date: Option<String>,     // YYYY-MM-DD
    pub to_date: Option<String>,       // YYYY-MM-DD
}

#[get("/statistics")]
pub async fn get_task_statistics(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    query: web::Query<StatsQuery>,
) -> Result<HttpResponse> {
    let user_id = user.0.id;
    let period = query.period.as_deref().unwrap_or("day");
    let from_date = query.from_date.as_deref();
    let to_date = query.to_date.as_deref();

    // Build date conditions
    let date_condition = match (from_date, to_date) {
        (Some(from), Some(to)) => format!("AND created_at >= '{}' AND created_at <= '{} 23:59:59'", from, to),
        (Some(from), None) => format!("AND created_at >= '{}'", from),
        (None, Some(to)) => format!("AND created_at <= '{} 23:59:59'", to),
        (None, None) => String::new(),
    };

    // Determine grouping format based on period
    let date_trunc = match period {
        "year" => "year",
        "month" => "month", 
        "week" => "week",
        _ => "day", // default to day
    };

    // General statistics (without date filter)
    let total_tasks: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    // Tasks by status
    let status_rows = sqlx::query(
        "SELECT status::text as status, COUNT(*) as count FROM tasks WHERE user_id = $1 GROUP BY status"
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let mut tasks_by_status = HashMap::new();
    for row in status_rows {
        let status: String = row.try_get("status").unwrap_or_default();
        let count: i64 = row.try_get("count").unwrap_or(0);
        tasks_by_status.insert(status, count);
    }

    // Tasks by priority
    let priority_rows = sqlx::query(
        "SELECT priority::text as priority, COUNT(*) as count FROM tasks WHERE user_id = $1 GROUP BY priority"
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let mut tasks_by_priority = HashMap::new();
    for row in priority_rows {
        let priority: String = row.try_get("priority").unwrap_or_default();
        let count: i64 = row.try_get("count").unwrap_or(0);
        tasks_by_priority.insert(priority, count);
    }

    // Completion rate
    let completed_tasks = tasks_by_status.get("done").unwrap_or(&0);
    let completion_rate = if total_tasks > 0 {
        (*completed_tasks as f64 / total_tasks as f64) * 100.0
    } else {
        0.0
    };

    // Period-specific statistics
    let period_created_query = format!(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1 {}",
        date_condition
    );
    let period_created: i64 = sqlx::query_scalar(&period_created_query)
        .bind(user_id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let period_completed_query = format!(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'done' {}",
        date_condition.replace("created_at", "updated_at")
    );
    let period_completed: i64 = sqlx::query_scalar(&period_completed_query)
        .bind(user_id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let period_updated_query = format!(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1 {}",
        date_condition.replace("created_at", "updated_at")
    );
    let period_updated: i64 = sqlx::query_scalar(&period_updated_query)
        .bind(user_id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    // Time series for charts
    let time_series_query = format!(
        "SELECT 
            DATE_TRUNC('{}', created_at) as period,
            COUNT(*) as created_count
         FROM tasks 
         WHERE user_id = $1 {} 
         GROUP BY DATE_TRUNC('{}', created_at) 
         ORDER BY period",
        date_trunc, date_condition, date_trunc
    );

    let time_series_rows = sqlx::query(&time_series_query)
        .bind(user_id)
        .fetch_all(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let mut labels = Vec::new();
    let mut created_counts = Vec::new();

    for row in time_series_rows {
        let period_date: chrono::DateTime<chrono::Utc> = row.try_get("period").unwrap_or_default();
        let created_count: i64 = row.try_get("created_count").unwrap_or(0);
        
        labels.push(period_date.format("%Y-%m-%d").to_string());
        created_counts.push(created_count);
    }

    // Time series for completed tasks
    let completed_series_query = format!(
        "SELECT 
            DATE_TRUNC('{}', updated_at) as period,
            COUNT(*) as completed_count
         FROM tasks 
         WHERE user_id = $1 AND status = 'done' {} 
         GROUP BY DATE_TRUNC('{}', updated_at) 
         ORDER BY period",
        date_trunc, date_condition.replace("created_at", "updated_at"), date_trunc
    );

    let completed_series_rows = sqlx::query(&completed_series_query)
        .bind(user_id)
        .fetch_all(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    // Create a map to match dates
    let mut completed_map = HashMap::new();
    for row in completed_series_rows {
        let period_date: chrono::DateTime<chrono::Utc> = row.try_get("period").unwrap_or_default();
        let completed_count: i64 = row.try_get("completed_count").unwrap_or(0);
        completed_map.insert(period_date.format("%Y-%m-%d").to_string(), completed_count);
    }

    // Align completed data with labels
    let completed_counts: Vec<i64> = labels.iter()
        .map(|label| completed_map.get(label).copied().unwrap_or(0))
        .collect();

    // Additional statistics
    let overdue_tasks: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND due_date < NOW() AND status != 'done'"
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let due_today: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND DATE(due_date) = CURRENT_DATE AND status != 'done'"
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let due_this_week: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND due_date >= CURRENT_DATE AND due_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' AND status != 'done'"
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let stats = TaskStats {
        total_tasks,
        tasks_by_status,
        tasks_by_priority,
        completion_rate,
        period_summary: PeriodSummary {
            period: period.to_string(),
            from_date: from_date.map(|s| s.to_string()),
            to_date: to_date.map(|s| s.to_string()),
            tasks_created: period_created,
            tasks_completed: period_completed,
            tasks_updated: period_updated,
        },
        time_series: TimeSeries {
            labels,
            created: created_counts,
            completed: completed_counts,
            updated: vec![],
        },
        overdue_tasks,
        due_today,
        due_this_week,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(stats, "Statistics retrieved successfully")))
}
