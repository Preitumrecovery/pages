// netlify/functions/add-comment.js
const { Octokit } = require("@octokit/rest");
const qs = require("querystring");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse JSON or x-www-form-urlencoded
  let body = {};
  try {
    const ct = event.headers["content-type"] || event.headers["Content-Type"] || "";
    if (ct.includes("application/json")) {
      body = JSON.parse(event.body || "{}");
    } else {
      body = qs.parse(event.body || "");
    }
  } catch {
    return { statusCode: 400, body: "Bad request body" };
  }

  // Incoming fields (from your post.njk form)
  const {
    slug: rawSlug,      // required: page.fileSlug
    name: rawName,      // required
    email: rawEmail,    // optional
    message: rawMsg,    // required
    hp,                 // honeypot
    redirect,           // optional: where to send user back
  } = body;

  // Honeypot kills bots silently
  if (hp) return { statusCode: 200, body: "OK" };

  // Minimal sanitize
  const safe = (s) => String(s || "").replace(/^---$/gm, "").replace(/\r/g, "");
  const slug = safe(rawSlug || "").trim().toLowerCase();
  const name = (safe(rawName || "Anonymous").replace(/[^a-z0-9-_ .]/gi, "").trim()) || "Anonymous";
  const email = safe(rawEmail || "").trim();
  const message = safe(rawMsg || "").trim();

  if (!slug || !name || !message) {
    return { statusCode: 400, body: "Missing fields: slug, name, and message are required." };
  }

  const {
    GITHUB_TOKEN,
    REPO_OWNER,
    REPO_NAME,
    BRANCH = "main",
    CREATE_PR = "true",
  } = process.env;

  if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    return { statusCode: 500, body: "Server not configured" };
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const nowISO = new Date().toISOString();
    const nowForFile = nowISO.replace(/[:.]/g, "-"); // safe for filenames
    const fileSafeName = (name || "anon").toLowerCase().replace(/[^a-z0-9-_]+/gi, "-").slice(0, 40) || "anon";

    // blog/comments/<post>/<date>-<name>.md
    const path = `blog/comments/${slug}/${nowForFile}-${fileSafeName}.md`;

    // Moderation behavior:
    // - PR mode (CREATE_PR="true"): approved false by default (not live until merge)
    // - Direct commit (CREATE_PR="false"): approved true by default (live immediately)
    const prMode = String(CREATE_PR).toLowerCase() === "true";
    const approved = !prMode;

    const frontMatterLines = [
      `post: "${slug}"`,
      `name: "${name}"`,
      email ? `email: "${email}"` : null,
      `date: "${nowISO}"`,
      `approved: ${approved}`,
    ].filter(Boolean);

    const md = `---
${frontMatterLines.join("\n")}
---

${message}
`;

    // Get base branch SHA
    const { data: ref } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BRANCH}`,
    });

    if (prMode) {
      const branchName = `comment/${slug}/${nowForFile}`;
      // Create branch from base
      await octokit.git.createRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      });
      // Commit file on new branch
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
        message: `chore: add comment on ${slug}`,
        content: Buffer.from(md, "utf8").toString("base64"),
        branch: branchName,
      });
      // Open PR for moderation
      await octokit.pulls.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: `New comment on ${slug} by ${name}`,
        head: branchName,
        base: BRANCH,
        body: `New comment submitted for **${slug}**.\n\n- **Name:** ${name}\n- **Email:** ${email || "(none)"}\n\nApprove by merging this PR or set \`approved: true\` in CMS.`,
      });
    } else {
      // Direct commit to main (shows immediately with your non-strict filter)
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
        message: `chore: add comment on ${slug}`,
        content: Buffer.from(md, "utf8").toString("base64"),
        branch: BRANCH,
      });
    }

    // Redirect back to post (thanks banner) or return JSON
    if (redirect) {
      return { statusCode: 303, headers: { Location: redirect }, body: "" };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
};
