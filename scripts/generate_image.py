"""Generate cover artwork for a generated song using Gemini (example script).

This is a template. Fill `GEMINI_API_KEY` in your environment before running.

Usage:
  setx GEMINI_API_KEY "your_api_key"
  .\.venv\Scripts\Activate.ps1
  python scripts\generate_image.py --title "Morning Anthem" --genre "uplifting female indie-pop" --lyrics_file sample_lyrics.txt

The script builds a descriptive prompt from the song metadata and calls the Gemini images API.
Replace the `generate_image_from_gemini` implementation with your preferred Gemini client.
"""
import os
import argparse
import base64
from typing import Optional


def build_prompt(title: str, genre: str, lyrics: Optional[str], mood: Optional[str] = None) -> str:
    """Create a robust image prompt from song metadata.

    Keep the prompt descriptive but focused: scene, color palette, style, focal object.
    """
    parts = []
    if title:
        parts.append(f"Title: {title}")
    if genre:
        parts.append(f"Genre tags: {genre}")
    if mood:
        parts.append(f"Mood: {mood}")
    if lyrics:
        # Use a short excerpt to inspire imagery
        excerpt = lyrics.strip().splitlines()[:4]
        parts.append("Lyrics excerpt: " + " | ".join(excerpt))

    # Art direction: example instructions
    art_directives = (
        "Create a high-resolution album cover, 1:1 aspect ratio, vibrant colors, cinematic lighting, "
        "illustrative + photo-real hybrid, slight film grain, typographic space for the title."
    )

    prompt = "; ".join(parts) + ". " + art_directives
    return prompt


def generate_image_from_gemini(prompt: str, output_path: str = "cover.png", size: str = "1024x1024") -> dict:
    """Placeholder Gemini call.

    Replace this implementation with the SDK or HTTP request you use for Gemini (Google Generative API).
    Example libraries: `google.generativeai` or direct REST calls to the Gemini image endpoint.

    Expected return: dict with keys `filename` and `bytes` or write file directly.
    """
    # Example pseudo-implementation using a generic response shape
    # ----
    # import google.generativeai as genai
    # genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    # resp = genai.images.generate(model="gemini-photo-1", prompt=prompt, size=size)
    # image_b64 = resp.data[0].b64_json
    # with open(output_path, "wb") as f:
    #     f.write(base64.b64decode(image_b64))
    # return {"filename": output_path}
    # ----

    # For now, raise a helpful error so users replace this with their own call.
    raise NotImplementedError(
        "Please implement `generate_image_from_gemini` using your Gemini client.\n"
        "See README for example usage and environment variables (GEMINI_API_KEY)."
    )


def main():
    parser = argparse.ArgumentParser(description="Generate artwork for a song using Gemini")
    parser.add_argument("--title", type=str, default="", help="Song title")
    parser.add_argument("--genre", type=str, default="", help="Genre tags (5-component)")
    parser.add_argument("--lyrics_file", type=str, default=None, help="Path to lyrics text file")
    parser.add_argument("--mood", type=str, default=None, help="Optional mood override")
    parser.add_argument("--out", type=str, default="cover.png", help="Output filename")
    args = parser.parse_args()

    lyrics = None
    if args.lyrics_file and os.path.exists(args.lyrics_file):
        with open(args.lyrics_file, "r", encoding="utf-8") as f:
            lyrics = f.read()

    prompt = build_prompt(args.title, args.genre, lyrics, args.mood)
    print("Prompt for Gemini:\n", prompt)

    # Check API key presence
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not set. Set the environment variable before running.")

    try:
        result = generate_image_from_gemini(prompt, output_path=args.out)
        print(f"Saved image to: {result.get('filename', args.out)}")
    except NotImplementedError as e:
        print(str(e))


if __name__ == "__main__":
    main()
