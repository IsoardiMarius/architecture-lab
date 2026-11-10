"""Dependency-free checks for the GitHub Pages learning website."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import unittest

SITE = Path(__file__).resolve().parents[1] / 'site'


class Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = []
        self.questions = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'details' and 'qa' in attrs.get('class', '').split():
            self.questions += 1
        if tag in {'a', 'link', 'script', 'img'}:
            url = attrs.get('href') or attrs.get('src')
            if url:
                self.links.append((tag, url, attrs))


class WebsiteTests(unittest.TestCase):
    def test_home_and_lab_exist(self):
        self.assertTrue((SITE / 'index.html').is_file())
        self.assertTrue((SITE / 'labs/tcp-vs-udp/index.html').is_file())
        self.assertTrue((SITE / 'assets/lesson.css').is_file())

    def test_local_links_and_anchors_resolve(self):
        for source in SITE.rglob('*.html'):
            with self.subTest(source=source.relative_to(SITE)):
                refs = Refs()
                refs.feed(source.read_text(encoding='utf-8'))
                self.assertEqual(len(refs.ids), len(set(refs.ids)), 'Duplicated HTML ids')
                for tag, url, _ in refs.links:
                    target = urlsplit(url)
                    if target.scheme or target.netloc or url.startswith('//'):
                        continue
                    if not target.path:
                        if target.fragment:
                            self.assertIn(target.fragment, refs.ids, f'Broken anchor in {source}: {url}')
                        continue
                    self.assertFalse(target.path.startswith('/'), f'Root path breaks Pages: {url}')
                    resolved = (source.parent / target.path).resolve()
                    self.assertTrue(resolved.is_relative_to(SITE.resolve()), f'Link escapes website: {url}')
                    self.assertTrue(resolved.is_file() or (resolved / 'index.html').is_file(),
                                    f'Broken link: {source}: {url}')

    def test_no_remote_code_dependencies(self):
        for source in SITE.rglob('*.html'):
            refs = Refs()
            refs.feed(source.read_text(encoding='utf-8'))
            for tag, url, attrs in refs.links:
                if tag == 'a':
                    if attrs.get('target') == '_blank':
                        self.assertIn('noopener', attrs.get('rel', ''))
                    continue  # Primary-source reference links are welcome.
                self.assertFalse(url.startswith(('http:', 'https:', '//')),
                                 f'Remote script, image or stylesheet: {source}: {url}')

    def test_lesson_structure_and_questions(self):
        content = (SITE / 'labs/tcp-vs-udp/index.html').read_text(encoding='utf-8')
        refs = Refs()
        refs.feed(content)
        for anchor in ['tcp', 'udp', 'comparison', 'simulation', 'decisions', 'questions', 'takeaways']:
            self.assertIn(anchor, refs.ids)
        self.assertGreaterEqual(refs.questions, 9)
        for control in ['loss', 'normal', 'speed', 'play', 'next', 'reset', 'phase', 'count']:
            self.assertIn(control, refs.ids)


if __name__ == '__main__':
    unittest.main()
