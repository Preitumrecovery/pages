const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // Make the CMS app and its config available at /admin/
  eleventyConfig.addPassthroughCopy("admin");

  // Keep your blog images working
  eleventyConfig.addPassthroughCopy({ "blog/postImages": "blog/postImages" });

  // (Optional) root stylesheet
  eleventyConfig.addPassthroughCopy("styles.css");

  // (Optional) passthrough common static assets anywhere in the project
  eleventyConfig.addPassthroughCopy({ "**/*.{png,avif,svg,webp,ico}": true });

  // Blog collection from Netlify CMS folder
  eleventyConfig.addCollection("blog", (api) => {
    return api.getFilteredByGlob("blog/posts/**/*.md").sort((a, b) => b.date - a.date);
  });

  // ---- Nunjucks date filters ----
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
    return DateTime.fromJSDate(d, { zone: "utc" }).toISODate(); // e.g., 2025-05-17
  });
  // --------------------------------

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
