#!/usr/bin/env python3
"""文档多版本发布的辅助脚本(给 .github/workflows/deploy.yml 用)。

下拉框里的版本是**发布的软件版本**,即 XTac-UMI Collector 的版本(v0.4.3、v0.4.4…),
不是文档仓库自己的版本号(页脚的「文档 vX.Y.Z」)。两者的对应关系只有一个出处:
docs/common/reference.md 的「文档版本与配套软件」表。同一个 Collector 版本若先后出过几个文档版本,
该目录始终放最新的那一版文档。

gh-pages 的布局:
  /vA.B.C/   每个 Collector 版本一份完整站点(A.B.C 为 Collector 版本)
  /dev/      dev 分支预览,内部布局与根目录相同(/dev/vA.B.C/、/dev/latest/、/dev/versions.json),
             版本列表独立,不进正式站的下拉框
  /latest/   与根目录一样,只放跳转桩,指向最新版本的同名页面
  /versions.json  Material 版本下拉框读取的列表

子命令:
  info <repo_dir>
      从 mkdocs.yml 页脚读文档版本号,到参考资料页的版本表里找这一行,取配套的 Collector 版本,
      输出 GitHub Actions 的 key=value 行(version=Collector 版本目录 / title / docs=文档版本)。
  publish <pages_dir> <version> <title>
      <pages_dir> 为 gh-pages 根目录或其中的 dev/;环境变量 SITE_PATH 是它对应的网址路径。
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
    docs = m.group(1)
    ref = open(os.path.join(repo, 'docs/common/reference.md'), encoding='utf-8').read()
    # 列序:文档版本 | lerobot | XR | Collector | SDK
    row = re.search(r'^\| ' + re.escape(docs) + r' \|(.*)\|\s*$', ref, re.M)
    if not row:
        sys.exit(f'docs/common/reference.md 的版本表里没有 {docs} 这一行')
    collector = row.group(1).split('|')[2].strip()
    if not re.fullmatch(r'\d+\.\d+\.\d+', collector):
        sys.exit(f'{docs} 一行的 Collector 版本不是 A.B.C 格式:{collector!r}')
    print(f'version=v{collector}')
    print(f'title=v{collector}')
    print(f'docs={docs}')


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
  // 预览站:dev/ 下不带版本前缀的旧地址转到 dev/latest/,由那里的跳转桩再转到最新预览版
  var dev = /^dev(\\/|$)/.test(rest);
  if (dev) rest = rest.replace(/^dev\\/?/, "");
  if (/^(v\\d+\\.\\d+\\.\\d+|latest|dev)(\\/|$)/.test(rest)) return;
  location.replace(base + (dev ? "dev/latest" : latest) + "/" + rest + location.search + location.hash);
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
