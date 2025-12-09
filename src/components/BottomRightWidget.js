import React from 'react';
import './BottomRightWidget.css';

const BottomRightWidget = ({ places }) => {
    if (!places || places.length === 0) return null;

    return (
        <div className="bottom-right-widget">
            <h3>Found Places ({places.length})</h3>
            <div className="places-list">
                {places.map((place, index) => (
                    <div key={index} className="place-item">
                        <div className="place-info">
                            <div className="place-name">{place.name}</div>
                            <div className="place-address">{place.display_name || place.address}</div>
                        </div>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="share-btn"
                            title="Open in Google Maps"
                        >
                            📍
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BottomRightWidget;
