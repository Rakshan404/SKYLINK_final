import React from 'react';
import './Widgets.css';

export const WeatherWidget = ({ weather }) => {
    if (!weather) return null;

    return (
        <div className="glass-widget weather-widget">
            <div className="widget-header">
                <span className="widget-title">WEATHER</span>
                <span className="widget-icon">☁️</span>
            </div>
            <div className="weather-main">
                <span className="temp">{weather.temperature}°</span>
                <div className="weather-desc">
                    <span>{weather.weathercode > 3 ? "Rainy" : "Clear"}</span>
                    <span className="sub-text">Light Drizzle</span>
                </div>
            </div>
            <div className="weather-stats">
                <div className="stat-item">
                    <span className="stat-icon">💨</span>
                    <div className="stat-info">
                        <span className="stat-label">Wind</span>
                        <span className="stat-value">{weather.windspeed} km/h</span>
                    </div>
                </div>
                <div className="stat-item">
                    <span className="stat-icon">💧</span>
                    <div className="stat-info">
                        <span className="stat-label">Humidity</span>
                        <span className="stat-value">65%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};








