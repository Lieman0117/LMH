import { verifyToken } from "./lib/token.mjs";
import { getPR, mergePR, closePR } from "./lib/github.mjs";
import { sendEmail } from "./lib/email.mjs";

const TOKEN = process.env.GITHUB_TOKEN;
const token = process.env.APPROVAL_TOKEN;
const decision = (process.env.DECISION || "").toLowerCase();

async function confirm(subject, text) {
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
  const payload = verifyToken(token, process.env.APPROVAL_SECRET);
  if (!payload) throw new Error("invalid or expired approval token");

  const repo = payload.r;
  const prNumber = payload.p;
  const pr = await getPR(TOKEN, repo, prNumber);

  if (pr.merged) {
    console.log("PR already merged; nothing to do.");
    return;
  }
  if (pr.state !== "open") {
    console.log(`PR #${prNumber} is ${pr.state}; nothing to do.`);
    return;
  }

  // Guard against approving a stale preview: the PR head must still match the token.
  if (!pr.head.sha.startsWith(payload.s)) {
    await confirm(
      `Change for PR #${prNumber} has moved on`,
      `The branch changed since the approval email was sent, so nothing was published. Please re-review the latest preview.`
    );
    return;
  }

  if (decision === "approve") {
    await mergePR(TOKEN, repo, prNumber, pr.head.sha);
    await confirm(
      `Published: PR #${prNumber}`,
      `Approved and merged to ${pr.base.ref}. Netlify is deploying it to production now.\n\n${pr.html_url}`
    );
    console.log(`Merged PR #${prNumber}.`);
  } else {
    await closePR(TOKEN, repo, prNumber, pr.head.ref);
    await confirm(
      `Discarded: PR #${prNumber}`,
      `Rejected. The pull request was closed and its branch deleted. Nothing was published.\n\n${pr.html_url}`
    );
    console.log(`Closed PR #${prNumber}.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
