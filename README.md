# Architecture Lab

Interactive and lightweight infrastructure diagrams, suitable for sharing as permanent GitHub Pages URLs in Notion.

## What is included?

- `site/index.html`: public catalog / homepage (with a concept search field).
- `site/assets/`: shared homepage CSS/JavaScript.
- `site/labs/tcp-vs-udp/index.html`: self-contained interactive lab (Play/Pause, step-by-step, packet loss, no packet loss, playback speed).
- `.github/workflows/pages.yml`: checks + automatic deployment to GitHub Pages on pushes to `main`.
- `tests/test_site.py`: ensures relative local links resolve and there are no remote dependencies.

Everything works as a static site without Node packages, a framework, database, or paid hosting. All links are relative and work under a GitHub Pages project prefix.

## First deployment (GitHub Pages)

1. Create a **public** repository named `architecture-lab` at https://github.com/new. Do **not** prepopulate it with a README, license, or `.gitignore`.
2. Unzip the project and open a terminal in the `architecture-lab` directory.
3. Run:

   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "feat: launch interactive architecture lab"
   git remote add origin https://github.com/YOUR_USERNAME/architecture-lab.git
   git push -u origin main
   ```

4. Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Open the **Actions** tab to check that the `Validate and deploy Architecture Lab` workflow succeeded. If the initial run failed because Pages wasn't enabled yet, rerun the workflow.
6. Site URL: `https://YOUR_USERNAME.github.io/architecture-lab/`.
7. Direct TCP vs UDP URL: `https://YOUR_USERNAME.github.io/architecture-lab/labs/tcp-vs-udp/`.
8. Copy the direct lab URL into Notion as a bookmark/link or try `/embed`. Embeds depend on Notion and website framing policies and cannot be guaranteed; a link always works.

> GitHub Free requires a public repository for Pages. Never put passwords, credentials or internal ESSEC architecture details in a public repo. Sites are public even if the repository is private on an eligible paid plan.

## Local development

Open `site/index.html` directly in a browser, or serve it locally using:

```bash
python3 -m http.server 8000 --directory site
# http://localhost:8000
```

Run tests:

```bash
python3 -m unittest discover -s tests -v
```

## Add a new interactive lab

1. Create `site/labs/<slug>/index.html` (self-contained HTML/CSS/JavaScript preferred; no remote dependencies).
2. Add an article/card to `site/index.html`, pointing to `./labs/<slug>/`.
3. Ensure the new lab links back to the homepage using `../../`.
4. Run `python3 -m unittest discover -s tests -v`.
5. Commit and push to `main`. GitHub Actions validates and publishes it automatically.

**Important:** Once a lab URL has been shared in Notion, keep its folder slug stable. Rename titles freely, but avoid renaming routes because existing links will break.

## Architecture decision

- **One repository / one GitHub Pages website:** easier maintenance and consistent public links, versus one repo per animation.
- **Static HTML/JS:** interactive, mobile-friendly, low maintenance, portable to other static hosts.
- **GitHub Actions:** changes go through Git and automated validations; no manual uploads.
- **No frameworks for V1:** avoids unnecessary toolchain complexity for a small number of standalone labs; evaluate Astro or Eleventy only if the catalog scales and content management becomes difficult.
