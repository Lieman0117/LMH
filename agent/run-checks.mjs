import fs from "node:fs";
import { execSync } from "node:child_process";
import { waitForPreview } from "./lib/netlify.mjs";
import { runLighthouse } from "./lib/lighthouse-check.mjs";
import { signToken } from "./lib/token.mjs";
import { sendEmail } from "./lib/email.mjs";

const r = JSON.parse(fs.readFileSync(".lmh/result.json", "utf8"));

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf8" });
  } catch {
    return "";
  }
}

async function main() {
  const preview = await waitForPreview({
    siteId: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
    sha: r.headSha,
  });

  let lh = { pass: true, scores: {}, failures: [] };
  try {
    lh = await runLighthouse(preview.url);
  } catch (e) {
    lh = { pass: false, scores: {}, failures: [`Lighthouse error: ${e.message}`] };
  }

  // Approval token: encodes which repo + PR the owner is approving, plus expiry.
  const token = signToken(
    { r: r.repo, p: r.prNumber, s: r.headSha.slice(0, 7), e: Date.now() + 7 * 864e5 },
    process.env.APPROVAL_SECRET
  );

  const verdict = lh.pass ? "" : "⚠️ Note: site performance dipped on preview — worth a check.\n\n";

  const subject = `Review change for ${r.from} — reply approve/reject [tok:${token}]`;
  const text = [
    `A site update is ready for your review.`,
    ``,
    `Requested by: ${r.from}`,
    `Their request: ${r.subject}`,
    ``,
    `What was changed:`,
    r.summary,
    ``,
    `${verdict}Preview the change here:`,
    preview.url,
    ``,
    `------------------------------------------------------------`,
    `Reply APPROVE to publish it live.`,
    `Reply REJECT to discard it.`,
    `(Keep the [tok:...] tag in the subject line.)`,
  ].join("\n");

  await sendEmail({
    to: process.env.OWNER_EMAIL,
    from: process.env.FROM_EMAIL,
    replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
    subject,
    text,
    apiKey: process.env.SENDGRID_API_KEY,
  });

  console.log(`Approval email sent. Preview ${preview.url}. Lighthouse ${verdict}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
