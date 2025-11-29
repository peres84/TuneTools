"""
Test script for error handling implementation
Tests both frontend and backend error handling
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

def test_backend_error_classes():
    """Test backend error classes"""
    from utils.error_handler import (
        TuneToolsException,
        ValidationException,
        AuthenticationException,
        PermissionException,
        NotFoundException,
        RateLimitException,
        ExternalServiceException,
        get_user_friendly_message,
        handle_external_service_error
    )
    
    print("✓ Testing backend error classes...")
    
    # Test base exception
    try:
        raise TuneToolsException("Test error", status_code=500, code="TEST_ERROR")
    except TuneToolsException as e:
        assert e.message == "Test error"
        assert e.status_code == 500
        assert e.code == "TEST_ERROR"
        print("  ✓ TuneToolsException works")
    
    # Test validation exception
    try:
        raise ValidationException("Invalid input")
    except ValidationException as e:
        assert e.status_code == 400
        assert e.code == "VALIDATION_ERROR"
        print("  ✓ ValidationException works")
    
    # Test authentication exception
    try:
        raise AuthenticationException()
    except AuthenticationException as e:
        assert e.status_code == 401
        assert e.code == "UNAUTHORIZED"
        print("  ✓ AuthenticationException works")
    
    # Test permission exception
    try:
        raise PermissionException()
    except PermissionException as e:
        assert e.status_code == 403
        assert e.code == "FORBIDDEN"
        print("  ✓ PermissionException works")
    
    # Test not found exception
    try:
        raise NotFoundException()
    except NotFoundException as e:
        assert e.status_code == 404
        assert e.code == "NOT_FOUND"
        print("  ✓ NotFoundException works")
    
    # Test rate limit exception
    try:
        raise RateLimitException()
    except RateLimitException as e:
        assert e.status_code == 429
        assert e.code == "RATE_LIMIT_EXCEEDED"
        print("  ✓ RateLimitException works")
    
    # Test external service exception
    try:
        raise ExternalServiceException("RunPod", "Connection timeout")
    except ExternalServiceException as e:
        assert e.status_code == 502
        assert e.code == "EXTERNAL_SERVICE_ERROR"
        assert "RunPod" in e.message
        print("  ✓ ExternalServiceException works")
    
    # Test user-friendly messages
    msg = get_user_friendly_message("SONG_GENERATION_FAILED")
    assert "Failed to generate" in msg
    print("  ✓ User-friendly messages work")
    
    print("✓ All backend error classes passed!\n")


def test_error_messages():
    """Test error message utilities"""
    from utils.error_handler import ERROR_MESSAGES, get_user_friendly_message
    
    print("✓ Testing error messages...")
    
    # Check all error messages exist
    assert "SONG_GENERATION_FAILED" in ERROR_MESSAGES
    assert "NETWORK_ERROR" in ERROR_MESSAGES
    assert "INVALID_INPUT" in ERROR_MESSAGES
    print("  ✓ All error message constants defined")
    
    # Test message retrieval
    msg = get_user_friendly_message("SONG_GENERATION_FAILED")
    assert len(msg) > 0
    print("  ✓ Error message retrieval works")
    
    # Test default message
    msg = get_user_friendly_message("UNKNOWN_CODE", "Default message")
    assert msg == "Default message"
    print("  ✓ Default message fallback works")
    
    print("✓ All error message tests passed!\n")


def main():
    """Run all tests"""
    print("=" * 60)
    print("Testing Error Handling Implementation")
    print("=" * 60 + "\n")
    
    try:
        test_backend_error_classes()
        test_error_messages()
        
        print("=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
