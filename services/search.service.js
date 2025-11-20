
import axios from "axios";

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
            // limit: 5,
          },
          headers: {
            "User-Agent": "MySearchApp/1.0 (ashiktk85@gmail.com)",
          },
        }
      );

      const results = resp.data;

      if (!results || results.length === 0) return [];

      // Normalize results for your frontend
      const simplified = results.map((p) => ({
        place_id: p.place_id,
        name: p.display_name,
        address: p.display_name,
        rating: null, // OSM doesn’t provide ratings
        location: {
          lat: p.lat,
          lng: p.lon,
        },
        photoUrl: null, // OSM does NOT provide photos
        mapUrl: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`,
      }));

      console.log("Simplified result:", simplified);

      return simplified;
    } catch (err) {
      console.error("Nominatim error:", err.message);
      return [];
    }
  }
}
