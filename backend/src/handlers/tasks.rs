use actix_web::{web, get, post, put, delete, HttpResponse, Result};
use serde_json::json;
use sqlx::PgPool;
use validator::Validate;
use uuid::Uuid;

use crate::models::{Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters, TasksResponse};
use crate::middleware::auth::AuthenticatedUser;
use crate::utils::response::*;
use crate::services::notification_service::NotificationService;

#[get("")]
pub async fn get_tasks(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    query: web::Query<TaskFilters>,
) -> Result<HttpResponse> {
    let filters = query.into_inner();
    let page = filters.page.unwrap_or(1);
    let limit = filters.limit.unwrap_or(10).min(100);
    let offset = (page - 1) * limit;

    // Build dynamic query with filters
    let mut where_conditions = vec!["user_id = $1".to_string()];
    let mut params: Vec<String> = vec![];
    let mut param_count = 2;

    // Add status filter
    if let Some(status) = &filters.status {
        where_conditions.push(format!("status = ${}", param_count));
        params.push(format!("{:?}", status).to_lowercase().trim_matches('"').to_string());
        param_count += 1;
    }

    // Add priority filter
    if let Some(priority) = &filters.priority {
        where_conditions.push(format!("priority = ${}", param_count));
        params.push(format!("{:?}", priority).to_lowercase().trim_matches('"').to_string());
        param_count += 1;
    }

    // Add search filter
    let search_pattern = if let Some(search) = &filters.search {
        where_conditions.push(format!("(title ILIKE ${} OR description ILIKE ${})", param_count, param_count));
        let pattern = format!("%{}%", search);
        params.push(pattern.clone());
        param_count += 1;
        Some(pattern)
    } else {
        None
    };

    // Add tag filter
    if let Some(tag) = &filters.tag {
        where_conditions.push(format!("tags::text ILIKE ${}", param_count));
        params.push(format!("%{}%", tag));
        param_count += 1;
    }

    // Add created date range filters
    if let Some(created_from) = &filters.created_from {
        where_conditions.push(format!("created_at >= ${}", param_count));
        params.push(created_from.to_rfc3339());
        param_count += 1;
    }

    if let Some(created_to) = &filters.created_to {
        where_conditions.push(format!("created_at <= ${}", param_count));
        params.push(created_to.to_rfc3339());
        param_count += 1;
    }

    // Add due date range filters
    if let Some(due_from) = &filters.due_from {
        where_conditions.push(format!("due_date >= ${}", param_count));
        params.push(due_from.to_rfc3339());
        param_count += 1;
    }

    if let Some(due_to) = &filters.due_to {
        where_conditions.push(format!("due_date <= ${}", param_count));
        params.push(due_to.to_rfc3339());
        param_count += 1;
    }

    let where_clause = where_conditions.join(" AND ");
    
    // Build ORDER BY clause
    let sort_field = match filters.sort_by.as_deref() {
        Some("title") => "title",
        Some("status") => "status",
        Some("priority") => "priority", 
        Some("due_date") => "due_date",
        Some("updated_at") => "updated_at",
        _ => "created_at", // default
    };
    
    let sort_order = match filters.sort_order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC", // default
    };
    
    let query_str = format!(
        "SELECT * FROM tasks WHERE {} ORDER BY {} {} LIMIT ${} OFFSET ${}",
        where_clause, sort_field, sort_order, param_count, param_count + 1
    );

    // Build the query with all parameters
    let mut query = sqlx::query_as::<_, Task>(&query_str).bind(&user.0.id);

    // Bind all filter parameters in order
    if let Some(status) = &filters.status {
        query = query.bind(status);
    }
    if let Some(priority) = &filters.priority {
        query = query.bind(priority);
    }
    if let Some(search_pattern) = &search_pattern {
        query = query.bind(search_pattern);
    }
    if let Some(tag) = &filters.tag {
        query = query.bind(format!("%{}%", tag));
    }
    if let Some(created_from) = &filters.created_from {
        query = query.bind(created_from);
    }
    if let Some(created_to) = &filters.created_to {
        query = query.bind(created_to);
    }
    if let Some(due_from) = &filters.due_from {
        query = query.bind(due_from);
    }
    if let Some(due_to) = &filters.due_to {
        query = query.bind(due_to);
    }

    // Bind limit and offset
    query = query.bind(limit as i64).bind(offset as i64);

    let tasks = query.fetch_all(pool.get_ref()).await;

    let tasks = match tasks {
        Ok(tasks) => tasks,
        Err(e) => {
            return Ok(internal_error_response(&format!("Failed to fetch tasks: {}", e)));
        }
    };

    // Get total count with same filters
    let count_query_str = format!("SELECT COUNT(*) FROM tasks WHERE {}", where_clause);
    let mut count_query = sqlx::query_scalar::<_, i64>(&count_query_str).bind(&user.0.id);

    // Bind the same filter parameters for count query
    if let Some(status) = &filters.status {
        count_query = count_query.bind(status);
    }
    if let Some(priority) = &filters.priority {
        count_query = count_query.bind(priority);
    }
    if let Some(search_pattern) = &search_pattern {
        count_query = count_query.bind(search_pattern);
    }
    if let Some(tag) = &filters.tag {
        count_query = count_query.bind(format!("%{}%", tag));
    }
    if let Some(created_from) = &filters.created_from {
        count_query = count_query.bind(created_from);
    }
    if let Some(created_to) = &filters.created_to {
        count_query = count_query.bind(created_to);
    }
    if let Some(due_from) = &filters.due_from {
        count_query = count_query.bind(due_from);
    }
    if let Some(due_to) = &filters.due_to {
        count_query = count_query.bind(due_to);
    }

    let total_count = count_query.fetch_one(pool.get_ref()).await.unwrap_or(0);

    let total_pages = ((total_count as f64) / (limit as f64)).ceil() as u32;

    let response = TasksResponse {
        tasks,
        total: total_count,
        page,
        limit,
        total_pages,
    };

    Ok(ok_response(response, "Tasks retrieved successfully"))
}

#[post("")]
pub async fn create_task(
    pool: web::Data<PgPool>,
    notification_service: web::Data<NotificationService>,
    user: AuthenticatedUser,
    task_data: web::Json<CreateTaskRequest>,
) -> Result<HttpResponse> {
    if let Err(errors) = task_data.validate() {
        return Ok(validation_error_response(errors));
    }

    let task_data = task_data.into_inner();
    
    // Validate due_date is in the future if provided
    if let Some(due_date) = &task_data.due_date {
        if due_date <= &chrono::Utc::now() {
            let error = ApiError::new("INVALID_DUE_DATE", "Due date must be in the future");
            return Ok(bad_request_response(error));
        }
    }
    
    let task_id = Uuid::new_v4();
    let tags_json = task_data.tags.map(|tags| json!(tags)).unwrap_or_else(|| json!([]));

    let result = sqlx::query(
        r#"
        INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#
    )
    .bind(&task_id)
    .bind(&user.0.id)
    .bind(&task_data.title)
    .bind(&task_data.description)
    .bind(&task_data.status.unwrap_or(crate::models::TaskStatus::Todo))
    .bind(&task_data.priority.unwrap_or(crate::models::TaskPriority::Med))
    .bind(&task_data.due_date)
    .bind(&tags_json)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => {
            let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
                .bind(&task_id)
                .fetch_one(pool.get_ref())
                .await
                .unwrap();

            // 🔔 Create automatic notification for new task
            let _ = notification_service.notify_task_assigned(
                user.0.id, 
                &task.title, 
                0
            ).await;

            Ok(created_response(task, "Task created successfully"))
        }
        Err(e) => {
            Ok(internal_error_response(&format!("Failed to create task: {}", e)))
        }
    }
}

#[get("/{id}")]
pub async fn get_task(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let task_id = path.into_inner();

    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1 AND user_id = $2"
    )
    .bind(&task_id)
    .bind(&user.0.id)
    .fetch_optional(pool.get_ref())
    .await;

    match task {
        Ok(Some(task)) => Ok(ok_response(task, "Task retrieved successfully")),
        Ok(None) => Ok(not_found_response("task")),
        Err(e) => Ok(internal_error_response(&e.to_string()))
    }
}

#[put("/{id}")]
pub async fn update_task(
    pool: web::Data<PgPool>,
    notification_service: web::Data<NotificationService>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
    task_data: web::Json<UpdateTaskRequest>,
) -> Result<HttpResponse> {
    if let Err(errors) = task_data.validate() {
        return Ok(validation_error_response(errors));
    }

    let task_id = path.into_inner();
    let task_data = task_data.into_inner();
    
    // Validate due_date is in the future if provided
    if let Some(due_date) = &task_data.due_date {
        if due_date <= &chrono::Utc::now() {
            let error = ApiError::new("INVALID_DUE_DATE", "Due date must be in the future");
            return Ok(bad_request_response(error));
        }
    }

    // Check if task exists and belongs to user
    let existing_task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1 AND user_id = $2"
    )
    .bind(&task_id)
    .bind(&user.0.id)
    .fetch_optional(pool.get_ref())
    .await;

    let existing_task = match existing_task {
        Ok(Some(task)) => task,
        Ok(None) => {
            return Ok(not_found_response("task"));
        }
        Err(e) => {
            return Ok(internal_error_response(&e.to_string()));
        }
    };

    // 🔔 Detect if task is being marked as completed
    let task_being_completed = task_data.status.as_ref() == Some(&crate::models::TaskStatus::Done) 
        && existing_task.status != crate::models::TaskStatus::Done;

    // Build update query dynamically
    let mut updates = Vec::new();
    let mut param_count = 3;

    if task_data.title.is_some() {
        updates.push(format!("title = ${}", param_count));
        param_count += 1;
    }
    if task_data.description.is_some() {
        updates.push(format!("description = ${}", param_count));
        param_count += 1;
    }
    if task_data.status.is_some() {
        updates.push(format!("status = ${}", param_count));
        param_count += 1;
    }
    if task_data.priority.is_some() {
        updates.push(format!("priority = ${}", param_count));
        param_count += 1;
    }
    if task_data.due_date.is_some() {
        updates.push(format!("due_date = ${}", param_count));
        param_count += 1;
    }
    if task_data.tags.is_some() {
        updates.push(format!("tags = ${}", param_count));
        // Last param_count increment, so no warning about unused assignment
    }

    if updates.is_empty() {
        return Ok(bad_request_response(ApiError::new("NO_UPDATES", "No fields to update")));
    }

    let query_str = format!(
        "UPDATE tasks SET {} WHERE id = $1 AND user_id = $2",
        updates.join(", ")
    );

    let mut query = sqlx::query(&query_str).bind(&task_id).bind(&user.0.id);

    if let Some(title) = &task_data.title {
        query = query.bind(title);
    }
    if let Some(description) = &task_data.description {
        query = query.bind(description);
    }
    if let Some(status) = &task_data.status {
        query = query.bind(status);
    }
    if let Some(priority) = &task_data.priority {
        query = query.bind(priority);
    }
    if let Some(due_date) = &task_data.due_date {
        query = query.bind(due_date);
    }
    if let Some(tags) = &task_data.tags {
        query = query.bind(json!(tags));
    }

    match query.execute(pool.get_ref()).await {
        Ok(_) => {
            let updated_task = sqlx::query_as::<_, Task>(
                "SELECT * FROM tasks WHERE id = $1"
            )
            .bind(&task_id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap();

            if task_being_completed {
                let _ = notification_service.notify_task_completed(
                    user.0.id, 
                    &updated_task.title, 
                    0
                ).await;
            }

            Ok(ok_response(updated_task, "Task updated successfully"))
        }
        Err(e) => {
            Ok(internal_error_response(&format!("Failed to update task: {}", e)))
        }
    }
}

#[delete("/{id}")]
pub async fn delete_task(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let task_id = path.into_inner();

    let result = sqlx::query(
        "DELETE FROM tasks WHERE id = $1 AND user_id = $2"
    )
    .bind(&task_id)
    .bind(&user.0.id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(rows) => {
            if rows.rows_affected() == 0 {
                Ok(not_found_response("task"))
            } else {
                let success_data = serde_json::json!({"deleted": true});
                Ok(ok_response(success_data, "Task deleted successfully"))
            }
        }
        Err(e) => {
            Ok(internal_error_response(&format!("Failed to delete task: {}", e)))
        }
    }
}