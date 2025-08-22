use actix_web::{body::to_bytes, http::StatusCode};

#[actix_web::test]
async fn test_ok_and_created_response() {
    use taskmaster_backend::utils::response::{ok_response, created_response};
    use serde::Deserialize;

    #[derive(Deserialize)]
    struct Resp<T> { success: bool, data: Option<T>, message: String }

    let ok = ok_response(serde_json::json!({"k":1}), "ok");
    assert_eq!(ok.status(), StatusCode::OK);
    let body = to_bytes(ok.into_body()).await.unwrap();
    let parsed: Resp<serde_json::Value> = serde_json::from_slice(&body).unwrap();
    assert!(parsed.success);
    assert_eq!(parsed.message, "ok");
    assert_eq!(parsed.data.unwrap()["k"], 1);

    let created = created_response(serde_json::json!({"x":"y"}), "created");
    assert_eq!(created.status(), StatusCode::CREATED);
    let body = to_bytes(created.into_body()).await.unwrap();
    let parsed: Resp<serde_json::Value> = serde_json::from_slice(&body).unwrap();
    assert!(parsed.success);
    assert_eq!(parsed.message, "created");
    assert_eq!(parsed.data.unwrap()["x"], "y");
}

#[actix_web::test]
async fn test_error_responses() {
    use taskmaster_backend::utils::response::*;

    let bad = bad_request_response(ApiError::validation_error(validator::ValidationErrors::new()));
    assert_eq!(bad.status(), StatusCode::BAD_REQUEST);

    // Direct helper for validation error response
    let bad2 = validation_error_response(validator::ValidationErrors::new());
    assert_eq!(bad2.status(), StatusCode::BAD_REQUEST);

    let unauth = unauthorized_response("nope");
    assert_eq!(unauth.status(), StatusCode::UNAUTHORIZED);

    let nf = not_found_response("task");
    assert_eq!(nf.status(), StatusCode::NOT_FOUND);

    let conflict = conflict_response("exists");
    assert_eq!(conflict.status(), StatusCode::CONFLICT);

    let internal = internal_error_response("boom");
    assert_eq!(internal.status(), StatusCode::INTERNAL_SERVER_ERROR);
}
