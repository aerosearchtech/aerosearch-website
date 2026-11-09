"""Record the grain analyzer demo for the static /demo/grain replay.

Drives a running grain analyzer (proposals/fci/grain/demo, real model) and
saves its genuine outputs under public/demos/grain/: meta, one sample per lot
profile x kernel count, one tray run with its photo, and the device-signed
record for each officer decision on each sample. Kernel crops are embedded in
each sample as data URIs: thousands of small files time out GitHub Pages deploys.

Usage: python scripts/record_grain.py TRAY_IMAGE [API_BASE]
"""
import base64
import json
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

OUT = Path(__file__).resolve().parent.parent / "public" / "demos" / "grain"
WEB_ROOT = "/demos/grain"
PROFILES = ("good", "borderline", "poor")
KERNEL_COUNTS = (200, 400, 600)
DECISIONS = ("ACCEPT", "VALUE_CUT", "REJECT")
COMMODITY = "rice"
TRAY_IMAGE = re.compile(r"^/files/[^/]+/(tray\.jpg)$")


def call(api: str, path: str, body: bytes | None = None, ctype: str = "application/json") -> bytes:
    req = Request(api + path, data=body, headers={"Content-Type": ctype} if body else {})
    with urlopen(req, timeout=120) as res:
        return res.read()


def post_json(api: str, path: str, payload: dict) -> dict:
    return json.loads(call(api, path, json.dumps(payload).encode()))


def post_image(api: str, image: Path) -> dict:
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"commodity\"\r\n\r\n{COMMODITY}\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"tray.jpg\"\r\n"
        "Content-Type: image/jpeg\r\n\r\n"
    ).encode() + image.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    return json.loads(call(api, "/api/analyze/image", body, f"multipart/form-data; boundary={boundary}"))


def save_tray_image(api: str, url: str | None) -> str | None:
    """Download the tray photo and return its static URL."""
    if url is None:
        return None
    match = TRAY_IMAGE.match(url)
    if not match:
        raise ValueError(f"unrecognised tray image URL: {url}")
    dest = OUT / "tray" / match.group(1)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(call(api, url))
    return f"{WEB_ROOT}/tray/{match.group(1)}"


def inline(api: str, url: str | None) -> str | None:
    """Fetch a kernel crop and return it as a JPEG data URI."""
    if url is None:
        return None
    return "data:image/jpeg;base64," + base64.b64encode(call(api, url)).decode()


def save_sample(api: str, name: str, result: dict) -> None:
    result["image_url"] = save_tray_image(api, result["image_url"])
    for k in result["kernels"]:
        k["up_url"] = inline(api, k["up_url"])
        k["down_url"] = inline(api, k["down_url"])
    result["decisions"] = {
        d: post_json(api, "/api/decision", {"record": result["record"], "decision": d}) for d in DECISIONS
    }
    path = OUT / "samples" / f"{name}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, separators=(",", ":")))
    print(f"{name}: {len(result['kernels'])} kernels, {result['verdict']}")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    tray = Path(sys.argv[1])
    api = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8010"

    meta = json.loads(call(api, "/api/meta"))
    meta["recorded_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "meta.json").write_text(json.dumps(meta, indent=1))

    for profile in PROFILES:
        for n in KERNEL_COUNTS:
            result = post_json(api, "/api/analyze/reference",
                               {"commodity": COMMODITY, "kernels": n, "profile": profile})
            save_sample(api, f"{profile}-{n}", result)
    save_sample(api, "tray", post_image(api, tray))


if __name__ == "__main__":
    main()
