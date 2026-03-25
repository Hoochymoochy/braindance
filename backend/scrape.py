import argparse
import json
import os
import re
import ssl
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from dotenv import load_dotenv

try:
    import certifi
except ImportError:
    certifi = None

load_dotenv()

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"

DEFAULT_STORE_PATH = Path(__file__).resolve().parent / "data" / "dj_sets.json"

# 🔥 CORE FILTERS
MIN_DURATION_SECONDS = 30 * 60
MIN_VIEWS = 50000

# 🔥 KEYWORDS
GOOD_KEYWORDS = [
    "live", "mix", "set", "festival", "dj set",
    "boiler room", "cercle"
]

BAD_KEYWORDS = [
    "clip", "short", "interview",
    "reaction", "tutorial", "preview"
]

QUERIES = [
    "live DJ set full mix festival",
    "techno DJ set full mix live",
    "house music DJ set full mix",
    "boiler room set full",
    "cercle DJ set",
]

TRUSTED_CHANNELS = [
    "boiler room",
    "cercle",
    "tomorrowland",
    "mixmag",
    "defected",
]

# 🧠 TAGGING SYSTEM
GENRE_TAGS = {
    "techno": ["techno", "acid", "warehouse"],
    "house": ["house", "deep house", "afro house"],
    "hardstyle": ["hardstyle", "hard techno", "hard dance"],
    "edm": ["festival", "big room", "edm"],
    "dnb": ["dnb", "drum and bass"],
}

CONTEXT_TAGS = {
    "festival": ["tomorrowland", "ultra", "edc"],
    "boiler_room": ["boiler room"],
    "cercle": ["cercle"],
    "club": ["club", "live set"],
}

LOCATION_KEYWORDS = {
    "ibiza": ["ibiza"],
    "brazil": ["sao paulo", "rio"],
    "berlin": ["berlin"],
}


# ---------------- UTIL ----------------

def utc_now():
    return datetime.now(timezone.utc)


def to_iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def build_ssl_context():
    if certifi:
        return ssl.create_default_context(cafile=certifi.where())
    return ssl.create_default_context()


def fetch_json(url: str):
    try:
        with urlopen(url, context=build_ssl_context(), timeout=20) as res:
            return json.loads(res.read().decode("utf-8"))
    except URLError as e:
        raise RuntimeError("YouTube API failed") from e


def parse_duration(duration: str):
    pattern = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")
    match = pattern.match(duration or "")
    if not match:
        return 0
    h = int(match.group(1) or 0)
    m = int(match.group(2) or 0)
    s = int(match.group(3) or 0)
    return h * 3600 + m * 60 + s


# ---------------- FETCH ----------------

def fetch_sets(api_key, max_results, lookback_days):
    query = random.choice(QUERIES)

    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "viewCount",
        "maxResults": max_results,
        "publishedAfter": to_iso(utc_now() - timedelta(days=lookback_days)),
        "key": api_key,
    }

    url = f"{YOUTUBE_SEARCH_URL}?{urlencode(params)}"
    data = fetch_json(url)

    results = []
    for item in data.get("items", []):
        vid = item["id"].get("videoId")
        snip = item.get("snippet", {})
        if not vid:
            continue

        results.append({
            "video_id": vid,
            "title": snip.get("title", ""),
            "channel": snip.get("channelTitle", ""),
            "published_at": snip.get("publishedAt"),
            "thumbnail": snip.get("thumbnails", {}).get("high", {}).get("url"),
            "url": f"https://youtube.com/watch?v={vid}",
            "fetched_at": to_iso(utc_now())
        })

    return results


def fetch_details(api_key, ids):
    chunks = [ids[i:i+50] for i in range(0, len(ids), 50)]
    out = {}

    for chunk in chunks:
        params = {
            "part": "statistics,contentDetails",
            "id": ",".join(chunk),
            "key": api_key
        }

        url = f"{YOUTUBE_VIDEOS_URL}?{urlencode(params)}"
        data = fetch_json(url)

        for item in data.get("items", []):
            vid = item["id"]
            views = int(item.get("statistics", {}).get("viewCount", 0))
            duration = parse_duration(item.get("contentDetails", {}).get("duration", ""))

            out[vid] = {
                "view_count": views,
                "duration_seconds": duration
            }

    return out


# ---------------- TAGGING ----------------

def extract_tags(title, channel):
    text = f"{title} {channel}".lower()

    genres = [
        g for g, keys in GENRE_TAGS.items()
        if any(k in text for k in keys)
    ]

    contexts = [
        c for c, keys in CONTEXT_TAGS.items()
        if any(k in text for k in keys)
    ]

    return genres, contexts


def estimate_energy(title):
    t = title.lower()
    if any(k in t for k in ["hard", "industrial", "fast"]):
        return "high"
    elif any(k in t for k in ["deep", "chill", "melodic"]):
        return "low"
    return "medium"


def extract_location(title):
    t = title.lower()
    for loc, keys in LOCATION_KEYWORDS.items():
        if any(k in t for k in keys):
            return loc
    return None


# ---------------- FILTER + SCORE ----------------

def is_clean(title):
    t = title.lower()
    return not any(b in t for b in BAD_KEYWORDS)


def looks_like_set(title):
    t = title.lower()
    return any(g in t for g in GOOD_KEYWORDS)


def is_trusted(channel):
    c = channel.lower()
    return any(tc in c for tc in TRUSTED_CHANNELS)


def score(item):
    base = item["view_count"] * 0.7 + item["duration_seconds"] * 0.3

    if "festival" in item["contexts"]:
        base *= 1.2

    if "techno" in item["genres"]:
        base *= 1.1

    if is_trusted(item["channel"]):
        base *= 1.5

    return base


def process(incoming, details):
    out = []

    for item in incoming:
        d = details.get(item["video_id"], {})
        item.update(d)

        title = item["title"]
        channel = item["channel"]

        if not (
            item["duration_seconds"] >= MIN_DURATION_SECONDS and
            item["view_count"] >= MIN_VIEWS and
            looks_like_set(title) and
            is_clean(title)
        ):
            continue

        genres, contexts = extract_tags(title, channel)

        item["genres"] = genres
        item["contexts"] = contexts
        item["energy"] = estimate_energy(title)
        item["location"] = extract_location(title)

        item["score"] = score(item)

        out.append(item)

    out.sort(key=lambda x: x["score"], reverse=True)
    return out


# ---------------- STORAGE ----------------

def read_store(path):
    if not path.exists():
        return []
    return json.loads(path.read_text()).get("items", [])


def write_store(path, items):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({
        "updated_at": to_iso(utc_now()),
        "count": len(items),
        "items": items
    }, indent=2))


# ---------------- RUN ----------------

def run(args, api_key):
    existing = read_store(Path(args.store_path))

    incoming = fetch_sets(api_key, args.fetch_limit, args.lookback_days)

    details = fetch_details(api_key, [x["video_id"] for x in incoming])

    processed = process(incoming, details)

    merged = {x["video_id"]: x for x in existing}
    for item in processed:
        merged[item["video_id"]] = item

    final = sorted(
        merged.values(),
        key=lambda x: x.get("score", 0),
        reverse=True
    )[:args.max_items]

    write_store(Path(args.store_path), final)

    return {
        "fetched": len(incoming),
        "processed": len(processed),
        "stored": len(final)
    }


def build_parser():
    p = argparse.ArgumentParser()
    p.add_argument("--store-path", default=str(DEFAULT_STORE_PATH))
    p.add_argument("--fetch-limit", type=int, default=50)
    p.add_argument("--lookback-days", type=int, default=30)
    p.add_argument("--max-items", type=int, default=120)
    return p


def main():
    args = build_parser().parse_args()

    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing YOUTUBE_API_KEY")

    stats = run(args, api_key)

    print("🔥 DJ INTEL PIPELINE COMPLETE")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()