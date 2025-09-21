// .eleventy.js
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // ─── Passthroughs ─────────────────────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({ "blog/postImages": "blog/postImages" });

  // Root assets referenced with absolute paths (/...)
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("solution.css");
  eleventyConfig.addPassthroughCopy("company.css");
  eleventyConfig.addPassthroughCopy("blog.css");

  // Catch-all for root images (Bitcoin.avif, invest.avif, globe.avif, etc.)
  eleventyConfig.addPassthroughCopy({ "./*.{avif,png,jpg,jpeg,svg,webp,ico}": "/" });

  // If present (for GitHub Pages + custom domain)
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy(".nojekyll");

  // ─── Collections ──────────────────────────────────────────────────────────────
  eleventyConfig.addCollection("blog", (api) =>
    api.getFilteredByGlob("blog/posts/**/*.md").sort((a, b) => b.date - a.date)
  );

  // Each comment is a Markdown file with front matter in blog/comments/**/*
  eleventyConfig.addCollection("comments", (api) =>
    api.getFilteredByGlob("blog/comments/**/*.md")
  );

  // ─── Filters ──────────────────────────────────────────────────────────────────
  eleventyConfig.addFilter("date", (value, fmt = "yyyy-LL-dd") => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d)) return "";
    return DateTime.fromJSDate(d, { zone: "utc" }).toFormat(fmt);
  });

  eleventyConfig.addFilter("iso", (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d)) return "";
    return DateTime.fromJSDate(d, { zone: "utc" }).toISODate();
  });

  // Filter to grab comments for a given post slug
  eleventyConfig.addFilter("commentsFor", (allComments, slug) => {
    const key = (slug || "").toLowerCase();
    return (allComments || [])
      .filter((c) => ((c.data?.post || "").toLowerCase() === key)) // ← use "post", not "slug"
      .sort((a, b) => new Date(a.data?.date) - new Date(b.data?.date));
  });

  // ─── Directories / Engines ────────────────────────────────────────────────────
  return {
    dir: {
      input: ".",
      includes: "blog/_includes",
      data: "blog/_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
};
