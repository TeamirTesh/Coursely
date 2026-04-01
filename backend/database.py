import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Always load from the .env next to this file, regardless of CWD
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

url: str = os.environ["SUPABASE_URL"]
key: str = os.environ["SUPABASE_KEY"]

db: Client = create_client(url, key)
