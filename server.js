const express = require("express");
const cors = require("cors");
const axios = require("axios"); // Import the axios library for making HTTP requests
const app = express();

app.use(express.json());
app.use(cors());

// Code for getting the lat and long.
const getCityCoordinates = async (city) => {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results.length > 0) {
      const { latitude, longitude } = geoData.results[0];
      return { latitude, longitude }; // Return an object
    } else {
      throw new Error(`Coordinates for "${city}" not found.`);
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw new Error(`Failed to fetch coordinates for "${city}"`);
  }
};



// Entry point to msrvs
app.post("/hotels", async (req, res) => {
  const { city, latitude, longitude } = req.body;
  console.log("Microservice received:", { city }, {latitude}, {longitude});

  try {

    if (city){
      const { latitude, longitude } = await getCityCoordinates(city);
      console.log("in (if city)", latitude, longitude)
          const foursquareRes = await axios.get("https://api.foursquare.com/v3/places/search", {
            headers: {
              Authorization: "fsq3uDkptSDSbHS+pVTqTZBvfjl9Zx3Ak/xlUXC9v8rAeAU=",
            },
            params: {
              ll: `${latitude},${longitude}`,
              radius: 10000,
              categories: "19014", // Landmarks, museums, historical buildings
              limit: 20,
            },
          });
          res.json({ city, places: poiProcessor(foursquareRes) }); 
    }else if( latitude && longitude){
      console.log("in (if lat/ lon", latitude, longitude)
        const foursquareRes = await axios.get("https://api.foursquare.com/v3/places/search", {
          headers: {
            Authorization: "fsq3uDkptSDSbHS+pVTqTZBvfjl9Zx3Ak/xlUXC9v8rAeAU=",
          },
          params: {
            ll: `${latitude},${longitude}`,
            radius: 10000,
            categories: "19014", // Landmarks, museums, historical buildings
            limit: 20,
          },
        });
          res.json({ city, places: poiProcessor(foursquareRes) }); 
    }else{
      return res.status(400).json({ error: "City or Latitude/Longitude is required! " });
    }

  } catch (error) {
    console.error("Error fetching places:", error.message);
    res.status(500).json({ error: "Failed to fetch places of interest" });
  }
});

// For processing responce
const poiProcessor = (foursquareRes) => {

  const places = foursquareRes.data.results.map((place) => ({
    name: place.name,
    address: place.location?.formatted_address || "",
    categories: place.categories?.map((c) => c.name) || [],
    distance: place.distance,
    lat: place.geocodes?.main?.latitude,
    lng: place.geocodes?.main?.longitude,
  }));
  return places
}





app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`places microservice running on port ${PORT}`);
});
