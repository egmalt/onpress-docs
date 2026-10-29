#!/usr/bin/env python3
"""Deploy an OnPress demo frame to your own OnPress site through API v2.

Usage:
    export ONPRESS_TOKEN=op_...      # API token of your site (Console -> API)
    export ONPRESS_SITE=...          # site id
    python3 deploy.py kanban
    python3 deploy.py kanban --url /tools/kanban/ --back-url /tools/
    python3 deploy.py kanban --dry-run

Steps:
    1. POST /frames (or PUT /frames/{slug} if the frame exists) with frame.html
    2. PUT /frames/{slug}/files?name=... for every .css and .js file
    3. POST /pages/markdown with page.md and frame "demo-<name>"

Only the Python standard library is used.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG_LINK = '/docs/v2/ru/guides/demo/'


def api_base():
    token = os.environ.get('ONPRESS_TOKEN')
    site = os.environ.get('ONPRESS_SITE')
    if not token or not site:
        sys.exit('Set ONPRESS_TOKEN and ONPRESS_SITE environment variables.')
    root = os.environ.get('ONPRESS_API', 'https://onpress.pro/api/v2').rstrip('/')
    return token, f'{root}/site/{site}'


def call(token, base, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(8):
        req = urllib.request.Request(base + path, data=data, method=method)
        req.add_header('Authorization', 'Bearer ' + token)
        req.add_header('Content-Type', 'application/json')
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.status, json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 + attempt * 2)
                continue
            raw = e.read()
            try:
                return e.code, json.loads(raw)
            except ValueError:
                return e.code, {'error': raw[:300].decode('utf8', 'replace')}
    return 429, {'error': 'rate_limited'}


def report(label, status, resp):
    ok = resp.get('success', status < 300)
    detail = resp.get('error') or resp.get('message') or ''
    print(f'{label}: {status} {"ok" if ok else "failed"} {detail}'.rstrip())
    if not ok:
        sys.exit(1)


def set_property(markdown, key, value):
    head, sep, body = markdown.partition('\n---\n')
    lines = [l for l in head.splitlines() if not l.startswith(key + ':')]
    lines.append(f'{key}: {json.dumps(value, ensure_ascii=False)}')
    return '\n'.join(lines) + sep + body


def main():
    names = sorted(d for d in os.listdir(os.path.join(HERE, 'demos'))
                   if os.path.isfile(os.path.join(HERE, 'demos', d, 'frame.html')))
    p = argparse.ArgumentParser(description='Deploy a demo frame to your OnPress site.')
    p.add_argument('name', choices=names, help='demo folder in demos/')
    p.add_argument('--url', help='page address, default /<name>/')
    p.add_argument('--back-url', default='/', help='where the "Back" links lead, default /')
    p.add_argument('--draft', action='store_true', help='publish the page as a draft')
    p.add_argument('--dry-run', action='store_true', help='validate frame and files, write nothing')
    args = p.parse_args()

    token, base = api_base()
    folder = os.path.join(HERE, 'demos', args.name)
    slug = 'demo-' + args.name

    def read(name):
        with open(os.path.join(folder, name), encoding='utf8') as f:
            return f.read().replace(CATALOG_LINK, args.back_url)

    html = read('frame.html')
    status, _ = call(token, base, 'GET', f'/frames/{slug}')
    exists = status != 404
    if exists:
        status, resp = call(token, base, 'PUT', f'/frames/{slug}',
                            {'html': html, 'dry_run': args.dry_run})
        report(f'PUT /frames/{slug}', status, resp)
    else:
        status, resp = call(token, base, 'POST', '/frames',
                            {'slug': slug, 'html': html, 'dry_run': args.dry_run})
        report(f'POST /frames {slug}', status, resp)

    if args.dry_run and not exists:
        print('Dry run: the frame does not exist yet, file checks are skipped.')
    else:
        for name in sorted(os.listdir(folder)):
            if name.endswith(('.css', '.js')):
                q = urllib.parse.urlencode({'name': name})
                status, resp = call(token, base, 'PUT', f'/frames/{slug}/files?{q}',
                                    {'content': read(name), 'dry_run': args.dry_run})
                report(f'PUT /frames/{slug}/files {name}', status, resp)

    if args.dry_run:
        print('Dry run: page not published.')
        return

    markdown = read('page.md')
    markdown = set_property(markdown, 'url', args.url or f'/{args.name}/')
    if args.draft:
        markdown = set_property(markdown, 'status', 'draft')
    status, resp = call(token, base, 'POST', '/pages/markdown', {'markdown': markdown, 'frame': slug})
    report('POST /pages/markdown', status, resp)
    print('Page:', resp.get('link') or resp.get('url'))


if __name__ == '__main__':
    main()
