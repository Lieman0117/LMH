// Netlify builds a deploy preview automatically when the PR is opened (deploy
// previews must be enabled on the site). We poll the API for the deploy whose
// commit_ref matches our pushed head SHA and wait until it is ready.

export async function waitForPreview({ siteId, token, sha, timeoutMs = 8 * 60 * 1000 }) {
  const deadline = Date.now() + timeoutMs;
  const headers = { Authorization: `Bearer ${token}`, "User-Agent": "lmh-update-agent" };

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys?per_page=30`,
      { headers }
    );
    if (res.ok) {
      const deploys = await res.json();
      const match = deploys.find(
        (d) => d.commit_ref === sha || (d.commit_ref && sha.startsWith(d.commit_ref))
      );
      if (match) {
        if (match.state === "ready") {
          return { url: match.deploy_ssl_url || match.deploy_url || match.links?.permalink, deploy: match };
        }
        if (match.state === "error") {
          throw new Error(`Netlify build failed for ${sha}`);
        }
      }
    }
    await sleep(10000);
  }
  throw new Error("Timed out waiting for the Netlify deploy preview.");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
