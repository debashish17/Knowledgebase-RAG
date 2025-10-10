import logging
import sys
from typing import Optional


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Configure logging for the application."""
    
    # Convert string level to logging constant
    level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)
    
    return root_logger


# Create a logger for this module
logger = logging.getLogger(__name__)