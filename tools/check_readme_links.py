#!/usr/bin/env python3
"""Check the README's repository targets and, optionally, public HTTP responses.

Standard library only. Does not execute application JavaScript or test WebGL.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import html
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

SITE = "hectorlobatohernandez.github.io"
ROOT = Path(__file__).resolve().parents[1]


class ReadmeLinks(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.targets: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        key = {"a": "href", "img": "src"}.get(tag)
        if key and values.get(key):
            self.targets.add(str(values[key]))


def extract_links(text: str) -> list[str]:
    parser = ReadmeLinks()
    parser.feed(text)
    parser.close()
    parser.targets.update(re.findall(r"!?\[[^\]]*\]\(([^\s)]+)\)", text))
    return sorted({html.unescape(url) for url in parser.targets if not url.startswith("#")})


def source_result(url: str, root: Path = ROOT) -> dict:
    parsed = urllib.parse.urlsplit(url)
    row = {"url": url, "local_ok": None, "path": None}
    if parsed.scheme or parsed.netloc:
        if parsed.scheme != "https":
            return dict(row, local_ok=False, error="Only HTTPS links are allowed")
        if parsed.hostname != SITE:
            return dict(row, external=True)
        path = urllib.parse.unquote(parsed.path).lstrip("/")
    else:
        path = urllib.parse.unquote(parsed.path)
    target = (root / path).resolve()
    if not target.is_relative_to(root.resolve()):
        return dict(row, local_ok=False, error="Target escapes repository")
    if not path or path.endswith("/") or target.is_dir():
        target /= "index.html"
    row["path"] = target.relative_to(root.resolve()).as_posix()
    row["local_ok"] = target.is_file()
    if not row["local_ok"]:
        return dict(row, error="Missing repository target")
    text = target.read_text(encoding="utf-8")
    if target.suffix.lower() == ".html":
        title = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
        row["source_title"] = html.unescape(title.group(1).strip()) if title else ""
        if not row["source_title"]:
            return dict(row, local_ok=False, error="HTML target has no title")
        if parsed.fragment:
            ids = re.findall(r'\b(?:id|name)=[\"\']([^\"\']+)', text)
            if urllib.parse.unquote(parsed.fragment) not in ids:
                return dict(row, local_ok=False, error="HTML fragment not found in source")
    if target.suffix.lower() == ".svg":
        try:
            svg = ET.fromstring(text)
            for element in svg.iter():
                if element.tag.rsplit("}", 1)[-1] in {"script", "foreignObject"}:
                    raise ValueError("Active SVG content is not allowed")
                for name, value in element.attrib.items():
                    if name.lower().startswith("on") or name.rsplit("}", 1)[-1] == "href":
                        raise ValueError("SVG scripts and external references are not allowed")
            row["svg_ok"] = True
        except (ET.ParseError, ValueError) as error:
            return dict(row, local_ok=False, error=str(error))
    return row


def live_result(url: str) -> dict:
    # Never fetch arbitrary README destinations or send authentication credentials.
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in {SITE, "github.com"}:
        return {"http_checked": False}
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "HL-README-Link-Check/1.0"})
            with urllib.request.urlopen(request, timeout=15) as response:
                body = response.read(524288).decode("utf-8", errors="replace")
                title = re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S)
                return {
                    "http_checked": True,
                    "http_status": response.status,
                    "final_url": response.geturl(),
                    "http_title": html.unescape(title.group(1).strip()) if title else "",
                    "http_ok": response.status == 200 and bool(title),
                }
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            result = {"http_checked": True, "http_ok": False, "http_error": str(error)}
            if isinstance(error, urllib.error.HTTPError):
                result["http_status"] = error.code
            if attempt < 2:
                time.sleep(attempt + 1)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true", help="Check public HTTP pages as well as repository targets")
    parser.add_argument("--previous", help="Audit a previous git revision, e.g. HEAD^; old failures are informational")
    parser.add_argument("--output", default=".qa/readme-links.json")
    args = parser.parse_args()
    current = extract_links((ROOT / "README.md").read_text(encoding="utf-8"))
    previous: list[str] = []
    if args.previous:
        if not re.fullmatch(r"[A-Za-z0-9_./~^\-]+", args.previous) or args.previous.startswith("-"):
            parser.error("Invalid previous revision")
        old = subprocess.run(["git", "show", f"{args.previous}:README.md"], cwd=ROOT, capture_output=True, text=True, check=True)
        previous = extract_links(old.stdout)
    rows = []
    for url in sorted(set(current) | set(previous)):
        row = source_result(url)
        row["in_current"] = url in current
        row["in_previous"] = url in previous
        rows.append(row)
    if args.live:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            results = executor.map(live_result, [row["url"] for row in rows])
            for row, result in zip(rows, results):
                row.update(result)
    failures = [row for row in rows if row["in_current"] and (row["local_ok"] is False or row.get("http_ok") is False)]
    report = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "scope": "Repository paths, SVG syntax, HTML titles and optional HTTP GET; not functional browser or WebGL QA",
        "live_requested": args.live,
        "current_unique_targets": len(current),
        "previous_unique_targets": len(previous),
        "http_pages_checked": sum(bool(row.get("http_checked")) for row in rows),
        "current_failures": len(failures),
        "results": rows,
    }
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for row in rows:
        label = "CURRENT" if row["in_current"] else "PREVIOUS"
        print(f"{label:8} local={row['local_ok']} HTTP={row.get('http_status', '-')} {row['url']}")
        if row.get("error") or row.get("http_error"):
            print("  ", row.get("error", row.get("http_error")))
    print(json.dumps({key: value for key, value in report.items() if key != "results"}, ensure_ascii=False))
    print("README_LINKS_OK" if not failures else "README_LINKS_FAILED")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
