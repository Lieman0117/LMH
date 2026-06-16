const API = "https://api.github.com";

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "lmh-update-agent",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function gh(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`GitHub ${method} ${path} -> ${res.status}: ${data.message || text}`);
  }
  return data;
}

export function createPR(token, repo, { title, head, base, body }) {
  return gh(token, "POST", `/repos/${repo}/pulls`, { title, head, base, body });
}

export function mergePR(token, repo, number, sha) {
  return gh(token, "PUT", `/repos/${repo}/pulls/${number}/merge`, {
    merge_method: "squash",
    sha,
  });
}

export async function closePR(token, repo, number, branch) {
  await gh(token, "PATCH", `/repos/${repo}/pulls/${number}`, { state: "closed" });
  if (branch) {
    try {
      await gh(token, "DELETE", `/repos/${repo}/git/refs/heads/${branch}`);
    } catch {
      /* branch may already be gone */
    }
  }
}

export function getPR(token, repo, number) {
  return gh(token, "GET", `/repos/${repo}/pulls/${number}`);
}
