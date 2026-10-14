#!/usr/bin/env python3
"""文档多版本发布的辅助脚本(给 .github/workflows/deploy.yml 用)。

gh-pages 的布局:
  /vX.Y.Z/   每个文档正式版一份完整站点
  /dev/      dev 分支预览(不进版本列表)
  /latest/   与根目录一样,只放跳转桩,指向最新版本的同名页面
  /versions.json  Material 版本下拉框读取的列表

子命令:
  info <repo_dir>
      从 mkdocs.yml 页脚读文档版本号,从参考资料页的版本表读配套 SDK 版本,
      输出 GitHub Actions 的 key=value 行(version / title)。
  publish <pages_dir> <version> <title>
      把 <version> 写进 versions.json(按版本号从新到旧排序,最新版带 latest 别名),
      清掉根目录与 latest/ 下旧的跳转桩,再按最新版本重新生成。
      不碰任何 /vX.Y.Z/ 与 /dev/。
"""
import html
import json
import os
import re
import shutil
import sys

VERSION_DIR = re.compile(r'^v\d+\.\d+\.\d+$')
KEEP = {'dev', '.git', '.nojekyll', 'versions.json'}


def vkey(v):
    return tuple(int(x) for x in v[1:].split('.'))


def info(repo):
    mk = open(os.path.join(repo, 'mkdocs.yml'), encoding='utf-8').read()
    m = re.search(r'^copyright:.*文档 (v\d+\.\d+\.\d+)', mk, re.M)
    if not m:
        sys.exit('mkdocs.yml 的 copyright 行里找不到「文档 vX.Y.Z」')
    version = m.group(1)
    title = version
    ref = open(os.path.join(repo, 'docs/common/reference.md'), encoding='utf-8').read()
    row = re.search(r'^\| ' + re.escape(version) + r' \|(.*)\|\s*$', ref, re.M)
    if row:
        sdk = row.group(1).split('|')[-1].strip()
        if re.fullmatch(r'\d+\.\d+\.\d+', sdk):
            title = f'{version} · SDK {sdk}'
    print(f'version={version}')
    print(f'title={title}')


STUB = ('<!doctype html><html lang="zh"><head><meta charset="utf-8">'
        '<title>跳转中…</title><link rel="canonical" href="{u}">'
        '<meta http-equiv="refresh" content="0; url={u}">'
        '<script>location.replace("{u}"+location.search+location.hash)</script>'
        '</head><body><a href="{u}">{u}</a></body></html>\n')

# 根目录 404:GitHub Pages 对任何不存在的路径都返回它。
# 不带版本前缀的旧地址转到最新版的同名路径;已带版本前缀的不再转,免得来回跳。
NOT_FOUND = '''<!doctype html><html lang="zh"><head><meta charset="utf-8">
<title>页面不存在 · XTac-UMI 文档</title>
<script>
(function () {{
  var base = "{base}", latest = "{latest}";
  var p = location.pathname;
  if (p.indexOf(base) !== 0) return;
  var rest = p.slice(base.length);
  if (/^(v\\d+\\.\\d+\\.\\d+|latest|dev)(\\/|$)/.test(rest)) return;
  location.replace(base + latest + "/" + rest + location.search + location.hash);
}})();
</script></head>
<body style="font-family:sans-serif;padding:3rem">
<p>页面不存在 / Page not found</p>
<p><a href="{base}{latest}/">返回文档首页 / Back to the docs</a></p>
</body></html>
'''


def publish(pages, version, title):
    path = os.path.join(pages, 'versions.json')
    try:
        entries = json.load(open(path, encoding='utf-8'))
    except (OSError, ValueError):
        entries = []
    entries = [e for e in entries if e.get('version') != version]
    entries.append({'version': version, 'title': title, 'aliases': []})
    entries = [e for e in entries
               if VERSION_DIR.match(e['version']) and os.path.isdir(os.path.join(pages, e['version']))]
    entries.sort(key=lambda e: vkey(e['version']), reverse=True)
    for e in entries:
        e['aliases'] = []
    entries[0]['aliases'] = ['latest']
    latest = entries[0]['version']
    json.dump(entries, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    # 清掉旧的根目录内容(包括改版前直接放在根目录的整站)与 latest/
    for name in os.listdir(pages):
        if name in KEEP or VERSION_DIR.match(name):
            continue
        p = os.path.join(pages, name)
        shutil.rmtree(p) if os.path.isdir(p) and not os.path.islink(p) else os.remove(p)

    src = os.path.join(pages, latest)
    n = 0
    for d, _, files in os.walk(src):
        if 'index.html' not in files:
            continue
        rel = os.path.relpath(d, src)
        rel = '' if rel == '.' else rel.replace(os.sep, '/') + '/'
        if rel.startswith(('assets/', 'search/')):
            continue
        for prefix in ('', 'latest/'):
            out = os.path.join(pages, prefix + rel)
            os.makedirs(out, exist_ok=True)
            target = '../' * (prefix + rel).count('/') + f'{latest}/{rel}'
            with open(os.path.join(out, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(STUB.format(u=html.escape(target)))
            n += 1

    base = os.environ.get('SITE_PATH', '/XTac-UMI-G1-Docs/')
    with open(os.path.join(pages, '404.html'), 'w', encoding='utf-8') as f:
        f.write(NOT_FOUND.format(base=base, latest=latest))
    open(os.path.join(pages, '.nojekyll'), 'a').close()
    print(f'latest={latest}, versions={[e["version"] for e in entries]}, stubs={n}')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'info':
        info(sys.argv[2])
    elif len(sys.argv) == 5 and sys.argv[1] == 'publish':
        publish(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        sys.exit(__doc__)
