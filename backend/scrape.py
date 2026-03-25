import argparse
import json
import os
import re
import ssl
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from dotenv import load_dotenv

try:
    import certifi
except ImportError:  # pragma: no cover - optional dependency fallback
    certifi = None

load_dotenv()

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"
DEFAULT_STORE_PATH = Path(__file__).resolve().parent / "data" / "dj_sets.json"
MIN_DURATION_SECONDS = 30 * 60


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "Z")


def parse_iso(iso_string: str) -> datetime:
    normalized = iso_string.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def build_ssl_context() -> ssl.SSLContext:
    if certifi is not None:
        return ssl.create_default_context(cafile=certifi.where())
    return ssl.create_default_context()


def fetch_json(url: str) -> Dict[str, Any]:
    try:
        with urlopen(url, context=build_ssl_context(), timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except URLError as exc:
        raise RuntimeError(
            "Failed to reach YouTube API. If this is an SSL cert issue on macOS, run "
            "`pip install certifi` in your venv and retry."
        ) from exc


def parse_iso8601_duration_to_seconds(duration: str) -> int:
    # YouTube duration format examples: PT45M30S, PT1H2M, PT50S
    pattern = re.compile(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$")
    match = pattern.match(duration or "")
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def fetch_recent_dj_sets(
    api_key: str, query: str, max_results: int, lookback_days: int
) -> List[Dict[str, Any]]:
    published_after = utc_now() - timedelta(days=lookback_days)
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "date",
        "maxResults": max_results,
        "publishedAfter": to_iso(published_after),
        "key": api_key,
    }
    url = f"{YOUTUBE_SEARCH_URL}?{urlencode(params)}"

    payload = fetch_json(url)

    results: List[Dict[str, Any]] = []
    for item in payload.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})
        if not video_id:
            continue

        thumbnails = snippet.get("thumbnails", {})
        thumb = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
        )

        results.append(
            {
                "video_id": video_id,
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "published_at": snippet.get("publishedAt"),
                "thumbnail": thumb,
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "fetched_at": to_iso(utc_now()),
            }
        )
    return results


def fetch_video_details(api_key: str, video_ids: List[str]) -> Dict[str, Dict[str, int]]:
    if not video_ids:
        return {}

    # YouTube videos.list allows up to 50 ids per request.
    chunks = [video_ids[i : i + 50] for i in range(0, len(video_ids), 50)]
    details: Dict[str, Dict[str, int]] = {}

    for chunk in chunks:
        params = {
            "part": "statistics,contentDetails",
            "id": ",".join(chunk),
            "key": api_key,
        }
        url = f"{YOUTUBE_VIDEOS_URL}?{urlencode(params)}"
        payload = fetch_json(url)

        for item in payload.get("items", []):
            video_id = item.get("id")
            raw_count = item.get("statistics", {}).get("viewCount", "0")
            raw_duration = item.get("contentDetails", {}).get("duration", "")
            if not video_id:
                continue
            try:
                view_count = int(raw_count)
            except (TypeError, ValueError):
                view_count = 0
            details[video_id] = {
                "view_count": view_count,
                "duration_seconds": parse_iso8601_duration_to_seconds(raw_duration),
            }

    return details


def read_store(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        return data.get("items", [])
    return data if isinstance(data, list) else []


def write_store(path: Path, items: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "updated_at": to_iso(utc_now()),
                "count": len(items),
                "items": items,
            },
            f,
            indent=2,
        )


def rotate_items(
    existing: List[Dict[str, Any]],
    incoming: List[Dict[str, Any]],
    max_items: int,
    max_age_days: int,
) -> List[Dict[str, Any]]:
    merged: Dict[str, Dict[str, Any]] = {}

    for item in existing:
        video_id = item.get("video_id")
        if video_id:
            merged[video_id] = item

    for item in incoming:
        video_id = item.get("video_id")
        if not video_id:
            continue
        # Keep newest metadata from latest fetch
        merged[video_id] = item

    cutoff = utc_now() - timedelta(days=max_age_days)
    filtered = []
    for item in merged.values():
        published_at = item.get("published_at")
        if not published_at:
            continue
        try:
            if parse_iso(published_at) >= cutoff:
                filtered.append(item)
        except ValueError:
            continue

    filtered.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    return filtered[:max_items]


def run_job(
    store_path: Path,
    api_key: str,
    query: str,
    fetch_limit: int,
    lookback_days: int,
    max_items: int,
    max_age_days: int,
) -> Dict[str, int]:
    existing = read_store(store_path)
    incoming = fetch_recent_dj_sets(
        api_key=api_key,
        query=query,
        max_results=fetch_limit,
        lookback_days=lookback_days,
    )
    details_map = fetch_video_details(
        api_key=api_key, video_ids=[item["video_id"] for item in incoming]
    )
    filtered_incoming: List[Dict[str, Any]] = []
    for item in incoming:
        details = details_map.get(item["video_id"], {})
        item["view_count"] = details.get("view_count", 0)
        item["duration_seconds"] = details.get("duration_seconds", 0)
        if item["duration_seconds"] >= MIN_DURATION_SECONDS:
            filtered_incoming.append(item)

    rotated = rotate_items(
        existing=existing,
        incoming=filtered_incoming,
        max_items=max_items,
        max_age_days=max_age_days,
    )
    write_store(store_path, rotated)

    return {
        "existing_before": len(existing),
        "fetched_now": len(incoming),
        "after_duration_filter": len(filtered_incoming),
        "stored_after": len(rotated),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch recent DJ sets from YouTube and rotate old entries."
    )
    parser.add_argument(
        "--store-path",
        default=str(DEFAULT_STORE_PATH),
        help="Output JSON file path used by your website backend/frontend.",
    )
    parser.add_argument(
        "--query",
        default="DJ set full live",
        help="YouTube search query to find sets.",
    )
    parser.add_argument(
        "--fetch-limit",
        type=int,
        default=50,
        help="How many videos to request each run (max 50 on search endpoint).",
    )
    parser.add_argument(
        "--lookback-days",
        type=int,
        default=7,
        help="Only fetch videos published in this recent window.",
    )
    parser.add_argument(
        "--max-items",
        type=int,
        default=120,
        help="Max number of videos to keep in the rotating pool.",
    )
    parser.add_argument(
        "--max-age-days",
        type=int,
        default=60,
        help="Drop videos older than this from the rotating pool.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing YOUTUBE_API_KEY. Export it before running this script."
        )

    stats = run_job(
        store_path=Path(args.store_path),
        api_key=api_key,
        query=args.query,
        fetch_limit=args.fetch_limit,
        lookback_days=args.lookback_days,
        max_items=args.max_items,
        max_age_days=args.max_age_days,
    )

    print("DJ set sync complete")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()