import json
from pathlib import Path

CONFIG_FILE_PATH = Path(__file__).parent / 'config_file.json'
with open(CONFIG_FILE_PATH, 'r') as f:
    config = json.load(f)
