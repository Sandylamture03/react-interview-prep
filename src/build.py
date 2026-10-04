"""Build the site from the Markdown-like content files in this folder.

Usage:  python src/build.py
Output: ../index.html               (the standalone site; GitHub Pages serves it)
        build/artifact-page.html    (same page without the document wrapper, for the claude.ai artifact)
"""
import html
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
CONTENT_FILES = [
    # 80/20 Core package
    "theory-1.md", "theory-2.md", "theory-3.md", "theory-4.md",
    "coding-1.md", "coding-2.md",
    "technical-1.md", "technical-2.md",
    # Beyond 80/20 package (kept separate)
    "beyond-theory.md",
    "beyond-coding-1.md", "beyond-coding-2.md",
    "beyond-technical-1.md", "beyond-technical-2.md",
]
PACKAGES = [
    {"key": "core", "label": "80/20 Core",
     "note": "The 17 skills and the skip list from the React 80/20 roadmap, and nothing else."},
    {"key": "beyond", "label": "Beyond 80/20",
     "note": "Kept separate from 80/20 Core. Roadmap gaps add coding and technical practice "
             "for skills that had none; Beyond the roadmap covers common interview topics the roadmap leaves out."},
]
SECTIONS = {
    "theory": {"label": "Theory Q&A", "short": "Theory", "prefix": "Q", "pkg": "core"},
    "coding": {"label": "Coding challenges", "short": "Coding", "prefix": "C", "pkg": "core"},
    "technical": {"label": "Technical Q&A", "short": "Technical", "prefix": "T", "pkg": "core"},
    "beyond-theory": {"label": "Theory Q&A", "short": "Theory", "prefix": "BQ", "pkg": "beyond"},
    "beyond-coding": {"label": "Coding challenges", "short": "Coding", "prefix": "BC", "pkg": "beyond"},
    "beyond-technical": {"label": "Technical Q&A", "short": "Technical", "prefix": "BT", "pkg": "beyond"},
}
GROUPS = {"", "gap", "beyond"}
LEVELS = {"basic", "intermediate", "advanced"}
TAGS = {"new", "gate", "legacy"}


# ---------- inline + block Markdown (the small subset the content uses) ----------

def inline(text):
    codes = []

    def stash(m):
        codes.append("<code>" + html.escape(m.group(1), quote=False) + "</code>")
        return f"\x00{len(codes) - 1}\x00"

    s = re.sub(r"`([^`]+)`", stash, text)
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
    return re.sub(r"\x00(\d+)\x00", lambda m: codes[int(m.group(1))], s)


def split_row(line):
    cells = line.strip().strip("|").split("|")
    return [c.strip() for c in cells]


def md_to_html(text):
    lines = text.split("\n")
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            i += 1
            continue

        if stripped.startswith("```"):
            lang = stripped[3:].strip() or "text"
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1  # closing fence
            code = html.escape("\n".join(buf), quote=False)
            label = {"jsx": "JSX", "tsx": "TSX", "ts": "TypeScript", "js": "JavaScript",
                     "bash": "Terminal", "css": "CSS", "text": "Text"}.get(lang, lang.upper())
            prism_lang = {"ts": "typescript", "js": "javascript", "text": "none"}.get(lang, lang)
            out.append(
                f'<div class="code"><div class="code-bar"><span>{label}</span>'
                f'<button type="button" class="copy">Copy</button></div>'
                f'<pre class="language-{prism_lang}"><code class="language-{prism_lang}">{code}</code></pre></div>'
            )
            continue

        if stripped.startswith("!! "):
            buf = []
            while i < n and lines[i].strip().startswith("!! "):
                buf.append(lines[i].strip()[3:])
                i += 1
            out.append('<div class="lead"><span class="lead-label">Say this first</span>'
                       f'<p>{inline(" ".join(buf))}</p></div>')
            continue

        if stripped.startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            out.append(f'<aside class="tip"><p>{inline(" ".join(buf))}</p></aside>')
            continue

        if stripped.startswith("|"):
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            header = split_row(rows[0])
            body = [split_row(r) for r in rows[2:]]
            th = "".join(f"<th>{inline(c)}</th>" for c in header)
            trs = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body)
            out.append(f'<div class="table"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>')
            continue

        if stripped.startswith("#### "):
            out.append(f"<h4>{inline(stripped[5:])}</h4>")
            i += 1
            continue

        list_match = re.match(r"^(- |\d+\. )", stripped)
        if list_match:
            ordered = stripped[0].isdigit()
            items = []
            while i < n:
                cur = lines[i]
                cs = cur.strip()
                m = re.match(r"^(- |\d+\. )(.*)$", cs)
                if m and not cur.startswith("  "):
                    items.append(m.group(2))
                    i += 1
                elif cs and cur.startswith("  ") and items:
                    items[-1] += " " + cs
                    i += 1
                else:
                    break
            tag = "ol" if ordered else "ul"
            lis = "".join(f"<li>{inline(it)}</li>" for it in items)
            out.append(f"<{tag}>{lis}</{tag}>")
            continue

        buf = []
        while i < n:
            s = lines[i].strip()
            if not s or s.startswith(("```", "!! ", ">", "|", "#### ")) or re.match(r"^(- |\d+\. )", s):
                break
            buf.append(s)
            i += 1
        out.append(f"<p>{inline(' '.join(buf))}</p>")
    return "\n".join(out)


def plain(html_text):
    t = re.sub(r"<[^>]+>", " ", html_text)
    t = html.unescape(t)
    return re.sub(r"\s+", " ", t).strip().lower()


def slug(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:64].strip("-")


# ---------- parse the content files ----------

def parse():
    sections = {key: {"key": key, **meta, "topics": []} for key, meta in SECTIONS.items()}
    seen_ids = set()
    for name in CONTENT_FILES:
        text = (HERE / name).read_text(encoding="utf-8")
        section = None
        topic = None
        item = None

        def finish_item():
            if item is None:
                return
            body = "\n".join(item.pop("lines"))
            if "\n-- answer --" in "\n" + body:
                prompt_md, answer_md = re.split(r"(?m)^-- answer --\s*$", body, maxsplit=1)
            else:
                prompt_md, answer_md = "", body
            item["prompt"] = md_to_html(prompt_md.strip()) if prompt_md.strip() else ""
            item["answer"] = md_to_html(answer_md.strip())
            item["text"] = plain(item["titleHtml"] + " " + item["prompt"] + " " + item["answer"])
            topic["items"].append(item)

        for raw in text.split("\n"):
            if raw.startswith("@section "):
                section = sections[raw.split()[1]]
                continue
            if raw.startswith("## "):
                finish_item()
                item = None
                fields = [p.strip() for p in raw[3:].split("|")]
                tid, title, week, skills = fields[:4]
                group = fields[4] if len(fields) > 4 else ""
                if group not in GROUPS:
                    raise ValueError(f"{name}: unknown topic group {group!r} in {raw!r}")
                topic = {"id": tid, "title": title, "week": week, "skills": skills,
                         "group": group, "items": []}
                section["topics"].append(topic)
                continue
            if raw.startswith("### "):
                finish_item()
                title = raw[4:].strip()
                level, tags = "basic", []
                while True:
                    m = re.search(r"\s+([@#])(\w+)$", title)
                    if not m:
                        break
                    if m.group(1) == "@" and m.group(2) in LEVELS:
                        level = m.group(2)
                    elif m.group(1) == "#" and m.group(2) in TAGS:
                        tags.insert(0, m.group(2))
                    else:
                        break
                    title = title[: m.start()].rstrip()
                base = f"{section['prefix'].lower()}-{slug(title)}"
                uid, k = base, 2
                while uid in seen_ids:
                    uid, k = f"{base}-{k}", k + 1
                seen_ids.add(uid)
                item = {"id": uid, "title": title, "titleHtml": inline(title),
                        "level": level, "tags": tags, "lines": []}
                continue
            if item is not None:
                item["lines"].append(raw)
        finish_item()

    for sec in sections.values():
        num = 0
        for t in sec["topics"]:
            for it in t["items"]:
                num += 1
                it["num"] = f"{sec['prefix']}{num}"
                del it["title"]
    return [sections[k] for k in SECTIONS]


def main():
    sections = parse()
    data = {"packages": PACKAGES, "sections": sections}
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    template = (HERE / "template.html").read_text(encoding="utf-8")
    page = template.replace("/*__DATA__*/null", payload)

    (HERE / "build").mkdir(exist_ok=True)
    (HERE / "build" / "artifact-page.html").write_text(page, encoding="utf-8")

    head, body = page.split("<!--/head-->", 1)
    standalone = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
        + head.strip() + "\n</head>\n<body>\n" + body.strip() + "\n</body>\n</html>\n"
    )
    (HERE.parent / "index.html").write_text(standalone, encoding="utf-8")

    pkg_labels = {p["key"]: p["label"] for p in PACKAGES}
    for sec in sections:
        count = sum(len(t["items"]) for t in sec["topics"])
        print(f"{pkg_labels[sec['pkg']]} / {sec['label']}: {len(sec['topics'])} topics, {count} items")
    print(f"page size: {len(page) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
