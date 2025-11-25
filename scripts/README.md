# TuneTools Scripts

Utility scripts for TuneTools project.

## Available Scripts

### create_vinyl_disk.py

Transforms album artwork into vinyl disk images with proper hole ratio (14%).

**Usage:**
```bash
python create_vinyl_disk.py --input album_cover.png --output vinyl_disk.png
```

**Features:**
- Circular crop with center hole
- 14% hole-to-disk ratio
- Maintains image quality
- Supports PNG, JPEG, WebP formats
