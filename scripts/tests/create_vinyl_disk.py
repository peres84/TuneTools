"""
Script to convert any image into a vinyl disk shape with a center hole.
Creates a circular mask with a center hole and applies it to the input image.
Standard vinyl record proportions: outer diameter with ~14% center hole.
"""

from PIL import Image, ImageDraw
import argparse
import os


def create_vinyl_mask(size, hole_ratio=0.14):
    """
    Create a circular mask with a center hole (like a vinyl record).

    Args:
        size: Tuple of (width, height) for the mask
        hole_ratio: Ratio of the hole diameter to the outer diameter (default: 0.14 for vinyl)

    Returns:
        PIL Image object with the mask (grayscale)
    """
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)

    # Calculate dimensions
    width, height = size
    min_dim = min(width, height)

    # Outer circle (full disk)
    outer_radius = min_dim // 2
    center_x, center_y = width // 2, height // 2

    # Draw outer circle (white)
    draw.ellipse(
        [center_x - outer_radius, center_y - outer_radius,
         center_x + outer_radius, center_y + outer_radius],
        fill=255
    )

    # Inner hole (black - transparent)
    inner_radius = int(outer_radius * hole_ratio)
    draw.ellipse(
        [center_x - inner_radius, center_y - inner_radius,
         center_x + inner_radius, center_y + inner_radius],
        fill=0
    )

    return mask


def image_to_vinyl_disk(input_path, output_path, disk_size=1000, hole_ratio=0.14, background_color=(0, 0, 0, 0)):
    """
    Convert an image to a vinyl disk shape with a center hole.

    Args:
        input_path: Path to input image
        output_path: Path to save output image
        disk_size: Size of the output disk in pixels (default: 1000)
        hole_ratio: Ratio of center hole to disk diameter (default: 0.14)
        background_color: RGBA tuple for background (default: transparent)

    Returns:
        PIL Image object of the vinyl disk
    """
    # Load and prepare input image
    img = Image.open(input_path)

    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Resize/crop to square
    width, height = img.size
    min_dim = min(width, height)

    # Crop to center square
    left = (width - min_dim) // 2
    top = (height - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    img_square = img.crop((left, top, right, bottom))

    # Resize to target disk size
    img_resized = img_square.resize((disk_size, disk_size), Image.Resampling.LANCZOS)

    # Create the vinyl mask
    mask = create_vinyl_mask((disk_size, disk_size), hole_ratio)

    # Create output image with transparent background
    output = Image.new('RGBA', (disk_size, disk_size), background_color)

    # Apply mask to create vinyl disk effect
    output.paste(img_resized, (0, 0), mask)

    # Save the result
    output.save(output_path, 'PNG')
    print(f"Vinyl disk created: {output_path}")
    print(f"Size: {disk_size}x{disk_size}px")
    print(f"Center hole ratio: {hole_ratio:.1%}")

    return output


def main():
    parser = argparse.ArgumentParser(
        description='Convert an image to a vinyl disk shape with a center hole'
    )
    parser.add_argument(
        'input',
        help='Input image path'
    )
    parser.add_argument(
        '-o', '--output',
        help='Output image path (default: input_vinyl.png)',
        default=None
    )
    parser.add_argument(
        '-s', '--size',
        type=int,
        default=1000,
        help='Output disk size in pixels (default: 1000)'
    )
    parser.add_argument(
        '-r', '--hole-ratio',
        type=float,
        default=0.14,
        help='Center hole ratio (0.0-0.5, default: 0.14 for vinyl record)'
    )
    parser.add_argument(
        '--bg-color',
        nargs=4,
        type=int,
        metavar=('R', 'G', 'B', 'A'),
        default=[0, 0, 0, 0],
        help='Background color as RGBA (default: transparent)'
    )

    args = parser.parse_args()

    # Generate output filename if not provided
    if args.output is None:
        name, ext = os.path.splitext(args.input)
        args.output = f"{name}_vinyl.png"

    # Validate hole ratio
    if not 0 < args.hole_ratio < 0.5:
        print("Warning: hole-ratio should be between 0 and 0.5. Using default 0.14")
        args.hole_ratio = 0.14

    # Create vinyl disk
    try:
        image_to_vinyl_disk(
            args.input,
            args.output,
            disk_size=args.size,
            hole_ratio=args.hole_ratio,
            background_color=tuple(args.bg_color)
        )
    except FileNotFoundError:
        print(f"Error: Input file '{args.input}' not found")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == '__main__':
    main()
