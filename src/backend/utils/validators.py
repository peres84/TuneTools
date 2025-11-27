"""
#############################################################################
### Validator methods file
###
### @file validators.py
### @Sebastian Russo
### @date: 2025
#############################################################################

This module defines several methods to validate several things, like valid emails,
valid passwords, UUIDs, pagination params, etc.
"""
#Native imports
import re
from typing import List
from datetime import datetime

#Third-party imports
from fastapi import HTTPException
from pydantic import BaseModel

#Other files imports
from utils.custom_logger import log_handler


def validate_email_format(email: str) -> bool:
    """
        Validate an email address.
        
        Basic email validation with standard format checks.

        Checks if:
        - There is exactly one '@' symbol.
        - The local part is non-empty and contains only allowed characters.
        - The domain part has at least one '.' and valid format.

        Args:
            email (str): The email string to validate.

        Returns:
            Nothing, it allows execution and not raise an exception
    """
    
    message = ""
    
    #Check exactly one '@' in the email
    if email.count('@') != 1:
        message = f"Invalid email '{email}': must contain exactly one '@'"
        log_handler.warning(message)
        raise HTTPException(status_code=400, detail=message)
    local_part, domain_part = email.rsplit('@', 1)

    #Check local part is not empty and contains only allowed characters
    if not local_part or not re.match(r'^[\w\.-]+$', local_part):
        message = f"Invalid email '{email}': local part is invalid"
        log_handler.warning(message)
        raise HTTPException(status_code=400, detail=message)
    
    #Domain must contain at least one '.'
    if '.' not in domain_part:
        message = f"Invalid email '{email}': domain part must contain at least one '.'"
        log_handler.warning(message)
        raise HTTPException(status_code=400, detail=message)

    log_handler.debug(f"Email '{email}' is valid, proceeding")


def validate_password_format(password: str):
    """
        Validate a password.

        Checks if:
        - At least 8 characters long
        - Contains at least one lowercase letter
        - Contains at least one uppercase letter
        - Contains at least one digit
        - Contains at least one special symbol (non-alphanumeric)

        Args:
            password (str): The password string to validate.

        Returns:
            bool: Nothing, the method does not raise exceptions and allows
            to continue execution
    """

    message = ""

    if len(password) < 8:
        message = "Password length is too short."
        log_handler.warning(message) 
        raise HTTPException(status_code=400, detail=message)

    if not re.search(r"[a-z]", password):
        message = "Password validation failed: no lowercase letter found"
        log_handler.warning(message) 
        raise HTTPException(status_code=400, detail=message)

    if not re.search(r"[A-Z]", password):
        message = "Password validation failed: no uppercase letter found"
        log_handler.warning(message)
        raise HTTPException(status_code=400, detail=message)

    if not re.search(r"\d", password):
        message = "Password validation failed: no digit found"
        log_handler.warning(message)
        raise HTTPException(status_code=400, detail=message)

    if not re.search(r"[^\w\s]", password):
        message = "Password validation failed: no special symbol found"
        log_handler.warning(message)
        raise HTTPException(status_code=400, detail=message)

    log_handler.info("Password is valid") 


def validate_access_token_format(token: str):
    """
        Validate JWT access token format.
        
        Args:
            token (str): The JWT token to validate.
            
        Raises:
            HTTPException: If token format is invalid.
    """
    jwt_regex = r'^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'
    if not re.fullmatch(jwt_regex, token):
        log_handler.warning("Invalid JWT token format")
        raise HTTPException(status_code=400, detail="Access token format is invalid.")
    log_handler.debug("Access token format valid")

    
def validate_refresh_token_format(token: str):
    """
        Validate refresh token format.
        
        Args:
            token (str): The refresh token to validate.
            
        Raises:
            HTTPException: If token format is invalid.
    """
    if not token.isalnum() or len(token) < 10:
        log_handler.warning(f"Invalid refresh token format: {len(token)} chars")
        raise HTTPException(status_code=400, detail="Refresh token format is invalid.")
    log_handler.debug("Refresh token format valid")


def validate_uuid_format(uuid_str: str):
    """
        Validate UUID format (RFC 4122 standard).
        
        Args:
            uuid_str (str): The UUID string to validate.
            
        Raises:
            HTTPException: If UUID format is invalid.
    """
    uuid_regex = r'^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
    if not re.fullmatch(uuid_regex, uuid_str.lower()):
        log_handler.warning(f"Invalid UUID format: {uuid_str}")
        raise HTTPException(status_code=400, detail="User ID format is invalid.")
    log_handler.debug(f"UUID '{uuid_str}' is valid")


def validate_share_token_format(token: str):
    """
        Validate share token format.
        
        Share tokens should be alphanumeric and at least 10 characters.
        
        Args:
            token (str): The share token to validate.
            
        Raises:
            HTTPException: If token format is invalid.
    """
    if not token or len(token) < 10:
        log_handler.warning(f"Share token too short: {len(token) if token else 0} chars")
        raise HTTPException(status_code=400, detail="Share token format is invalid.")
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', token):
        log_handler.warning(f"Share token contains invalid characters")
        raise HTTPException(status_code=400, detail="Share token contains invalid characters.")
    
    log_handler.debug(f"Share token is valid")


def validate_pagination_params(limit: int, offset: int):
    """
        Validate pagination parameters.
        
        Args:
            limit (int): Maximum number of items to return.
            offset (int): Number of items to skip.
            
        Raises:
            HTTPException: If parameters are invalid.
    """
    if limit < 1:
        log_handler.warning(f"Invalid limit: {limit}")
        raise HTTPException(status_code=400, detail="Limit must be at least 1.")
    
    if limit > 100:
        log_handler.warning(f"Limit too high: {limit}")
        raise HTTPException(status_code=400, detail="Limit cannot exceed 100.")
    
    if offset < 0:
        log_handler.warning(f"Invalid offset: {offset}")
        raise HTTPException(status_code=400, detail="Offset cannot be negative.")
    
    log_handler.debug(f"Pagination params valid: limit={limit}, offset={offset}")


def validate_location_string(location: str):
    """
        Validate location string for weather queries.
        
        Args:
            location (str): City name or coordinates.
            
        Raises:
            HTTPException: If location format is invalid.
    """
    if not location or len(location.strip()) < 2:
        log_handler.warning(f"Location string too short")
        raise HTTPException(status_code=400, detail="Location must be at least 2 characters.")
    
    if len(location) > 100:
        log_handler.warning(f"Location string too long: {len(location)} chars")
        raise HTTPException(status_code=400, detail="Location cannot exceed 100 characters.")
    
    # Check for SQL injection patterns
    dangerous_patterns = [';', '--', '/*', '*/', 'DROP', 'DELETE', 'INSERT', 'UPDATE']
    location_upper = location.upper()
    for pattern in dangerous_patterns:
        if pattern in location_upper:
            log_handler.warning(f"Location contains dangerous pattern: {pattern}")
            raise HTTPException(status_code=400, detail="Location contains invalid characters.")
    
    log_handler.debug(f"Location '{location}' is valid")


def validate_url_format(url: str):
    """
        Validate URL format.
        
        Args:
            url (str): The URL to validate.
            
        Raises:
            HTTPException: If URL format is invalid.
    """
    url_regex = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
    if not re.match(url_regex, url):
        log_handler.warning(f"Invalid URL format")
        raise HTTPException(status_code=400, detail="Invalid URL format.")
    
    log_handler.debug(f"URL is valid")


def validate_string_length(value: str, field_name: str, min_length: int = 1, max_length: int = 500):
    """
        Validate string length.
        
        Args:
            value (str): The string to validate.
            field_name (str): Name of the field for error messages.
            min_length (int): Minimum allowed length.
            max_length (int): Maximum allowed length.
            
        Raises:
            HTTPException: If string length is invalid.
    """
    if not value or len(value.strip()) < min_length:
        log_handler.warning(f"{field_name} too short: {len(value) if value else 0} chars")
        raise HTTPException(
            status_code=400, 
            detail=f"{field_name} must be at least {min_length} characters."
        )
    
    if len(value) > max_length:
        log_handler.warning(f"{field_name} too long: {len(value)} chars")
        raise HTTPException(
            status_code=400, 
            detail=f"{field_name} cannot exceed {max_length} characters."
        )
    
    log_handler.debug(f"{field_name} length valid: {len(value)} chars")


def validate_genre_tags(genre_tags: str):
    """
        Validate YuE genre tags format.
        
        Genre tags should have 5 components: genre, sub-genre, vocal, mood, tempo.
        
        Args:
            genre_tags (str): The genre tags string.
            
        Raises:
            HTTPException: If genre tags format is invalid.
    """
    if not genre_tags or len(genre_tags.strip()) < 5:
        log_handler.warning(f"Genre tags too short")
        raise HTTPException(status_code=400, detail="Genre tags are required.")
    
    components = genre_tags.strip().split()
    if len(components) < 3:
        log_handler.warning(f"Genre tags have only {len(components)} components")
        raise HTTPException(
            status_code=400, 
            detail="Genre tags must have at least 3 components (genre, sub-genre, vocal)."
        )
    
    log_handler.debug(f"Genre tags valid: {len(components)} components")


def validate_lyrics_structure(lyrics: str):
    """
        Validate lyrics structure for YuE.
        
        Lyrics must contain [verse] and [chorus] markers.
        
        Args:
            lyrics (str): The lyrics string.
            
        Raises:
            HTTPException: If lyrics structure is invalid.
    """
    if not lyrics or len(lyrics.strip()) < 10:
        log_handler.warning(f"Lyrics too short")
        raise HTTPException(status_code=400, detail="Lyrics are required.")
    
    lyrics_lower = lyrics.lower()
    if "[verse]" not in lyrics_lower:
        log_handler.warning(f"Lyrics missing [verse] marker")
        raise HTTPException(status_code=400, detail="Lyrics must contain [verse] section.")
    
    if "[chorus]" not in lyrics_lower:
        log_handler.warning(f"Lyrics missing [chorus] marker")
        raise HTTPException(status_code=400, detail="Lyrics must contain [chorus] section.")
    
    log_handler.debug(f"Lyrics structure valid")


##################################
#Special class validator
#Class with expected structure of each Message instance
class MessageItem(BaseModel):
    text: str
    is_user: bool
    time_stamp: datetime


def validate_current_chat(data: List[dict]) -> bool:
    """
        Validate chat message structure.
        
        Args:
            data (List[dict]): List of message dictionaries.
            
        Returns:
            bool: True if valid.
            
        Raises:
            HTTPException: If message structure is invalid.
    """
    for item in data:
        try:
            MessageItem(**item)
        except Exception as e:
            log_handler.warning(f"One of the instances in message list ({item}) is invalid: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid message item: {e}")
    return True
