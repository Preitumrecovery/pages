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
  eleventyConfig.addPassthroughCopy("logo.avif");
  eleventyConfig.addPassthroughCopy("padlock.avif");
  eleventyConfig.addPassthroughCopy("blockShield.avif");

  // If you use GitHub Pages + custom domain
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy(".nojekyll");

  // (Optional) do it in one line instead of the individual ones above:
  // eleventyConfig.addPassthroughCopy({ "./*.{css,avif,png,jpg,svg,webp}": "/" });

  // Blog collection
  eleventyConfig.addCollection("blog", (api) =>
    api.getFilteredByGlob("blog/posts/**/*.md").sort((a, b) => b.date - a.date)
  );

  // Nunjucks date filters
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
