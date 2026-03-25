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

# 🔥 Filters
MIN_DURATION_SECONDS = 30 * 60
MIN_VIEWS = 50000

GOOD_KEYWORDS = [
    "live",
    "mix",
    "set",
    "festival",
    "dj set",
    "boiler room",
    "cercle",
]

BAD_KEYWORDS = [
    "clip",
    "short",
    "interview",
    "reaction",
    "tutorial",
    "preview",
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


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "Z")


def parse_iso(iso_string: str) -> datetime:
    return datetime.fromisoformat(iso_string.replace("Z", "+00:00"))


def build_ssl_context() -> ssl.SSLContext:
    if certifi:
        return ssl.create_default_context(cafile=certifi.where())
    return ssl.create_default_context()


def fetch_json(url: str) -> Dict[str, Any]:
    try:
        with urlopen(url, context=build_ssl_context(), timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except URLError as exc:
        raise RuntimeError("Failed to reach YouTube API") from exc


def parse_iso8601_duration_to_seconds(duration: str) -> int:
    pattern = re.compile(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$")
    match = pattern.match(duration or "")
    if not match:
        return 0
    h = int(match.group(1) or 0)
    m = int(match.group(2) or 0)
    s = int(match.group(3) or 0)
    return h * 3600 + m * 60 + s


def fetch_dj_sets(api_key: str, max_results: int, lookback_days: int):
    query = random.choice(QUERIES)

    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "viewCount",  # 🔥 QUALITY SORT
        "maxResults": max_results,
        "publishedAfter": to_iso(utc_now() - timedelta(days=lookback_days)),
        "key": api_key,
    }

    url = f"{YOUTUBE_SEARCH_URL}?{urlencode(params)}"
    payload = fetch_json(url)

    results = []

    for item in payload.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})
        if not video_id:
            continue

        results.append({
            "video_id": video_id,
            "title": snippet.get("title", ""),
            "channel": snippet.get("channelTitle", ""),
            "published_at": snippet.get("publishedAt"),
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url"),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "fetched_at": to_iso(utc_now()),
        })

    return results


def fetch_video_details(api_key: str, video_ids: List[str]):
    chunks = [video_ids[i:i+50] for i in range(0, len(video_ids), 50)]
    details = {}

    for chunk in chunks:
        params = {
            "part": "statistics,contentDetails",
            "id": ",".join(chunk),
            "key": api_key,
        }

        url = f"{YOUTUBE_VIDEOS_URL}?{urlencode(params)}"
        payload = fetch_json(url)

        for item in payload.get("items", []):
            vid = item["id"]
            views = int(item.get("statistics", {}).get("viewCount", 0))
            duration = parse_iso8601_duration_to_seconds(
                item.get("contentDetails", {}).get("duration", "")
            )

            details[vid] = {
                "view_count": views,
                "duration_seconds": duration,
            }

    return details


def is_clean(title: str) -> bool:
    title = title.lower()
    return not any(b in title for b in BAD_KEYWORDS)


def looks_like_set(title: str) -> bool:
    title = title.lower()
    return any(k in title for k in GOOD_KEYWORDS)


def is_trusted_channel(channel: str) -> bool:
    channel = channel.lower()
    return any(c in channel for c in TRUSTED_CHANNELS)


def score_video(item):
    return (
        item.get("view_count", 0) * 0.7 +
        item.get("duration_seconds", 0) * 0.3
    )


def filter_and_rank(incoming, details_map):
    output = []

    for item in incoming:
        details = details_map.get(item["video_id"], {})
        item.update(details)

        title = item["title"]
        channel = item["channel"]

        if (
            item["duration_seconds"] >= MIN_DURATION_SECONDS
            and item["view_count"] >= MIN_VIEWS
            and looks_like_set(title)
            and is_clean(title)
        ):
            # boost trusted channels
            item["score"] = score_video(item)
            if is_trusted_channel(channel):
                item["score"] *= 1.5

            output.append(item)

    output.sort(key=lambda x: x["score"], reverse=True)
    return output


def read_store(path: Path):
    if not path.exists():
        return []
    return json.loads(path.read_text()).get("items", [])


def write_store(path: Path, items):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({
        "updated_at": to_iso(utc_now()),
        "count": len(items),
        "items": items,
    }, indent=2))


def run_job(args, api_key):
    existing = read_store(Path(args.store_path))

    incoming = fetch_dj_sets(
        api_key,
        args.fetch_limit,
        args.lookback_days
    )

    details = fetch_video_details(
        api_key,
        [x["video_id"] for x in incoming]
    )

    filtered = filter_and_rank(incoming, details)

    combined = {x["video_id"]: x for x in existing}
    for item in filtered:
        combined[item["video_id"]] = item

    final = sorted(
        combined.values(),
        key=lambda x: x.get("score", 0),
        reverse=True
    )[:args.max_items]

    write_store(Path(args.store_path), final)

    return {
        "fetched": len(incoming),
        "filtered": len(filtered),
        "stored": len(final),
    }


def build_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("--store-path", default=str(DEFAULT_STORE_PATH))
    parser.add_argument("--fetch-limit", type=int, default=50)
    parser.add_argument("--lookback-days", type=int, default=30)
    parser.add_argument("--max-items", type=int, default=120)
    return parser


def main():
    args = build_parser().parse_args()

    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing YOUTUBE_API_KEY")

    stats = run_job(args, api_key)

    print("🔥 DJ SET SYNC COMPLETE")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main() 