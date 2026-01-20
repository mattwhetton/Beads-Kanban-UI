//! Beads API route handlers.
//!
//! Provides endpoints for reading and modifying beads from .beads/issues.jsonl files.

use axum::{
    extract::Query,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;

use super::validate_path_security;

/// Query parameters for the beads endpoint.
#[derive(Debug, Deserialize)]
pub struct BeadsParams {
    /// The project path containing .beads/issues.jsonl
    pub path: String,
}

/// A dependency relationship in the JSONL file.
#[derive(Debug, Deserialize, Clone)]
struct Dependency {
    depends_on_id: String,
    #[serde(rename = "type")]
    dep_type: String,
}

/// A single bead/issue from the JSONL file.
#[derive(Debug, Serialize, Deserialize)]
pub struct Bead {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    pub status: String,
    #[serde(default)]
    pub priority: Option<i32>,
    #[serde(default)]
    pub issue_type: Option<String>,
    #[serde(default)]
    pub owner: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub created_by: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
    #[serde(default)]
    pub closed_at: Option<String>,
    #[serde(default)]
    pub close_reason: Option<String>,
    #[serde(default)]
    pub comments: Option<Vec<Comment>>,
    #[serde(default)]
    pub parent_id: Option<String>,
    #[serde(default)]
    pub children: Option<Vec<String>>,
    #[serde(default, alias = "design")]
    pub design_doc: Option<String>,
    #[serde(default)]
    pub deps: Option<Vec<String>>,
    #[serde(default, skip_serializing)]
    dependencies: Option<Vec<Dependency>>,
}

/// A comment on a bead.
#[derive(Debug, Serialize, Deserialize)]
pub struct Comment {
    pub id: i64,
    pub issue_id: String,
    pub author: String,
    pub text: String,
    pub created_at: String,
}

/// GET /api/beads?path=/path/to/project
///
/// Reads the .beads/issues.jsonl file from the specified project path
/// and returns an array of beads.
pub async fn read_beads(Query(params): Query<BeadsParams>) -> impl IntoResponse {
    let project_path = PathBuf::from(&params.path);

    // Security: Validate path is within allowed directories
    if let Err(e) = validate_path_security(&project_path) {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({ "error": e })),
        );
    }

    let issues_path = project_path.join(".beads").join("issues.jsonl");

    // Check if the file exists
    if !issues_path.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "No .beads/issues.jsonl found at the specified path" })),
        );
    }

    // Read the file contents
    let contents = match std::fs::read_to_string(&issues_path) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": format!("Failed to read file: {}", e) })),
            );
        }
    };

    // Parse JSONL (each line is a JSON object)
    let mut beads = Vec::new();
    for (line_num, line) in contents.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        match serde_json::from_str::<Bead>(line) {
            Ok(bead) => beads.push(bead),
            Err(e) => {
                tracing::warn!(
                    "Failed to parse bead at line {}: {} - {}",
                    line_num + 1,
                    e,
                    line
                );
                // Continue parsing other lines - graceful handling of malformed lines
            }
        }
    }

    // Post-process: Transform dependencies into parent_id and children
    // Build a map of parent_id -> Vec<child_id>
    let mut parent_to_children: std::collections::HashMap<String, Vec<String>> =
        std::collections::HashMap::new();

    // First pass: Extract parent-child relationships and set parent_id
    for bead in &mut beads {
        if let Some(deps) = &bead.dependencies {
            for dep in deps {
                if dep.dep_type == "parent-child" {
                    // Set parent_id on this bead
                    bead.parent_id = Some(dep.depends_on_id.clone());
                    // Record this bead as a child of the parent
                    parent_to_children
                        .entry(dep.depends_on_id.clone())
                        .or_default()
                        .push(bead.id.clone());
                }
            }
        }
    }

    // Second pass: Set children on parent beads
    for bead in &mut beads {
        if let Some(children) = parent_to_children.get(&bead.id) {
            bead.children = Some(children.clone());
        }
    }

    (StatusCode::OK, Json(serde_json::json!({ "beads": beads })))
}

/// Request body for adding a comment to a bead.
#[derive(Debug, Deserialize)]
pub struct AddCommentRequest {
    /// The project path containing .beads/issues.jsonl
    pub path: String,
    /// The ID of the bead to add a comment to
    pub bead_id: String,
    /// The comment text
    pub text: String,
    /// The author of the comment (e.g., email address)
    pub author: String,
}

/// Response for the add comment endpoint.
#[derive(Debug, Serialize)]
pub struct AddCommentResponse {
    pub success: bool,
    pub bead: Option<Bead>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// POST /api/beads/comment
///
/// Adds a comment to a specific bead in the .beads/issues.jsonl file.
pub async fn add_comment(Json(payload): Json<AddCommentRequest>) -> impl IntoResponse {
    let project_path = PathBuf::from(&payload.path);

    // Security: Validate path is within allowed directories
    if let Err(e) = validate_path_security(&project_path) {
        return (
            StatusCode::FORBIDDEN,
            Json(AddCommentResponse {
                success: false,
                bead: None,
                error: Some(e),
            }),
        );
    }

    let issues_path = project_path.join(".beads").join("issues.jsonl");

    // Check if the file exists
    if !issues_path.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(AddCommentResponse {
                success: false,
                bead: None,
                error: Some("No .beads/issues.jsonl found at the specified path".to_string()),
            }),
        );
    }

    // Read the file contents
    let contents = match std::fs::read_to_string(&issues_path) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(AddCommentResponse {
                    success: false,
                    bead: None,
                    error: Some(format!("Failed to read file: {}", e)),
                }),
            );
        }
    };

    // Parse JSONL and find the target bead
    let mut beads: Vec<Bead> = Vec::new();
    let mut found_bead_index: Option<usize> = None;
    let mut max_comment_id: i64 = 0;

    for (line_num, line) in contents.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        match serde_json::from_str::<Bead>(line) {
            Ok(bead) => {
                // Track the maximum comment ID across all beads
                if let Some(comments) = &bead.comments {
                    for comment in comments {
                        if comment.id > max_comment_id {
                            max_comment_id = comment.id;
                        }
                    }
                }

                if bead.id == payload.bead_id {
                    found_bead_index = Some(beads.len());
                }
                beads.push(bead);
            }
            Err(e) => {
                tracing::warn!(
                    "Failed to parse bead at line {}: {} - {}",
                    line_num + 1,
                    e,
                    line
                );
                // Continue parsing other lines - graceful handling of malformed lines
            }
        }
    }

    // Check if the bead was found
    let bead_index = match found_bead_index {
        Some(idx) => idx,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(AddCommentResponse {
                    success: false,
                    bead: None,
                    error: Some(format!("Bead with id '{}' not found", payload.bead_id)),
                }),
            );
        }
    };

    // Create the new comment
    let new_comment = Comment {
        id: max_comment_id + 1,
        issue_id: payload.bead_id.clone(),
        author: payload.author,
        text: payload.text,
        created_at: Utc::now().to_rfc3339(),
    };

    // Add the comment to the bead
    let bead = &mut beads[bead_index];
    match &mut bead.comments {
        Some(comments) => comments.push(new_comment),
        None => bead.comments = Some(vec![new_comment]),
    }

    // Write the updated beads back to the file
    let file = match std::fs::File::create(&issues_path) {
        Ok(f) => f,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(AddCommentResponse {
                    success: false,
                    bead: None,
                    error: Some(format!("Failed to open file for writing: {}", e)),
                }),
            );
        }
    };

    let mut writer = std::io::BufWriter::new(file);
    for bead in &beads {
        match serde_json::to_string(bead) {
            Ok(json_line) => {
                if let Err(e) = writeln!(writer, "{}", json_line) {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(AddCommentResponse {
                            success: false,
                            bead: None,
                            error: Some(format!("Failed to write to file: {}", e)),
                        }),
                    );
                }
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(AddCommentResponse {
                        success: false,
                        bead: None,
                        error: Some(format!("Failed to serialize bead: {}", e)),
                    }),
                );
            }
        }
    }

    if let Err(e) = writer.flush() {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(AddCommentResponse {
                success: false,
                bead: None,
                error: Some(format!("Failed to flush file: {}", e)),
            }),
        );
    }

    // Return the updated bead
    let updated_bead = beads.swap_remove(bead_index);
    (
        StatusCode::OK,
        Json(AddCommentResponse {
            success: true,
            bead: Some(updated_bead),
            error: None,
        }),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_bead() {
        let json = r#"{"id":"test-123","title":"Test Bead","status":"open","priority":2}"#;
        let bead: Bead = serde_json::from_str(json).unwrap();
        assert_eq!(bead.id, "test-123");
        assert_eq!(bead.title, "Test Bead");
        assert_eq!(bead.status, "open");
        assert_eq!(bead.priority, Some(2));
    }

    #[test]
    fn test_parse_bead_with_comments() {
        let json = r#"{"id":"test-456","title":"With Comments","status":"closed","comments":[{"id":1,"issue_id":"test-456","author":"user","text":"A comment","created_at":"2026-01-01T00:00:00Z"}]}"#;
        let bead: Bead = serde_json::from_str(json).unwrap();
        assert_eq!(bead.comments.as_ref().unwrap().len(), 1);
        assert_eq!(bead.comments.as_ref().unwrap()[0].text, "A comment");
    }

    #[test]
    fn test_parse_bead_with_design_field() {
        // Test that alias "design" works
        let json = r#"{"id":"test-789","title":"With Design","status":"open","design":"path/to/design.md"}"#;
        let bead: Bead = serde_json::from_str(json).unwrap();
        assert_eq!(bead.design_doc, Some("path/to/design.md".to_string()));
    }

    #[test]
    fn test_parse_bead_with_design_doc_field() {
        // Test that original "design_doc" still works
        let json = r#"{"id":"test-790","title":"With Design Doc","status":"open","design_doc":"path/to/design2.md"}"#;
        let bead: Bead = serde_json::from_str(json).unwrap();
        assert_eq!(bead.design_doc, Some("path/to/design2.md".to_string()));
    }
}
