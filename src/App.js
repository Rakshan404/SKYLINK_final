import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip, CircleMarker } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';
import Sidebar from './components/Sidebar';
import OldSidebar from './components/OldSidebar';
import { WeatherWidget } from './components/Widgets';
import BottomRightWidget from './components/BottomRightWidget';
import AboutSection from './components/AboutSection';


import logo1 from './components/logo1.png';

// ballPointPin and logo2 imports removed

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

// --- ICONS ---

const createEmojiIcon = (isActive) => {
  return L.divIcon({
    className: `emoji-marker ${isActive ? 'active' : ''}`,
    html: '<div class="marker-3d-content">📍</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// const logo2Icon = ... (removed because unused)

const meetingIcon = L.divIcon({
  className: '',
  html: `<div class="marker-3d-content"><img src="${logo1}" style="width: 40px; height: 40px;" /></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});
const createColoredIcon = (color) => {
  return L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [15, 42], // Anchor at bottom point
    popupAnchor: [0, -42],
    html: `<div class="marker-3d-content">
             <div class="modern-pin">
               <div class="pin-ring" style="border-color: ${color}; background-color: ${color}22;"></div>
               <div class="pin-dot" style="background-color: ${color}; filter: brightness(0.6);"></div>
             </div>
           </div>`
  });
};
// ... (keep helper functions like getDistanceFromLatLonInKm)

// ... (inside App component)



// --- HELPER: MATH ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

const deg2rad = (deg) => {
  return deg * (Math.PI / 180)
}

// --- HELPER: SHARE LINK GENERATOR ---
// const generateGoogleMapsUrl = ... (removed because unused)

// --- COMPONENTS ---
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// --- ROUTE LAYER (Interactive) ---
// --- ROUTE LAYER (Interactive) ---
const RouteLayer = ({ from, to, color, label }) => {
  const [routePath, setRoutePath] = useState([]);
  const [summary, setSummary] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState(null); // Track mouse position on route

  useEffect(() => {
    if (!from || !to) return;

    setRoutePath([]);
    setSummary(null);
    setUsingFallback(false);

    // Use local backend with TomTom Traffic
    const url = `${API_BASE_URL}/api/route?startLat=${from.lat}&startLng=${from.lng}&endLat=${to.lat}&endLng=${to.lng}`;

    const timer = setTimeout(() => {
      axios.get(url)
        .then(response => {
          if (response.data && response.data.coordinates) {
            const { coordinates, durationSeconds, distanceMeters, trafficDelay } = response.data;
            setRoutePath(coordinates);

            const minutes = Math.round(durationSeconds / 60);
            const km = (distanceMeters / 1000).toFixed(1);

            let summaryText = `${minutes} min / ${km} km`;
            if (trafficDelay > 60) {
              const delayMin = Math.round(trafficDelay / 60);
              summaryText += ` (+${delayMin} min traffic)`;
            }
            setSummary(summaryText);
          } else {
            throw new Error("No route found");
          }
        })
        .catch(err => {
          console.error("Backend routing failed, falling back to OSRM:", err);
          // Fallback to OSRM
          const start = `${from.lng},${from.lat}`;
          const end = `${to.lng},${to.lat}`;
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

          axios.get(osrmUrl)
            .then(response => {
              if (response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                setRoutePath(coordinates);

                const minutes = Math.round(route.duration / 60);
                const km = (route.distance / 1000).toFixed(1);
                setSummary(`${minutes} min / ${km} km`);
                setUsingFallback(false); // It's a real route, just not traffic-aware
              } else {
                throw new Error("No OSRM route found");
              }
            })
            .catch(osrmErr => {
              console.error("OSRM fallback failed:", osrmErr);
              setUsingFallback(true);
              setRoutePath([[from.lat, from.lng], [to.lat, to.lng]]);
              const dist = getDistanceFromLatLonInKm(from.lat, from.lng, to.lat, to.lng).toFixed(1);
              setSummary(`~${dist} km (Straight Line)`);
            });
        });
    }, Math.random() * 400);

    return () => clearTimeout(timer);
  }, [from, to]); // Adjusted dependencies

  // Helper to find closest point on polyline
  const getClosestPointOnPolyline = (latlng, path) => {
    if (!path || path.length < 2) return latlng;

    let minDst = Infinity;
    let closest = latlng;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = L.latLng(path[i]);
      const p2 = L.latLng(path[i + 1]);

      const p = L.LineUtil.closestPointOnSegment(
        L.point(latlng.lat, latlng.lng),
        L.point(p1.lat, p1.lng),
        L.point(p2.lat, p2.lng)
      );

      const dist = L.latLng(p.x, p.y).distanceTo(latlng);
      if (dist < minDst) {
        minDst = dist;
        closest = L.latLng(p.x, p.y);
      }
    }
    return closest;
  };

  const handlers = {
    mouseover: (e) => {
      setIsHovered(true);
      e.target.bringToFront();
      e.target.openTooltip();
      const snapped = getClosestPointOnPolyline(e.latlng, routePath);
      setHoverPos(snapped);
    },
    mousemove: (e) => {
      const snapped = getClosestPointOnPolyline(e.latlng, routePath);
      setHoverPos(snapped); // Update circle position to snapped point
      e.target.openTooltip();
    },
    mouseout: (e) => {
      setIsHovered(false);
      setHoverPos(null);
      e.target.closeTooltip();
    }
  };

  if (routePath.length === 0) return null;

  return (
    <>
      {/* Hitbox Layer (Invisible but interactive) - INCREASED SIZE */}
      <Polyline
        positions={routePath}
        color="transparent" // Invisible
        weight={25} // Large hit area
        opacity={0}
        eventHandlers={handlers}
        zIndex={10} // Ensure it's on top for interaction
      >
        <Tooltip sticky direction="top" offset={[0, -10]} opacity={1}>
          <div style={{ textAlign: 'center', padding: '4px' }}>
            <strong>{label} ➔ Meeting Spot</strong>
            <div style={{ marginTop: '4px', fontSize: '0.9em' }}>
              {usingFallback ? "⚠️ Straight Line" : "🚗 Driving Route"}
            </div>
            <div style={{ fontWeight: 'bold', color: '#333', marginTop: '4px' }}>
              {summary || "Calculating..."}
            </div>
          </div>
        </Tooltip>
      </Polyline>

      {/* Visual Glow Layer (Bottom) */}
      <Polyline
        positions={routePath}
        color={color}
        weight={isHovered ? 12 : 8}
        opacity={0.3}
        dashArray={usingFallback ? "5, 10" : null}
        className="route-glow"
        interactive={false}
      />

      {/* Core Layer (Top) */}
      <Polyline
        positions={routePath}
        color={isHovered ? "#fff" : color}
        weight={isHovered ? 5 : 4}
        opacity={1.0}
        dashArray={usingFallback ? "5, 10" : null}
        interactive={false} // Interaction handled by hitbox
      />

      {/* Hover Circle */}
      {isHovered && hoverPos && (
        <CircleMarker
          center={hoverPos}
          radius={6}
          pathOptions={{
            color: '#fff',
            fillColor: color,
            fillOpacity: 1,
            weight: 2
          }}
          interactive={false}
        />
      )}
    </>
  );
};

// --- MAIN APP ---
function App() {
  const [locations, setLocations] = useState(["", ""]);
  const [coords, setCoords] = useState([]);
  const [meetingPoint, setMeetingPoint] = useState(null);
  const [suggestedVenues, setSuggestedVenues] = useState([]);
  const [weather, setWeather] = useState({ temperature: 24, weathercode: 1, windspeed: 8 }); // Mock initial data
  const [loading, setLoading] = useState(false);
  const [category] = useState("cafe");
  const [suggestionsCount] = useState(5);
  // State for showing a "Copied!" notification
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const userColors = ["#FF0000", "#0000FF", "#008000", "#FFA500", "#000000", "#800080"];

  // ... (existing functions)

  const handleInputChange = (index, value) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const addUser = () => {
    if (locations.length < 6) setLocations([...locations, ""]);
  };

  const removeUser = (indexToRemove) => {
    if (locations.length <= 2) return;
    const newLocations = locations.filter((_, index) => index !== indexToRemove);
    setLocations(newLocations);
  };

  const getCoordinates = async (address) => {
    try {
      const query = `${address}, Bengaluru`;
      const viewbox = "77.3,12.8,77.9,13.2";
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&viewbox=${viewbox}&bounded=1`
      );
      if (response.data && response.data.length > 0) {
        return {
          lat: parseFloat(response.data[0].lat),
          lng: parseFloat(response.data[0].lon),
          name: address
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const getWeather = async (lat, lng) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
      const response = await axios.get(url);
      setWeather(response.data.current_weather);
    } catch (error) {
      console.error("Weather Error:", error);
    }
  };

  const handleSelectSuggestion = (venue) => {
    setMeetingPoint(venue);
    getWeather(venue.lat, venue.lng);
  };

  // --- NEW: Copy Function ---
  // --- REMOVED: Copy Function (unused) ---

  const findSpots = async () => {
    setLoading(true);
    setMeetingPoint(null);
    setCoords([]);
    setWeather(null);
    setSearchResults([]); // Clear previous results

    // UX Enhancement: Hide sidebar and show instructions
    setShowDashboard(false);
    setShowInstructions(true);

    const promises = locations.filter(l => l.trim() !== "").map(loc => getCoordinates(loc));
    const results = await Promise.all(promises);
    const validCoords = results.filter(c => c !== null);
    setCoords(validCoords);

    if (validCoords.length > 0) {
      // ... (existing center calculation)
      const totalLat = validCoords.reduce((sum, loc) => sum + loc.lat, 0);
      const totalLng = validCoords.reduce((sum, loc) => sum + loc.lng, 0);
      const centerLat = totalLat / validCoords.length;
      const centerLng = totalLng / validCoords.length;

      const offset = 0.05;
      const minLng = centerLng - offset;
      const maxLng = centerLng + offset;
      const minLat = centerLat - offset;
      const maxLat = centerLat + offset;

      try {
        // Use local backend instead of Nominatim
        // Pass users for fairness calculation
        const usersParam = encodeURIComponent(JSON.stringify(validCoords));
        const categoryParam = encodeURIComponent(category);
        const placesResp = await axios.get(
          `${API_BASE_URL}/api/places?viewbox=${minLng},${minLat},${maxLng},${maxLat}&users=${usersParam}&q=${categoryParam}`
        );

        const venues = placesResp.data;
        setSearchResults(venues); // Store results for widget

        if (venues.length > 0) {
          let bestVenue = null;

          // Backend already returns scored venues
          const scoredVenues = venues.map(venue => {
            // If backend didn't provide scores (fallback), calculate them
            if (!venue.scores) {
              const vLat = parseFloat(venue.lat);
              const vLng = parseFloat(venue.lon);
              const distances = validCoords.map(u => getDistanceFromLatLonInKm(u.lat, u.lng, vLat, vLng));
              const maxDist = Math.max(...distances);
              const minDist = Math.min(...distances);
              const gap = maxDist - minDist;
              let fairnessScore = 100 - (gap * 4);
              fairnessScore = Math.max(0, Math.min(100, fairnessScore));
              const rating = (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);
              const safety = Math.floor(Math.random() * (100 - 85 + 1)) + 85;

              return {
                ...venue,
                lat: vLat,
                lng: vLng,
                name: venue.display_name.split(',')[0],
                scores: {
                  total: fairnessScore.toFixed(0),
                  fairness: fairnessScore.toFixed(0),
                  rating: rating,
                  safety: safety,
                  gap: gap.toFixed(1)
                }
              };
            }
            // Use backend scores
            return {
              ...venue,
              lat: parseFloat(venue.lat),
              lng: parseFloat(venue.lon),
              name: venue.name || venue.display_name.split(',')[0]
            };
          });

          // Backend sorts them, but we can ensure sort here too
          scoredVenues.sort((a, b) => parseFloat(b.scores.total) - parseFloat(a.scores.total));
          bestVenue = scoredVenues[0];

          const topSuggestions = scoredVenues.slice(0, suggestionsCount);
          setSuggestedVenues(topSuggestions);
          setMeetingPoint(bestVenue);
          getWeather(bestVenue.lat, bestVenue.lng);

        } else {
          setMeetingPoint({ lat: centerLat, lng: centerLng, name: "Middle Point" });
          getWeather(centerLat, centerLng);
        }

      } catch (e) {
        console.error(e);
        // ...
      }
    }
    setLoading(false);
  };

  // Handler for sidebar clicks
  const handleSidebarClick = (action) => {
    if (action === 'about') {
      setShowAbout(true);
      setShowDashboard(false);
    } else if (action === true) {
      setShowDashboard(true);
      setShowAbout(false);
    } else {
      setShowDashboard(false);
      setShowAbout(false);
    }
  };

  return (
    <div className="app-container">
      {showInstructions && (
        <div className="instruction-popup">
          <div className="instruction-content">
            <span className="instruction-icon">💡</span>
            <ul className="instruction-list">
              <li>Hover over the route to see the distance.</li>
              <li>Click on the pins to see the route for other locations.</li>
            </ul>
            <button className="close-instruction" onClick={() => setShowInstructions(false)}>✕</button>
          </div>
        </div>
      )}

      <div className="map-container">
        {/* Map */}
        <div className="map-wrapper">
          <MapContainer center={[12.9716, 77.5946]} zoom={12} scrollWheelZoom={true} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
            {coords.map((c, i) => (
              <Marker
                key={i}
                position={[c.lat, c.lng]}
                icon={createColoredIcon(userColors[i % userColors.length])}
              >
                <Popup>{c.name}</Popup>
              </Marker>
            ))}
            {suggestedVenues && suggestedVenues.map((v, i) => {
              const isActive = meetingPoint && meetingPoint.lat === v.lat && meetingPoint.lng === v.lng;
              return (
                <Marker
                  key={`s-${i}`}
                  position={[v.lat, v.lng]}
                  icon={isActive ? meetingIcon : createEmojiIcon(false)}
                  eventHandlers={{
                    click: () => handleSelectSuggestion(v)
                  }}
                >
                  <Popup>
                    <div style={{ maxWidth: 200 }}>
                      <div style={{ fontWeight: 700 }}>{v.name}</div>
                      <div style={{ fontSize: '0.8rem' }}>{v.display_name}</div>
                      {v.scores && <div style={{ marginTop: 6 }}>Fairness: <b>{v.scores.fairness}/100</b></div>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {meetingPoint && (
              <>
                <Marker position={[meetingPoint.lat, meetingPoint.lng]} icon={meetingIcon}>
                  <Popup><b>{meetingPoint.name}</b></Popup>
                </Marker>
                {coords.map((c, i) => (
                  <RouteLayer
                    key={i}
                    from={c}
                    to={meetingPoint}
                    color={userColors[i % userColors.length]}
                    label={`Person ${i + 1}`}
                  />
                ))}
                <ChangeView center={[meetingPoint.lat, meetingPoint.lng]} zoom={13} />
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Sidebar logic */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', display: 'flex', zIndex: 2000, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Sidebar onDashboardClick={handleSidebarClick} />
        </div>

        {showDashboard && (
          <div style={{ pointerEvents: 'auto' }}>
            <OldSidebar
              locations={locations}
              handleInputChange={handleInputChange}
              addUser={addUser}
              removeUser={removeUser}
              findSpots={findSpots}
              loading={loading}
              userColors={userColors}
            />
          </div>
        )}
      </div>

      {showAbout && <AboutSection onClose={() => setShowAbout(false)} />}

      <WeatherWidget weather={weather} />
      <BottomRightWidget places={searchResults} />
    </div>
  );
}

export default App;