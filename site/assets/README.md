# Shared frontend modules

Architecture Lab deliberately has **no framework, bundler, dependencies or backend**.

| File | Responsibility | Reuse |
| --- | --- | --- |
| `base.css` | Dark theme tokens, typography, navigation, common buttons | Every page |
| `style.css` | Catalog-specific layout | Homepage only |
| `lesson.css` | Reading layout, sidebar, code blocks, comparison tables, Q&A | Every lesson |
| `simulator.css` | Player toolbar, packet/host panels, status and event logs | Interactive labs |
| `concepts.js` | One entry per published concept, used to render catalog | Homepage data |
| `catalog.js` | Catalog rendering and search | Homepage only |
| `learning.js` | Answer reveal/collapse, code copy, active table of contents | Every lesson |
| `step-player.js` | Generic Play/Pause/Next/Replay/Speed engine | Any staged animation |

Per-lesson logic lives in `../labs/<slug>/simulator.js`. Only the visualization and timeline should vary between labs. The player does not know anything about networking, so it is reusable for DNS, TLS or load balancing.

**Guideline:** Prefer semantic HTML and browser-native `details` elements. Add shared components only when at least two lessons need them. Never duplicate global colors or event listeners in lesson files.
