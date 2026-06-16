import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// The agent may only touch content, styling, images, and pages. Everything that
// affects how the site builds or behaves (config, build files, CMS auth, CI, deps)
// is off limits. A write outside this allowlist throws before anything is changed.
const ALLOW = [
  "src/content/",
  "src/_includes/sections/",
  "src/_includes/components/",
  "src/assets/less/",
  "src/assets/images/",
  "src/assets/svgs/",
];
const ALLOW_FILES = ["src/_data/client.js", "src/index.html"];

const BLOCK_HINTS = [
  ".eleventy.js",
  "package.json",
  "package-lock.json",
  "netlify.toml",
  ".github/",
  "agent/",
  "src/admin/",
  "src/config/",
  "scripts/",
];

export class RepoTools {
  constructor(root) {
    this.root = root;
    this.changed = new Set();
  }

  resolve(rel) {
    const abs = path.resolve(this.root, rel);
    if (abs !== this.root && !abs.startsWith(this.root + path.sep)) {
      throw new Error(`path escapes repo: ${rel}`);
    }
    return abs;
  }

  relOf(rel) {
    return path.relative(this.root, this.resolve(rel)).split(path.sep).join("/");
  }

  assertWritable(rel) {
    const r = this.relOf(rel);
    if (BLOCK_HINTS.some((b) => r === b || r.startsWith(b))) {
      throw new Error(`not allowed to modify: ${r}`);
    }
    const ok = ALLOW.some((p) => r.startsWith(p)) || ALLOW_FILES.includes(r);
    if (!ok) throw new Error(`outside the editable area: ${r}`);
    return r;
  }

  listDir(rel = "src") {
    const abs = this.resolve(rel);
    if (!fs.existsSync(abs)) return `(missing) ${rel}`;
    return fs
      .readdirSync(abs, { withFileTypes: true })
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .sort()
      .join("\n");
  }

  readFile(rel) {
    const abs = this.resolve(rel);
    if (!fs.existsSync(abs)) return `(not found) ${rel}`;
    return fs.readFileSync(abs, "utf8");
  }

  writeFile(rel, content) {
    const r = this.assertWritable(rel);
    const abs = this.resolve(rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
    this.changed.add(r);
    return `wrote ${r} (${content.length} chars)`;
  }

  deleteFile(rel) {
    const r = this.assertWritable(rel);
    const abs = this.resolve(rel);
    if (fs.existsSync(abs)) fs.rmSync(abs);
    this.changed.add(r);
    return `deleted ${r}`;
  }

  // Use the kit's own scaffolder so new pages are structurally identical to the rest.
  createPage(name) {
    const safe = String(name).replace(/["`$\\]/g, "").trim();
    if (!safe) throw new Error("empty page name");
    const out = execFileSync("npm", ["run", "create-page", "--", safe], {
      cwd: this.root,
      encoding: "utf8",
    });
    const slug = safe.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    this.changed.add(`src/content/pages/${slug}.html`);
    this.changed.add(`src/assets/less/${slug}.less`);
    return `${out.trim()}\nScaffolded slug "${slug}". Now edit src/content/pages/${slug}.html and src/assets/less/${slug}.less.`;
  }

  changedFiles() {
    return [...this.changed];
  }
}
