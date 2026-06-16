import { execSync } from "node:child_process";
import fs from "node:fs";
import { RepoTools } from "./lib/repo-tools.mjs";
import { runEditAgent } from "./lib/anthropic-agent.mjs";
import { createPR } from "./lib/github.mjs";
import { sendEmail } from "./lib/email.mjs";

const repoRoot = process.cwd();
const REPO = process.env.GITHUB_REPOSITORY; // owner/name
const TOKEN = process.env.GITHUB_TOKEN;
const BASE = process.env.BASE_BRANCH || "main";

const email = {
  from: process.env.EMAIL_FROM || "unknown",
  subject: process.env.EMAIL_SUBJECT || "(no subject)",
  body: process.env.EMAIL_BODY || "",
};
const requestId = (process.env.REQUEST_ID || `${Date.now()}`).replace(/[^a-z0-9]/gi, "").slice(0, 8);
const branch = `lmh-update/${requestId}`;

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: repoRoot, encoding: "utf8" });
}

function setOutput(key, val) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${val}\n`);
}

async function ownerEmail(subject, text) {
  if (!process.env.SENDGRID_API_KEY || !process.env.OWNER_EMAIL) return;
  await sendEmail({
    to: process.env.OWNER_EMAIL,
    from: process.env.FROM_EMAIL,
    subject,
    text,
    apiKey: process.env.SENDGRID_API_KEY,
  });
}

async function main() {
  git(`config user.name "LMH update agent"`);
  git(`config user.email "${process.env.FROM_EMAIL || "updates@lmhweb.solutions"}"`);
  git(`checkout -b ${branch}`);

  const repo = new RepoTools(repoRoot);
  const result = await runEditAgent(repo, email);

  git("add -A");
  const dirty = git("status --porcelain").trim();

  if (!dirty) {
    setOutput("created", "false");
    fs.mkdirSync(".lmh", { recursive: true });
    fs.writeFileSync(".lmh/result.json", JSON.stringify({ created: false, ...result }, null, 2));
    await ownerEmail(
      `Could not auto-apply update from ${email.from}`,
      `The agent did not make any changes for this request.\n\nFrom: ${email.from}\nSubject: ${email.subject}\n\nAgent note: ${result.summary}\n\nNo pull request was opened.`
    );
    console.log("No changes produced. Owner notified.");
    return;
  }

  const title = `Update: ${email.subject}`.slice(0, 100);
  git(`commit -m ${JSON.stringify(title)} -m ${JSON.stringify("Requested by " + email.from)}`);
  const headSha = git("rev-parse HEAD").trim();
  git(`push origin HEAD:${branch}`);

  const pr = await createPR(TOKEN, REPO, {
    title,
    head: branch,
    base: BASE,
    body: `Automated change requested by ${email.from}.\n\n**Request**\n> ${email.subject}\n\n**What the agent did**\n${result.summary}\n\nFiles changed:\n${result.changedFiles.map((f) => `- \`${f}\``).join("\n")}\n\n_Awaiting Lighthouse checks and owner approval._`,
  });

  fs.mkdirSync(".lmh", { recursive: true });
  fs.writeFileSync(
    ".lmh/result.json",
    JSON.stringify(
      {
        created: true,
        repo: REPO,
        prNumber: pr.number,
        branch,
        headSha,
        summary: result.summary,
        fulfilled: result.fulfilled,
        changedFiles: result.changedFiles,
        from: email.from,
        subject: email.subject,
      },
      null,
      2
    )
  );
  setOutput("created", "true");
  console.log(`Opened PR #${pr.number} on branch ${branch}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
