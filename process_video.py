import os
import time
import json
import argparse
from google import genai
from google.genai import types

def process_social_video(video_path: str):
    """
    Analyzes a social media video to extract location and vibe data using Gemini 1.5 Flash.
    Requires GEMINI_API_KEY environment variable.
    """
    if not os.path.exists(video_path):
        print(f"Error: File '{video_path}' not found.")
        return

    # Initialize the Gemini client (automatically picks up GEMINI_API_KEY from environment)
    print("Initialize Gemini client...")
    client = genai.Client()

    try:
        # 1. Video Upload
        print(f"Uploading video file: {video_path}")
        video_file = client.files.upload(file=video_path)
        print(f"Successfully uploaded as: {video_file.name}")

        # Wait for the file to be ACTIVE
        print("Waiting for video processing to complete on Gemini's servers...")
        while video_file.state.name == "PROCESSING":
            print(".", end="", flush=True)
            time.sleep(10)
            video_file = client.files.get(name=video_file.name)
        print()

        if video_file.state.name == "FAILED":
            print("Video processing failed on Gemini's servers.")
        elif video_file.state.name == "ACTIVE":
            print("Video is ACTIVE and ready for analysis.")

            # 2. Multimodal Analysis Prompt
# 2. Multimodal Analysis Prompt
            prompt = """
            Watch the entire video. Identify EVERY unique restaurant, shop, or landmark mentioned or shown. 
            For each location, provide:
            - location_name: The specific name.
            - city_state: The city and state.
            - vibe: One of "Main Character", "Hidden Quest", "Digital Nomad", "High Energy", or "Touch Grass".
            - transcript_snippet: The most relevant sentence the creator said about THIS specific spot.

            Return the result as a JSON array of objects. Example:
            [
            {"location_name": "Spot 1", ...},
            {"location_name": "Spot 2", ...}
            ]
            """

            # 3. Structured Output Request
            print("Sending request to Gemini 1.5 Flash...")
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=[
                    video_file,
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2, # Low temperature for more deterministic JSON output
                )
            )

            # Display the result
            try:
                result_json = json.loads(response.text)
                print("\n--- Extracted Data ---")
                print(json.dumps(result_json, indent=2))
                print("----------------------\n")
            except json.JSONDecodeError:
                print("\nFailed to parse JSON. Raw output:")
                print(response.text)
        else:
            print(f"Unexpected file state: {video_file.state.name}")

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        # 4. Cleanup
        if 'video_file' in locals() and video_file:
            print(f"Cleaning up: Deleting {video_file.name} from Gemini cloud...")
            try:
                client.files.delete(name=video_file.name)
                print("Cleanup complete.")
            except Exception as e:
                print(f"Failed to delete file: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process a TikTok/Instagram video to extract geospatial data & vibes.")
    parser.add_argument("video_file", help="Path to the downloaded video file")
    
    args = parser.parse_args()
    
    if not os.getenv("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY environment variable is not set. The API call will fail.")
        
    process_social_video(args.video_file)
