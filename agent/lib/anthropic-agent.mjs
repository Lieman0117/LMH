import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.AGENT_MODEL || "claude-sonnet-4-6";
const MAX_STEPS = Number(process.env.AGENT_MAX_STEPS || 24);

const TOOLS = [
  {
    name: "list_dir",
    description: "List the entries in a directory (relative to repo root). Start with 'src'.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "read_file",
    description: "Read a file's full contents (relative to repo root).",
    input_schema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Create or overwrite a file with new full contents. Only content, sections, components, LESS, images metadata, client.js, and index.html are writable.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string" }, content: { type: "string" } },
      required: ["path", "content"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a page or asset that the request asks to remove.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "create_page",
    description:
      "Scaffold a brand-new page using the kit's own generator so it matches every other page. Pass a human page name, e.g. 'Pricing'. Then edit the generated HTML/LESS with write_file.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "finish",
    description:
      "Call when the requested change is complete, or when the request cannot be fulfilled within the allowed scope. Provide a short plain-English summary for the site owner.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        fulfilled: { type: "boolean" },
      },
      required: ["summary", "fulfilled"],
    },
  },
];

function systemPrompt() {
  return `You maintain client websites built on the CodeStitch Intermediate 11ty kit (Eleventy + Nunjucks templates + LESS). A client has emailed a change request. Make exactly the change they asked for, nothing more.

Repository layout:
- src/_data/client.js — single source of truth for business name, phone, email, address, socials. Prefer editing this for contact-detail changes; it propagates everywhere.
- src/content/pages/*.html — individual pages. Each begins with front matter (title, description, permalink) then {% extends "layouts/base.html" %} with {% block body %}.
- src/index.html — the home page; treat like any page.
- src/_includes/sections/*.html — shared header, footer, CTA used on every page.
- src/_includes/components/*.html — small reusable pieces.
- src/assets/less/*.less — styling. root.less holds the :root design tokens (colors, spacing). Per-page styles live in matching files, e.g. about.less.
- src/assets/images/ , src/assets/svgs/ — media, referenced via the {% getUrl %} shortcode.

Rules:
- Allowed: text/copy edits, swapping or adding images, styling/layout tweaks, adding or removing whole pages.
- Forbidden: anything functional — never touch .eleventy.js, package.json, netlify.toml, src/config, src/admin, scripts, or JS behavior. The tools will block these; do not fight them.
- To ADD a page, always call create_page first (never hand-write a new page file), then fill the generated HTML and LESS. This guarantees the new page's <head>, layout, title, and permalink match the rest of the site.
- Match the existing markup and class conventions of sibling files. Read a similar file before writing a new one.
- Keep colors and spacing consistent by reusing the existing CSS variables in root.less rather than hardcoding values.
- If the request is ambiguous, unsafe, or outside the allowed scope, do the part you safely can and explain the rest in the finish summary with fulfilled:false.
- Be efficient: read only what you need, then make the edits, then call finish.`;
}

export async function runEditAgent(repo, email) {
  const client = new Anthropic();
  const messages = [
    {
      role: "user",
      content: `Change request received by email.

From: ${email.from}
Subject: ${email.subject}

${email.body}

---
Top of repo (src):
${repo.listDir("src")}

src/content/pages:
${repo.listDir("src/content/pages")}

Begin. Read what you need, make the change, then call finish.`,
    },
  ];

  let result = { summary: "No action taken.", fulfilled: false };

  for (let step = 0; step < MAX_STEPS; step++) {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt(),
      tools: TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: resp.content });

    const toolUses = resp.content.filter((b) => b.type === "tool_use");
    if (toolUses.length === 0) break;

    const toolResults = [];
    let finished = false;

    for (const tu of toolUses) {
      let out;
      let isError = false;
      try {
        out = runTool(repo, tu.name, tu.input);
        if (tu.name === "finish") {
          result = { summary: tu.input.summary, fulfilled: !!tu.input.fulfilled };
          finished = true;
        }
      } catch (e) {
        out = `error: ${e.message}`;
        isError = true;
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: String(out),
        is_error: isError,
      });
    }

    messages.push({ role: "user", content: toolResults });
    if (finished) break;
  }

  return { ...result, changedFiles: repo.changedFiles() };
}

function runTool(repo, name, input) {
  switch (name) {
    case "list_dir":
      return repo.listDir(input.path);
    case "read_file":
      return repo.readFile(input.path);
    case "write_file":
      return repo.writeFile(input.path, input.content);
    case "delete_file":
      return repo.deleteFile(input.path);
    case "create_page":
      return repo.createPage(input.name);
    case "finish":
      return "ok";
    default:
      throw new Error(`unknown tool ${name}`);
  }
}
