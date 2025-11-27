"""
#############################################################################
### Custom logger file
###
### @file custom_logger.py
### @author Sebastian Russo
### @date 2025
#############################################################################

This module initializes a custom logger to handle log messages for the other modules.
"""

#Native imports
import os
import logging
import sys
import datetime

#Other files imports
from configuration.config_loader import config

#Map config string levels to logging module levels
LOG_LEVELS = {
    "critical": logging.CRITICAL,
    "error": logging.ERROR,
    "warning": logging.WARNING,
    "info": logging.INFO,
    "debug": logging.DEBUG,
    "notset": logging.NOTSET
}

#Get log level string from config and convert to logging level, default to INFO if not found
log_level_str = config["logging"].get("logging_level", "info").lower()
log_level = LOG_LEVELS.get(log_level_str, logging.INFO)

"""Log basic configuration"""
log_handler = logging.getLogger(config["logging"]["log_file_name"])
log_handler.setLevel(log_level)

"""Logger formatter"""
log_format = logging.Formatter(
    fmt="%(asctime)s %(msecs)03dZ | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

"""File handler (File accessible only when it runs locally)"""
#Create folder
log_directory = config["logging"]["dir_name"]
os.makedirs(log_directory, exist_ok=True)

#Create log file
log_file = os.path.join(
    log_directory, 
    datetime.datetime.now().strftime(
        f"{config['logging']['log_file_name']}_%Y-%m-%dT%H-%M-%S.log"
    )
)
file_handler = logging.FileHandler(log_file)
file_handler.setFormatter(log_format)

"""Console handler for deployment logs"""
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(log_format)

#Final log handler
if not log_handler.hasHandlers():
    log_handler.addHandler(file_handler)
    log_handler.addHandler(console_handler)

log_handler.info(f"TuneTools backend server starting")
log_handler.warning(f"Current working directory: {os.getcwd()}, Logs are written to '{log_file}'")

#Configure uvicorn and access loggers to use our handlers
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.handlers = []
uvicorn_logger.addHandler(file_handler)
uvicorn_logger.addHandler(console_handler)
uvicorn_logger.setLevel(log_level)

uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.handlers = []
uvicorn_access_logger.addHandler(file_handler)
uvicorn_access_logger.addHandler(console_handler)
uvicorn_access_logger.setLevel(log_level)
