module.exports = function (eleventyConfig) {
  // Keep your images working
  eleventyConfig.addPassthroughCopy({ "blog/postImages": "blog/postImages" });

  // Blog collection from Netlify CMS folder
  eleventyConfig.addCollection("blog", (api) => {
    return api.getFilteredByGlob("blog/posts/**/*.md").sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: ".",
      includes: "blog/_includes",
      data: "blog/_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};
