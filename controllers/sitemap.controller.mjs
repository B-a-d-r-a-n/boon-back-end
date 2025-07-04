import sitemapService from "../services/sitemap.service.mjs";
export const getSitemap = async (req, res, next) => {
  try {
    const sitemapXml = await sitemapService.generateSitemap();
    res.header("Content-Type", "application/xml");
    res.status(200).send(sitemapXml);
  } catch (error) {
    next(error);
  }
};