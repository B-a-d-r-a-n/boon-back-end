import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import Article from "../models/article.model.mjs";
import User from "../models/user.model.mjs";

// IMPORTANT: Replace this with your actual, live frontend production URL
const FRONTEND_URL = "https://bloggy-beta-seven.vercel.app/";

class SitemapService {
  async generateSitemap() {
    // 1. Create a sitemap stream
    const stream = new SitemapStream({ hostname: FRONTEND_URL });

    // 2. Define your site's static pages (high priority)
    const staticLinks = [
      { url: "/", changefreq: "daily", priority: 1.0 },
      { url: "/about", changefreq: "monthly", priority: 0.7 },
    ];

    // 3. Fetch dynamic URLs from your database
    // We only need the `_id` and `updatedAt` fields for an effective sitemap.
    const articles = await Article.find().select("_id updatedAt").lean();
    const users = await User.find().select("_id updatedAt").lean();

    // 4. Write static links to the stream
    staticLinks.forEach((link) => stream.write(link));

    // 5. Write article detail page URLs to the stream
    articles.forEach((article) => {
      stream.write({
        url: `/articles/${article._id}`,
        changefreq: "weekly", // Articles might be updated
        priority: 0.9,
        lastmod: article.updatedAt, // Tells crawlers when it was last changed
      });
    });

    // 6. Write user profile page URLs to the stream
    users.forEach((user) => {
      stream.write({
        url: `/profile/${user._id}`,
        changefreq: "monthly",
        priority: 0.6,
        lastmod: user.updatedAt,
      });
    });

    // 7. End the stream to signal that you're done adding URLs
    stream.end();

    // 8. Convert the stream to XML text
    return streamToPromise(Readable.from(stream)).then((data) =>
      data.toString()
    );
  }
}

export default new SitemapService();
