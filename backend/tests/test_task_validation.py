"""
Tests for the new task validation features added in the PR
"""
import pytest
from backend.validation import TaskValidator, create_validation_error_response


class TestTaskValidator:
    """Test TaskValidator class methods"""
    
    def test_validate_title_success(self):
        """Test valid title validation"""
        result = TaskValidator.validate_title("  Valid Title  ")
        assert result == "Valid Title"
    
    def test_validate_title_empty(self):
        """Test empty title raises error"""
        with pytest.raises(ValueError, match="title cannot be empty"):
            TaskValidator.validate_title("")
        
        with pytest.raises(ValueError, match="title cannot be empty"):
            TaskValidator.validate_title("   ")
    
    def test_validate_title_too_long(self):
        """Test title exceeding 200 characters raises error"""
        long_title = "x" * 201
        with pytest.raises(ValueError, match="cannot exceed 200 characters"):
            TaskValidator.validate_title(long_title)
    
    def test_validate_description_success(self):
        """Test valid description validation"""
        result = TaskValidator.validate_description("  Valid Description  ")
        assert result == "Valid Description"
        
        result = TaskValidator.validate_description(None)
        assert result == ""
    
    def test_validate_description_too_long(self):
        """Test description exceeding 2000 characters raises error"""
        long_desc = "x" * 2001
        with pytest.raises(ValueError, match="cannot exceed 2000 characters"):
            TaskValidator.validate_description(long_desc)
    
    def test_validate_due_date_success(self):
        """Test valid due date validation"""
        result = TaskValidator.validate_due_date("2025-12-31")
        assert result is not None
        assert result.year == 2025
        assert result.month == 12
        assert result.day == 31
        
        result = TaskValidator.validate_due_date(None)
        assert result is None
    
    def test_validate_due_date_invalid_format(self):
        """Test invalid date format raises error"""
        with pytest.raises(ValueError, match="YYYY-MM-DD format"):
            TaskValidator.validate_due_date("31-12-2025")
        
        with pytest.raises(ValueError, match="YYYY-MM-DD format"):
            TaskValidator.validate_due_date("2025/12/31")
    
    def test_validate_due_date_too_old(self):
        """Test date more than 1 year in the past raises error"""
        with pytest.raises(ValueError, match="more than 1 year in the past"):
            TaskValidator.validate_due_date("2020-01-01")
    
    def test_validate_estimate_minutes_success(self):
        """Test valid estimate validation"""
        result = TaskValidator.validate_estimate_minutes(60)
        assert result == 60
        
        result = TaskValidator.validate_estimate_minutes(None)
        assert result is None
        
        result = TaskValidator.validate_estimate_minutes(0)
        assert result == 0
    
    def test_validate_estimate_minutes_negative(self):
        """Test negative estimate raises error"""
        with pytest.raises(ValueError, match="cannot be negative"):
            TaskValidator.validate_estimate_minutes(-1)
    
    def test_validate_estimate_minutes_too_large(self):
        """Test estimate exceeding 7 days raises error"""
        with pytest.raises(ValueError, match="cannot exceed 7 days"):
            TaskValidator.validate_estimate_minutes(10081)
    
    def test_validate_estimate_minutes_invalid_type(self):
        """Test non-numeric estimate raises error"""
        with pytest.raises(ValueError, match="must be a number"):
            TaskValidator.validate_estimate_minutes("abc")
    
    def test_validate_task_data_success(self):
        """Test complete task data validation"""
        data = {
            'title': 'Test Task',
            'description': 'Test Description',
            'due_date': '2025-12-31',
            'estimate_minutes': 120,
            'priority': True,
            'status_id': 1,
            'category': 'Work'
        }
        
        result = TaskValidator.validate_task_data(data)
        
        assert result['title'] == 'Test Task'
        assert result['description'] == 'Test Description'
        assert result['due_date'] is not None
        assert result['estimate_minutes'] == 120
        assert result['priority'] is True
        assert result['status_id'] == 1
        assert result['category'] == 'Work'
    
    def test_validate_task_data_minimal(self):
        """Test task data validation with only required fields"""
        data = {'title': 'Minimal Task'}
        
        result = TaskValidator.validate_task_data(data)
        
        assert result['title'] == 'Minimal Task'
        assert result['description'] == ''
        assert result['due_date'] is None
        assert result['estimate_minutes'] is None
        assert result['priority'] is False


class TestValidationErrorResponse:
    """Test validation error message formatting"""
    
    def test_empty_title_error(self):
        """Test empty title error message"""
        error = ValueError("Task title cannot be empty")
        result = create_validation_error_response(error)
        
        assert 'Please enter a task title' in result['error']
    
    def test_title_length_error(self):
        """Test title length error message"""
        error = ValueError("Task title cannot exceed 200 characters")
        result = create_validation_error_response(error)
        
        assert 'too long' in result['error']
        assert '200' in result['error']
    
    def test_date_format_error(self):
        """Test date format error message"""
        error = ValueError("Due date must be in YYYY-MM-DD format")
        result = create_validation_error_response(error)
        
        assert 'YYYY-MM-DD' in result['error']
    
    def test_estimate_negative_error(self):
        """Test negative estimate error message"""
        error = ValueError("Estimate cannot be negative")
        result = create_validation_error_response(error)
        
        assert 'cannot be negative' in result['error']
