import React, { useState } from 'react';
import './Sidebar.css';
import logo from './logo1.png';

const Sidebar = ({ onDashboardClick }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('map');

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const menuItems = [
        { id: 'map', icon: '🗺️', label: 'Map View' },
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'about', icon: 'ℹ️', label: 'About' },
    ];

    return (
        <div className={`glass-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="logo-icon">
                    <img src={logo} alt="SkyLink Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                {isOpen && <span className="logo-text">SkyLink</span>}
                <button className="toggle-btn" onClick={toggleSidebar}>
                    {isOpen ? '◀' : '▶'}
                </button>
            </div>

            <div className="nav-menu">
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(item.id);
                            if (item.id === 'map') {
                                // If map is clicked, close dashboard AND toggle sidebar
                                if (onDashboardClick) onDashboardClick(false);
                                toggleSidebar();
                            } else if (item.id === 'dashboard') {
                                if (onDashboardClick) onDashboardClick(true);
                                if (!isOpen) toggleSidebar(); // Open sidebar if closed when clicking dashboard
                            } else if (item.id === 'about') {
                                // Handle about click - pass a special string or handle in parent
                                if (onDashboardClick) onDashboardClick('about');
                            }
                        }}
                        title={!isOpen ? item.label : ''}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {isOpen && <span className="nav-label">{item.label}</span>}
                        {activeTab === item.id && <div className="active-indicator" />}
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">👤</div>
                    {isOpen && (
                        <div className="user-info">
                            <span className="user-name">User</span>
                            <span className="user-status">Online</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
