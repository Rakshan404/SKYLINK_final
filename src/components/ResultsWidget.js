import React from 'react';
import './ResultsWidget.css';

const ResultsWidget = ({ results }) => {
    if (!results || results.length === 0) return null;

    return (
        <div className="results-widget">
            <h3>Top Recommendations</h3>
            <div className="results-list">
                {results.map((place, index) => (
                    <div key={index} className="result-card">
                        <div className="result-info">
                            <h4>{place.name}</h4>
                            <p className="result-address">{place.address}</p>
                            <div className="result-badges">
                                <span className="badge match">Match: {place.scores?.total}%</span>
                                <span className="badge rating">★ {place.rating || 'N/A'}</span>
                            </div>
                        </div>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="navigate-btn"
                            title="Navigate on Google Maps"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                            </svg>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultsWidget;
