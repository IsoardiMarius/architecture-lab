"""Dependency-free checks for the GitHub Pages learning website."""
from html.parser import HTMLParser
from pathlib import Path
import re
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
        for shared in ['base.css', 'lesson.css', 'simulator.css', 'concepts.js', 'learning.js', 'step-player.js']:
            self.assertTrue((SITE / 'assets' / shared).is_file())

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

    def test_module_imports_resolve(self):
        for source in SITE.rglob('*.js'):
            text = source.read_text(encoding='utf-8')
            for path in re.findall(r'\bfrom\s+[\"\'](\.[^\"\']+)[\"\']', text):
                with self.subTest(source=source.relative_to(SITE), path=path):
                    self.assertTrue((source.parent / path).is_file(), f'Missing imported module: {path}')

    def test_shared_design_system_and_stable_urls(self):
        base = (SITE / 'assets/base.css').read_text(encoding='utf-8')
        self.assertIn('color-scheme: dark', base)
        self.assertIn('--bg:', base)
        self.assertTrue((SITE / 'labs/tcp-vs-udp/index.html').exists())
        for page in [SITE / 'index.html', SITE / 'labs/tcp-vs-udp/index.html']:
            content = page.read_text(encoding='utf-8')
            self.assertIn('assets/base.css', content)
            self.assertIn('<meta name="theme-color" content="#0b0f14">', content)
            self.assertNotIn('<script>', content, 'Shared JavaScript should not be inlined into lessons')
        registry = (SITE / 'assets/concepts.js').read_text(encoding='utf-8')
        self.assertIn("slug: 'tcp-vs-udp'", registry)
        self.assertTrue((SITE.parent / 'templates/lesson.html').exists())

    def test_buffers_lesson_and_cross_links(self):
        buffer_page = (SITE / 'labs/buffers/index.html').read_text(encoding='utf-8')
        tcp_page = (SITE / 'labs/tcp-vs-udp/index.html').read_text(encoding='utf-8')
        registry = (SITE / 'assets/concepts.js').read_text(encoding='utf-8')
        self.assertIn("slug: 'buffers'", registry)
        self.assertIn('id="buffer-demo"', buffer_page)
        self.assertIn('id="buffer-slots"', buffer_page)
        self.assertIn('../tcp-vs-udp/#buffers', buffer_page)
        self.assertIn('id="buffers"', tcp_page)
        self.assertIn('../buffers/', tcp_page)
        self.assertIn('0.75×</option>', tcp_page)
        buffer_refs = Refs()
        buffer_refs.feed(buffer_page)
        self.assertGreaterEqual(buffer_refs.questions, 7)
        self.assertTrue((SITE / 'assets/diagrams.css').is_file())
        self.assertTrue((SITE / 'labs/buffers/demo.js').is_file())

    def test_lesson_structure_and_questions(self):
        content = (SITE / 'labs/tcp-vs-udp/index.html').read_text(encoding='utf-8')
        refs = Refs()
        refs.feed(content)
        for anchor in ['tcp', 'udp', 'comparison', 'simulation', 'decisions', 'questions', 'takeaways']:
            self.assertIn(anchor, refs.ids)
        self.assertGreaterEqual(refs.questions, 9)
        for control in ['loss', 'normal', 'speed', 'play', 'next', 'reset', 'phase', 'count']:
            self.assertIn(control, refs.ids)

    def test_default_simulation_speed(self):
        lesson = (SITE / 'labs/tcp-vs-udp/index.html').read_text(encoding='utf-8')
        self.assertIn('<option value="2667" selected>0.75×</option>', lesson)
        self.assertIn('<option value="2000">1×</option>', lesson)

    def test_beginner_first_explanations(self):
        buffers = (SITE / 'labs/buffers/index.html').read_text(encoding='utf-8')
        tcp = (SITE / 'labs/tcp-vs-udp/index.html').read_text(encoding='utf-8')
        self.assertIn('<dl class="term-list">', buffers)
        for term in ('<dt>Data</dt>', '<dt>Memory (RAM)</dt>', '<dt>Producer</dt>',
                     '<dt>Consumer</dt>', '<dt>Capacity</dt>', '<dt>Queue / FIFO</dt>'):
            self.assertIn(term, buffers)
        self.assertEqual(buffers.count('data-real-example'), 3)
        self.assertIn('Backpressure', buffers)
        self.assertIn('Limit of this simulation', buffers)
        self.assertIn('operating system', buffers)
        self.assertIn('<dt>ACK (acknowledgment)</dt>', tcp)
        self.assertIn('<dt>Segment</dt>', tcp)
        self.assertIn('Head-of-Line Blocking', tcp)
        self.assertIn('id="buffer-demo"', buffers)
        self.assertIn('<option value="2667" selected>0.75×</option>', tcp)


if __name__ == '__main__':
    unittest.main()
