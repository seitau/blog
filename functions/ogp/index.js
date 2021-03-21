"use strict";

const cheerio = require("cheerio");
const request = require("request");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

function parseOgp(url) {
  return new Promise((resolve, reject) => {
    request(
      {
        method: "GET",
        url: encodeURI(url),
      },
      (err, res, body) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        const $ = cheerio.load(res.body);
        let ogp = new Object();
        ogp["siteName"] = $("title").text();
        $("head")
          .contents()
          .filter("meta")
          .each((i, elem) => {
            if (elem.hasOwnProperty("attribs")) {
              const attrs = elem.attribs;
              if (Object.prototype.hasOwnProperty.call(attrs, "property")) {
                if (/^og:/g.test(attrs.property)) {
                  let prop = attrs.property;
                  let content = attrs.content;
                  ogp[prop.split(":")[1]] = content.replace(/\r?\n/g, "");
                }
              }
            }
          });
        resolve(ogp);
      }
    );
  });
}

exports.handler = (event, context) => {
  const params = req.query;
  if (!params.hasOwnProperty("url")) {
    console.error("Error getting ogp data: please provide url");
    return res.json({ error: "Error getting ogp data: please provide url" });
  }

  return parseOgp(params["url"])
    .then((ogp) => {
      console.log("Successfully scraped ogp data: " + ogp);
      return {
        statusCode: 200,
        body: JSON.stringify(ogp)
      };
    })
    .catch((err) => {
      console.error("Error getting ogp data: " + err);
      return rertun {
        statusCode: 500,
        error: err,
      };
    });
});
