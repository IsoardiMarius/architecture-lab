"""Small dependency-free checks for the published static website."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import unittest

SITE = Path(__file__).resolve().parents[1] / 'site'

class Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag in {'a', 'link', 'script', 'img'}:
            url=attrs.get('href') or attrs.get('src')
            if url:
                self.links.append(url)

class WebsiteTests(unittest.TestCase):
    def test_home_and_lab_exist(self):
        self.assertTrue((SITE/'index.html').is_file())
        self.assertTrue((SITE/'labs/tcp-vs-udp/index.html').is_file())

    def test_local_links_resolve(self):
        for source in SITE.rglob('*.html'):
            with self.subTest(source=source.relative_to(SITE)):
                refs=Refs(); refs.feed(source.read_text(encoding='utf-8'))
                for url in refs.links:
                    target=urlsplit(url)
                    if not target.path or target.scheme or target.netloc or url.startswith('//'):
                        continue
                    if target.path.startswith('/'):
                        self.fail(f'Absolute root path breaks project Pages: {source}: {url}')
                    resolved=(source.parent/target.path).resolve()
                    self.assertTrue(resolved.is_relative_to(SITE.resolve()),f'Link escapes website: {url}')
                    self.assertTrue(resolved.is_file() or (resolved/'index.html').is_file(),f'Broken link: {source}: {url}')

    def test_no_remote_dependencies(self):
        for source in SITE.rglob('*.html'):
            refs=Refs(); refs.feed(source.read_text(encoding='utf-8'))
            for url in refs.links:
                self.assertFalse(url.startswith('http:') or url.startswith('https:') or url.startswith('//'),f'Unexpected remote dependency: {url}')

if __name__=='__main__':
    unittest.main()
