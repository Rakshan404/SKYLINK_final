import React from 'react';
import './AboutSection.css';

const AboutSection = ({ onClose }) => {
    return (
        <div className="about-overlay">
            <div className="about-container glass-panel">
                <button className="close-about" onClick={onClose}>✕</button>

                <div className="about-header">
                    <h1>🚀 About SkyLink</h1>
                    <p className="tagline">The fairest way to meet halfway.</p>
                </div>

                <div className="about-content">
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Dashboard & Usage</h3>
                        <p>Use the dashboard to add friends and manage locations. When you click <b>"Find Meeting Spot"</b>, we analyze everyone's position. Clicking the location cards in the bottom right opens a direct <b>Google Maps</b> route to the venue.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🧮</div>
                        <h3>1. Finding the Spot (The Math)</h3>
                        <p>To decide <b>WHERE</b> to meet, we use the Centroid Formula and Straight-Line Math:</p>
                        <ul style={{ textAlign: 'left', marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.95em' }}>
                            <li><b>Step 1 (Centroid):</b> Calculate the mathematical center of all friends.</li>
                            <li><b>Step 2 (Search):</b> Ask the database for places near that center.</li>
                            <li><b>Step 3 (Scoring):</b> Pick the best one using a "Fairness Score" based on straight-line distances.</li>
                        </ul>
                        <p style={{ marginTop: '10px', fontSize: '0.9em', fontStyle: 'italic' }}>Why? This is instant and free. Checking real traffic for 50+ cafes would take too long.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🚗</div>
                        <h3>2. Showing the Route (The API)</h3>
                        <p><b>AFTER</b> the spot is chosen, we use the <b>TomTom Traffic API</b> to draw the blue line.</p>
                        <p style={{ marginTop: '8px' }}>This is where "Real-Time Traffic" comes in. It calculates the actual driving time and delay for the specific route.</p>
                        <p style={{ marginTop: '10px', fontWeight: 'bold', color: 'var(--accent-color)' }}>In short: Math picks the spot, Traffic APIs show how to get there.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🌦️</div>
                        <h3>Weather Widget</h3>
                        <p>The floating widget displays real-time weather data (Temperature, Wind Speed, Weather Code) specifically for the <b>selected meeting point</b>, helping you decide if an outdoor meetup is viable.</p>
                    </div>

                    <div className="feature-card full-width">
                        <div className="feature-icon">🚀</div>
                        <h3>Future Roadmap</h3>
                        <p>We are constantly improving! Here is what's coming next to make SkyLink even better:</p>
                        <ul style={{ textAlign: 'left', marginTop: '10px', color: 'var(--text-muted)' }}>
                            <li>✨ <b>Multi-Mode Transport:</b> Support for public transit, walking, and cycling routes.</li>
                            <li>✨ <b>User Accounts:</b> Save your friend groups and favorite meeting spots.</li>
                            <li>✨ <b>Voting System:</b> Let your group vote on the best venue directly in the app.</li>
                            <li>✨ <b>Price Range Filters:</b> Filter venues by budget ($ - $$$$).</li>
                        </ul>
                    </div>

                    <div className="feature-card full-width" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <div className="feature-icon">⚠️</div>
                        <h3>Technical Details & Disclaimer</h3>
                        <div style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                            <p><b>Disclaimer:</b> Please note that results are not always 100% accurate. Real-world traffic and road conditions may vary.</p>

                            <p style={{ marginTop: '10px' }}><b>APIs Used:</b></p>
                            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                                <li><b>TomTom Traffic API:</b> For real-time routing and traffic data.</li>
                                <li><b>OpenStreetMap (Nominatim):</b> For location search and geocoding.</li>
                                <li><b>Open-Meteo:</b> For live weather updates.</li>
                            </ul>

                            <p style={{ marginTop: '10px' }}><b>Fairness Formula:</b></p>
                            <p>We score venues (0-100) based on:</p>
                            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                                <li><b>40% Proximity:</b> Closeness to the geometric center.</li>
                                <li><b>40% Fairness:</b> Equality of travel times for all members.</li>
                                <li><b>20% Rating:</b> User reviews and popularity.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="about-footer">
                    <p>Built with ❤️ for seamless meetups.</p>
                </div>
            </div>
        </div>
    );
};

export default AboutSection;
