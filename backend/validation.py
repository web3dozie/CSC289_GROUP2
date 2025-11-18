"""
Input validation utilities for task management
"""
from datetime import datetime
from typing import Optional, Dict, Any
from backend.errors import ValidationError


class TaskValidator:
    """Validates task data before database operations"""
    
    @staticmethod
    def validate_title(title: str) -> str:
        """Validate and clean task title"""
        if not title or not title.strip():
            raise ValidationError("Task title cannot be empty")
        
        cleaned = title.strip()
        
        if len(cleaned) > 200:
            raise ValidationError("Task title cannot exceed 200 characters")
        
        return cleaned
    
    @staticmethod
    def validate_description(description: Optional[str]) -> str:
        """Validate and clean task description"""
        if description is None:
            return ""
        
        cleaned = description.strip()
        
        if len(cleaned) > 2000:
            raise ValidationError("Task description cannot exceed 2000 characters")
        
        return cleaned
    
    @staticmethod
    def validate_due_date(due_date_str: Optional[str]) -> Optional[datetime]:
        """Validate due date format and value"""
        if not due_date_str:
            return None
        
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        except ValueError:
            raise ValidationError("Due date must be in YYYY-MM-DD format")
        
        # Don't allow dates too far in the past (more than 1 year ago)
        one_year_ago = datetime.now().replace(year=datetime.now().year - 1)
        if due_date < one_year_ago:
            raise ValidationError("Due date cannot be more than 1 year in the past")
        
        return due_date
    
    @staticmethod
    def validate_estimate_minutes(estimate: Optional[int]) -> Optional[int]:
        """Validate time estimate"""
        if estimate is None:
            return None
        
        try:
            estimate_int = int(estimate)
        except (ValueError, TypeError):
            raise ValidationError("Estimate must be a number")
        
        if estimate_int < 0:
            raise ValidationError("Estimate cannot be negative")
        
        if estimate_int > 10080:  # 7 days in minutes
            raise ValidationError("Estimate cannot exceed 7 days (10080 minutes)")
        
        return estimate_int
    
    @staticmethod
    def validate_task_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate all task fields and return cleaned data"""
        validated = {}
        
        # Required field
        validated['title'] = TaskValidator.validate_title(data.get('title', ''))
        
        # Optional fields
        validated['description'] = TaskValidator.validate_description(data.get('description'))
        validated['due_date'] = TaskValidator.validate_due_date(data.get('due_date'))
        validated['estimate_minutes'] = TaskValidator.validate_estimate_minutes(data.get('estimate_minutes'))
        
        # Priority (boolean)
        validated['priority'] = bool(data.get('priority', False))
        
        # IDs will be validated against database
        if 'status_id' in data:
            try:
                validated['status_id'] = int(data['status_id'])
            except (ValueError, TypeError):
                raise ValidationError("Status ID must be a valid number")
        
        if 'category' in data:
            validated['category'] = data['category']
        
        return validated


class CategoryValidator:
    """Validates category data before database operations"""
    
    @staticmethod
    def validate_name(name: str) -> str:
        """Validate and clean category name"""
        if not name or not name.strip():
            raise ValidationError("Category name cannot be empty")
        
        cleaned = name.strip()
        
        if len(cleaned) > 140:
            raise ValidationError("Category name cannot exceed 140 characters")
        
        return cleaned
    
    @staticmethod
    def validate_description(description: Optional[str]) -> Optional[str]:
        """Validate and clean category description"""
        if description is None or not description.strip():
            return None
        
        cleaned = description.strip()
        
        if len(cleaned) > 140:
            raise ValidationError("Category description cannot exceed 140 characters")
        
        return cleaned
    
    @staticmethod
    def validate_color_hex(color_hex: str) -> str:
        """Validate and clean hex color code"""
        if not color_hex:
            raise ValidationError("Category color is required")
        
        # Remove # if present
        cleaned = color_hex.strip().lstrip('#').upper()
        
        # Must be 6 characters (RRGGBB) or 3 characters (RGB - will expand)
        if len(cleaned) == 3:
            # Expand RGB to RRGGBB
            cleaned = ''.join([c*2 for c in cleaned])
        elif len(cleaned) != 6:
            raise ValidationError("Color must be a valid hex code (e.g., FF5733 or #FF5733)")
        
        # Validate hex characters
        if not all(c in '0123456789ABCDEF' for c in cleaned):
            raise ValidationError("Color must contain only hex characters (0-9, A-F)")
        
        return cleaned
    
    @staticmethod
    def validate_create(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate category creation data"""
        validated = {}
        
        # Required fields
        validated['name'] = CategoryValidator.validate_name(data.get('name', ''))
        validated['color_hex'] = CategoryValidator.validate_color_hex(data.get('color_hex', ''))
        
        # Optional fields
        validated['description'] = CategoryValidator.validate_description(data.get('description'))
        
        return validated
    
    @staticmethod
    def validate_update(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate category update data (all fields optional)"""
        validated = {}
        
        if 'name' in data:
            validated['name'] = CategoryValidator.validate_name(data['name'])
        
        if 'color_hex' in data:
            validated['color_hex'] = CategoryValidator.validate_color_hex(data['color_hex'])
        
        if 'description' in data:
            validated['description'] = CategoryValidator.validate_description(data['description'])
        
        if not validated:
            raise ValidationError("No valid fields provided for update")
        
        return validated


def create_validation_error_response(error: Exception) -> dict:
    """Convert validation errors to user-friendly messages"""
    error_message = str(error)
    
    # Map common validation errors to friendly messages
    friendly_messages = {
        "title cannot be empty": "Please enter a task title",
        "title cannot exceed": "Task title is too long (max 200 characters)",
        "description cannot exceed": "Task description is too long (max 2000 characters)",
        "Due date must be in": "Please use date format: YYYY-MM-DD (e.g., 2025-12-31)",
        "Due date cannot be more than": "Due date is too far in the past",
        "Estimate must be a number": "Time estimate must be a number of minutes",
        "Estimate cannot be negative": "Time estimate cannot be negative",
        "Estimate cannot exceed": "Time estimate is too large (max 7 days)",
        "Status ID must be": "Invalid status selected",
        "Category name cannot": "Category name issue",
        "Category color": "Category color issue",
        "Color must": "Invalid color format"
    }
    
    for key, friendly_msg in friendly_messages.items():
        if key.lower() in error_message.lower():
            return {
                'error': friendly_msg,
                'field': error_message.split()[0].lower() if ' ' in error_message else 'unknown'
            }
    
    return {'error': error_message}
