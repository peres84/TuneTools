"""
TuneTools Backend Runner
Simple script to start the backend server with configuration
"""
import uvicorn
import logging
from configuration.config_loader import config

if __name__ == "__main__":
    # Get network configuration
    network_config = config["network"]
    
    # Configure uvicorn logging to use our log file
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["default"]["fmt"] = "%(asctime)s %(msecs)03dZ | %(levelname)s | %(message)s"
    log_config["formatters"]["default"]["datefmt"] = "%Y-%m-%d %H:%M:%S"
    log_config["formatters"]["access"]["fmt"] = "%(asctime)s %(msecs)03dZ | %(levelname)s | %(client_addr)s - %(request_line)s %(status_code)s"
    log_config["formatters"]["access"]["datefmt"] = "%Y-%m-%d %H:%M:%S"
    
    uvicorn.run(
        network_config["uvicorn_app_reference"],
        host=network_config["host"],
        port=network_config["server_port"],
        reload=network_config["reload"],
        workers=network_config["workers"],
        proxy_headers=network_config["proxy_headers"],
        log_config=log_config
    )
