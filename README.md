# Architecture Lab

A small, dark-mode, static learning library for infrastructure, networking and cloud architecture, hosted with GitHub Pages. Each lesson combines clear technical content, interactive demonstrations, architecture choices and active-recall questions.

**Live site:** https://isoardimarius.github.io/architecture-lab/

## Design principles

- **Dark by default**, minimal contrast-safe design, responsive layout.
- **Reusable components**, not copy-pasted styles or interaction handlers.
- **No dependencies or build step:** plain HTML, CSS and native ES modules.
- **Stable URLs** so links from Notion keep working.
- **Progressively extensible:** new concepts are registered in one small file.

## Structure

```text
site/
  index.html                   # Library homepage
  assets/
    base.css                   # Shared dark theme and layout tokens
    style.css                  # Homepage-only styles
    lesson.css                 # Reusable lesson components
    simulator.css              # Reusable network simulation visuals
    concepts.js                # Catalog metadata for each concept
    catalog.js                 # Search and rendering
    learning.js                # Copy code, Q&A reveal, active TOC
    step-player.js             # Shared animation playback controller
    diagrams.css               # Reusable buffer and flow diagrams
  labs/
    tcp-vs-udp/
      index.html               # TCP/UDP guide, comparison, exercises
      simulator.js             # TCP/UDP scenario data + rendering
    buffers/
      index.html               # Fundamentals, visual examples, questions
      demo.js                  # Interactive bounded-buffer experiment
templates/lesson.html         # Starting point for new lessons
tests/test_site.py            # Site consistency, links, dependency checks
.github/workflows/pages.yml  # Validation + GitHub Pages deployment
```

See [`site/assets/README.md`](site/assets/README.md) for component responsibilities.

## Add a concept

1. Copy `templates/lesson.html` to `site/labs/<slug>/index.html`.
2. Write the lesson using shared structures in `lesson.css` (`.section`, `.codebox`, `.compare`, `.qa`).
3. If interactive, include `../../assets/simulator.css`, create a local `simulator.js`, and import `createStepPlayer` from `../../assets/step-player.js`.
4. Add **one** entry to `site/assets/concepts.js`. The homepage builds cards/search automatically.
5. Run the tests locally, then push to `main`. The Actions workflow deploys to Pages.

Keep an existing `<slug>` unchanged after sharing the link in Notion. Refer to authoritative standards/RFCs for protocol details and state the limits of any analogy or simulation.

## Run locally

```bash
python3 -m http.server 8000 --directory site
# visit http://localhost:8000/
python3 -m unittest discover -s tests -v
find site -name '*.js' -exec node --check {} \;
```

Opening the HTML via `file://` does not support the same module-loading behavior as a web server. Use the server command above.

## Hosting and safety

The site is public, works under the GitHub Pages project path `/architecture-lab/`, and has no third-party runtime dependencies or tracking. Do not publish internal configurations, credentials or private infrastructure details.

## Buffer lessons

- [Buffers — fundamentals](https://isoardimarius.github.io/architecture-lab/labs/buffers/): producer / buffer / consumer, capacity, backpressure, interactive exercise.
- [TCP vs UDP — buffering](https://isoardimarius.github.io/architecture-lab/labs/tcp-vs-udp/#buffers): TCP send/receive buffers, out-of-order reassembly, and Head-of-Line Blocking.

The visual diagram components live in `site/assets/diagrams.css` and can be reused for future concepts.
