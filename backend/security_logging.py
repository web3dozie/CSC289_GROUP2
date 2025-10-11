"""
Security logging - tracks who does what and when
"""
import logging
import json
from datetime import datetime
from pythonjsonlogger import jsonlogger


class SecurityLogger:
    """Logs security events in a structured format that's easy to search and analyze"""
    
    def __init__(self):
        self.logger = logging.getLogger('security')
        self.logger.setLevel(logging.INFO)
        
        # Set up logging to print in JSON format (easier for security tools to read)
        handler = logging.StreamHandler()
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(event_type)s %(user_id)s %(ip_address)s %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
    
    def log_login_attempt(self, username, ip_address, success, user_id=None):
        """Track when someone tries to log in (successful or failed)"""
        self.logger.info(
            "Login attempt",
            extra={
                'timestamp': datetime.now().isoformat(),
                'event_type': 'login_attempt',
                'username': username,
                'user_id': user_id,
                'ip_address': ip_address,
                'success': success
            }
        )
    
    def log_logout(self, user_id, ip_address, session_id):
        """Track when someone logs out"""
        self.logger.info(
            "User logout",
            extra={
                'timestamp': datetime.now().isoformat(),
                'event_type': 'logout',
                'user_id': user_id,
                'ip_address': ip_address,
                'session_id': session_id
            }
        )
    
    def log_session_expired(self, user_id, session_id):
        """Track when a session times out"""
        self.logger.info(
            "Session expired",
            extra={
                'timestamp': datetime.now().isoformat(),
                'event_type': 'session_expired',
                'user_id': user_id,
                'session_id': session_id
            }
        )
    
    def log_suspicious_activity(self, event_type, user_id, ip_address, details):
        """Track anything that looks suspicious or unusual"""
        self.logger.warning(
            f"Suspicious activity: {event_type}",
            extra={
                'timestamp': datetime.now().isoformat(),
                'event_type': 'suspicious_activity',
                'activity_type': event_type,
                'user_id': user_id,
                'ip_address': ip_address,
                'details': details
            }
        )
    
    def log_sensitive_operation(self, operation, user_id, ip_address, details):
        """Track important actions like password changes or data exports"""
        self.logger.info(
            f"Sensitive operation: {operation}",
            extra={
                'timestamp': datetime.now().isoformat(),
                'event_type': 'sensitive_operation',
                'operation': operation,
                'user_id': user_id,
                'ip_address': ip_address,
                'details': details
            }
        )


# Create one shared logger that everyone can use
security_logger = SecurityLogger()
