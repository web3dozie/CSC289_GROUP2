"""
Standardized error handling for Task Line API

This module provides custom exception classes and utilities for consistent
error responses across all API endpoints.

Standard Error Format:
{
    "success": false,
    "error": {
        "code": 400,
        "message": "User-friendly error message",
        "details": {...}  # Optional additional context
    }
}

Standard Success Format:
{
    "success": true,
    "data": {...}
}
"""

from typing import Any, Optional, Dict
from quart import jsonify


class APIError(Exception):
    """Base exception class for all API errors"""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 500, 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to standardized error response format"""
        error_response = {
            "success": False,
            "error": {
                "code": self.status_code,
                "message": self.message
            }
        }
        
        if self.details:
            error_response["error"]["details"] = self.details
            
        return error_response


class ValidationError(APIError):
    """Raised when request validation fails (400 Bad Request)"""
    
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)


class AuthenticationError(APIError):
    """Raised when authentication fails (401 Unauthorized)"""
    
    def __init__(self, message: str = "Authentication required", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)


class AuthorizationError(APIError):
    """Raised when user lacks permission (403 Forbidden)"""
    
    def __init__(self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)


class NotFoundError(APIError):
    """Raised when resource is not found (404 Not Found)"""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)


class ConflictError(APIError):
    """Raised when there's a resource conflict (409 Conflict)"""
    
    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=409, details=details)


class DatabaseError(APIError):
    """Raised when database operations fail (500 Internal Server Error)"""
    
    def __init__(self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


class ServerError(APIError):
    """Raised for generic server errors (500 Internal Server Error)"""
    
    def __init__(self, message: str = "Internal server error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


def success_response(data: Any, status_code: int = 200):
    """
    Create a standardized success response
    
    Args:
        data: The response data
        status_code: HTTP status code (default: 200)
    
    Returns:
        Tuple of (jsonify response, status_code)
    """
    return jsonify({
        "success": True,
        "data": data
    }), status_code


def error_response(
    message: str, 
    status_code: int = 500, 
    details: Optional[Dict[str, Any]] = None
):
    """
    Create a standardized error response
    
    Args:
        message: User-friendly error message
        status_code: HTTP status code
        details: Optional additional error context
    
    Returns:
        Tuple of (jsonify response, status_code)
    """
    response = {
        "success": False,
        "error": {
            "code": status_code,
            "message": message
        }
    }
    
    if details:
        response["error"]["details"] = details
        
    return jsonify(response), status_code
