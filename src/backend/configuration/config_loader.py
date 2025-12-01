"""
Configuration loader for TuneTools backend
"""
import json
import sys
from pathlib import Path


def read_data_from_json(file_path: str, exit_on_error: bool = True):
    """Read and parse JSON configuration file"""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            config_data = json.load(file)
        return config_data
    except FileNotFoundError:
        from utils.custom_logger import log_handler
        log_handler.error(f"ERROR: Config file not found: {file_path}")
        if exit_on_error:
            sys.exit(1)
        return None
    except json.JSONDecodeError:
        from utils.custom_logger import log_handler
        log_handler.error(f"ERROR: Failed to parse JSON config file: {file_path}")
        if exit_on_error:
            sys.exit(1)
        return None


# Path to config JSON file
CONFIG_FILE_PATH = Path(__file__).parent / "config_file.json"

# Load configuration
config = read_data_from_json(str(CONFIG_FILE_PATH), exit_on_error=True)

if __name__ == "__main__":
    from utils.custom_logger import log_handler
    log_handler.info(f"Config loaded: {config is not None}")
    log_handler.info(f"Config keys: {list(config.keys()) if config else 'None'}")
