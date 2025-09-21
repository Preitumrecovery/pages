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
    if (
      event.headers["content-type"]?.includes("application/json") ||
      event.headers["Content-Type"]?.includes("application/json")
    ) {
      body = JSON.parse(event.body || "{}");
    } else {
      body = qs.parse(event.body || "");
    }
  } catch (e) {
    return { statusCode: 400, body: "Bad request body" };
  }

  const {
    slug: postSlug,       // from the form
    name,
    message,
    hp,                   // honeypot
    redirect,             // optional redirect back to the post
  } = body;

  if (hp) return { statusCode: 200, body: "OK" }; // bot caught
  if (!postSlug || !name || !message) {
    return { statusCode: 400, body: "Missing fields" };
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
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = (name || "anon").replace(/[^a-z0-9-_ ]/gi, "").trim() || "anon";
    const filePath = `blog/comments/${postSlug}/${now}-${safeName}.md`;

    const md = `---
post: "${postSlug}"
name: "${safeName}"
date: "${new Date().toISOString()}"
published: true
permalink: false
eleventyExcludeFromCollections: false
---
${String(message || "").trim()}
`;

    // Get base sha
    const { data: ref } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BRANCH}`,
    });

    if (CREATE_PR === "true") {
      const branchName = `comment/${postSlug}/${now}`;
      await octokit.git.createRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      });

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        message: `chore: add comment on ${postSlug}`,
        content: Buffer.from(md, "utf8").toString("base64"),
        branch: branchName,
      });

      await octokit.pulls.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: `New comment on ${postSlug} by ${safeName}`,
        head: branchName,
        base: BRANCH,
        body: "Approve/merge to publish this comment.",
      });
    } else {
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        message: `chore: add comment on ${postSlug}`,
        content: Buffer.from(md, "utf8").toString("base64"),
        branch: BRANCH,
      });
    }

    // If the form passed a redirect, send the user back
    if (redirect) {
      return {
        statusCode: 303,
        headers: { Location: redirect },
        body: "",
      };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
};
