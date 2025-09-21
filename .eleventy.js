// .eleventy.js
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // CMS + images
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({ "blog/postImages": "blog/postImages" });

  // Root assets you reference with /... in HTML
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("solution.css");
  eleventyConfig.addPassthroughCopy("company.css");

  // ✅ Catch-all for all root images (Bitcoin.avif, invest.avif, globe.avif, etc.)
  eleventyConfig.addPassthroughCopy({ "./*.{avif,png,jpg,jpeg,svg,webp,ico}": "/" });

  // If you use GitHub Pages + custom domain
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy(".nojekyll");

  // Blog collection
  eleventyConfig.addCollection("blog", (api) =>
    api.getFilteredByGlob("blog/posts/**/*.md").sort((a, b) => b.date - a.date)
  );

  // Filters (unchanged)
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

  return {
    dir: { input: ".", includes: "blog/_includes", data: "blog/_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
};
