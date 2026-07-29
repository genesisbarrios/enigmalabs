const express = require("express");
const axios = require("axios");

const router = express.Router();

const API_KEY = process.env.GOOGLE_API_KEY;
const CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || API_KEY;
const CUSTOM_SEARCH_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX;

const PERSONAL_EMAIL_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me", "protonmail.com"];
const EMAIL_REGEX = new RegExp(`[a-zA-Z0-9._%+-]+@(?:${PERSONAL_EMAIL_DOMAINS.map((d) => d.replace(".", "\\.")).join("|")})`, "i");

// Get coordinates from city
async function geocode(city) {
  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        address: city,
        key: API_KEY
      }
    }
  );

  const location = response.data.results[0].geometry.location;

  return location;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Search businesses (paginates through Google's max of 3 pages / 60 results)
async function searchPlaces(keyword, location) {
  const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
  let results = [];
  let pageToken = null;
  let page = 0;

  do {
    const params = {
      location: `${location.lat},${location.lng}`,
      radius: 50000,
      keyword,
      key: API_KEY
    };
    if (pageToken) params.pagetoken = pageToken;

    const response = await axios.get(url, { params });
    results = results.concat(response.data.results);
    pageToken = response.data.next_page_token || null;
    page += 1;

    // Google requires a short delay before a next_page_token becomes valid
    if (pageToken && page < 3) {
      await sleep(2000);
    }
  } while (pageToken && page < 3);

  return results;
}

// Get details
async function getDetails(placeId) {
  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    {
      params: {
        place_id: placeId,
        fields:
          "name,website,formatted_phone_number,formatted_address,rating,user_ratings_total",
        key: API_KEY
      }
    }
  );

  return response.data.result;
}

// Find a personal email for a business by searching its Instagram/Facebook bio
async function findEmailForBusiness(name, city) {
  const emailDomains = PERSONAL_EMAIL_DOMAINS.map((d) => `"@${d}"`).join(" OR ");
  const q = `(site:instagram.com OR site:facebook.com) "${name}" ${city ? `"${city}"` : ""} (${emailDomains}) -"https://" -"www."`;

  const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
    params: {
      key: CUSTOM_SEARCH_API_KEY,
      cx: CUSTOM_SEARCH_CX,
      q,
      num: 10
    }
  });

  const items = response.data.items || [];
  for (const item of items) {
    const match = `${item.title || ""} ${item.snippet || ""}`.match(EMAIL_REGEX);
    if (match) return match[0];
  }

  return null;
}

// POST /api/leads/enrich-email
router.post("/enrich-email", async (req, res) => {
  try {
    if (!CUSTOM_SEARCH_CX) {
      return res.status(500).json({ error: "Google Custom Search is not configured (missing GOOGLE_CUSTOM_SEARCH_CX)." });
    }

    const { name, city } = req.body;
    if (!name) {
      return res.status(400).json({ error: "A business name is required" });
    }

    const email = await findEmailForBusiness(name, city || "");
    res.json({ email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search for an email" });
  }
});

// POST /api/leads
router.post("/", async (req, res) => {
  try {
    const { niche, keyword, city } = req.body;
    const searchTerm = [niche, keyword].filter(Boolean).join(" ").trim();

    if (!searchTerm || !city) {
      return res.status(400).json({ error: "A niche or keyword, and a city, are required" });
    }

    const location = await geocode(city);

    const places = await searchPlaces(searchTerm, location);

    let leads = [];

    for (const place of places) {
      const business = await getDetails(place.place_id);

      if (!business.website) {
        leads.push({
          name: business.name,
          phone: business.formatted_phone_number || "",
          address: business.formatted_address || "",
          rating: business.rating || 0,
          reviews: business.user_ratings_total || 0,
          website: null
        });
      }
    }

    res.json({
      count: leads.length,
      leads
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed finding leads"
    });
  }
});

module.exports = router;
