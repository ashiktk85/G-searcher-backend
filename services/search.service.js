import axios from "axios";

const NOMINATIM_HEADERS = {
  "User-Agent": "MySearchApp/1.0 (ashiktk85@gmail.com)",
};

const WIKI_HEADERS = {
  "User-Agent": "MySearchApp/1.0 (ashiktk85@gmail.com)", // IMPORTANT for 403
};

export class SearchService {
  static async search(query) {
    console.log("SearchService.search (Nominatim) called with:", query);

    try {
      const resp = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: query,
            format: "json",
            addressdetails: 1,
            extratags: 1,
            namedetails: 1, // helps to get clean name
            // limit: 6,
          },
          headers: NOMINATIM_HEADERS,
        }
      );

      const results = resp.data;
      if (!results || results.length === 0) return [];

      console.log("Raw first Nominatim result:", results[0]);

      // const simplified = await Promise.all(
      //   results.map(async (p) => {
      //     const photoUrl = await getImageForPlace(p);
      //     const email = await getEmailForPlace(p);
      //     return {
      //       place_id: p.place_id,
      //       name: p.display_name,
      //       address: p.display_name,
      //       rating: null,
      //       location: {
      //         lat: Number(p.lat),
      //         lng: Number(p.lon),
      //       },
      //       email: p.email,
      //       photoUrl: photoUrl,
      //       email: email,
      //       mapUrl: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`,
      //     };
      //   })
      // );

      const simplified = await Promise.all(
        results.map(async (p) => {
          const photoUrl = await getImageForPlace(p);
          const email = await getEmailForPlace(p);
          const address = p.address || {};
      
          return {
            place_id: p.place_id,
      
            // Clean name (use namedetails if available)
            name: p.namedetails?.name || p.display_name.split(",")[0],
            // email: p.email,
            email: email,
            // Structured address
            address: {
              house_number: address.house_number || null,
              road: address.road || null,
              suburb: address.suburb || address.neighbourhood || null,
              district: address.city_district || null,
              city: address.city || address.town || address.village || null,
              state: address.state || null,
              postcode: address.postcode || null,
              country: address.country || null,
              full: p.display_name  // keep original full string
            },
      
            rating: null,
            location: {
              lat: Number(p.lat),
              lng: Number(p.lon),
            },
      
            photoUrl,
            mapUrl: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`,
          };
        })
      );


      console.log("Simplified result:", simplified);
      return simplified;
    } catch (err) {
      console.error("Nominatim error:", err.message);
      return [];
    }
  }
}

/**
 * Try to get an image for a place:
 * 1) via wikidata
 * 2) via wikipedia tag
 * 3) via wikipedia search using a clean name
 */
async function getImageForPlace(place) {
  const cleanName = getCleanName(place);
  const wikidataId = place.extratags?.wikidata; // e.g. Q173349
  const wikipediaTag = place.extratags?.wikipedia; // e.g. en:Burj_Khalifa

  console.log("Trying image for:", cleanName, {
    wikidataId,
    wikipediaTag,
  });

  // 1️⃣ Wikidata → image
  if (wikidataId) {
    const img = await getImageFromWikidata(wikidataId);
    if (img) return img;
  }

  // 2️⃣ Wikipedia tag → image
  if (wikipediaTag) {
    const [lang, title] = wikipediaTag.split(":");
    const img = await getImageFromWikipedia(lang, title);
    if (img) return img;
  }

  // 3️⃣ Fallback: search Wikipedia by name (English)
  if (cleanName) {
    const img = await getImageFromWikipediaSearch("en", cleanName);
    console.log("Wikipedia search result img:", img);
    if (img) return img;
  }

  return null;
}

// Use a shorter, cleaner name for Wikipedia search
function getCleanName(place) {
  if (place.namedetails?.name) return place.namedetails.name;

  if (place.display_name) {
    // take only first part before comma
    return place.display_name.split(",")[0];
  }

  return null;
}

async function getImageFromWikidata(id) {
  try {
    const { data } = await axios.get(
      `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`,
      {
        headers: WIKI_HEADERS,
      }
    );

    const entity = data.entities?.[id];
    const fileName = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!fileName) return null;

    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      fileName
    )}?width=400`;
  } catch (err) {
    console.error(
      "Wikidata image error:",
      err.response?.status,
      err.message
    );
    return null;
  }
}

async function getImageFromWikipedia(lang, title) {
  try {
    const { data } = await axios.get(
      `https://${lang}.wikipedia.org/w/api.php`,
      {
        params: {
          action: "query",
          titles: title,
          prop: "pageimages",
          format: "json",
          pithumbsize: 400,
        },
        headers: WIKI_HEADERS,
      }
    );

    const pages = data.query?.pages;
    const page = pages && Object.values(pages)[0];

    return page?.thumbnail?.source || null;
  } catch (err) {
    console.error(
      "Wikipedia image error:",
      err.response?.status,
      err.message
    );
    return null;
  }
}

async function getImageFromWikipediaSearch(lang, searchText) {
  try {
    const { data } = await axios.get(
      `https://${lang}.wikipedia.org/w/api.php`,
      {
        params: {
          action: "query",
          list: "search",
          srsearch: searchText,
          format: "json",
        },
        headers: WIKI_HEADERS,
      }
    );

    const first = data.query?.search?.[0];
    if (!first) return null;

    const title = first.title;
    return await getImageFromWikipedia(lang, title);
  } catch (err) {
    console.error(
      "Wikipedia search image error:",
      err.response?.status,
      err.message
    );
    return null;
  }
}
async function getEmailForPlace(place) {
  try {
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: place.display_name,
          format: "json",
          addressdetails: 1,
          extratags: 1,
          namedetails: 1,
          limit: 1,
        },
        headers: NOMINATIM_HEADERS,
      }
    );
    return data[0].email;
  } catch (err) {
    console.error("Nominatim email error:", err.message);
    return null;
  }
}