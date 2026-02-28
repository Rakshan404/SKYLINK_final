import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './OldSidebar.css'; // Re-use or add specific styles here

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const AutocompleteInput = ({ value, onChange, placeholder, className }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Close suggestions when clicking outside
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const fetchSuggestions = async (query) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            // Use local backend proxy for TomTom Search
            const url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`;
            const response = await axios.get(url);

            if (response.data && Array.isArray(response.data)) {
                setSuggestions(response.data);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Autofill Error:", error);
            setSuggestions([]);
        }
    };

    // Debounce function
    useEffect(() => {
        const timer = setTimeout(() => {
            if (value) {
                fetchSuggestions(value);
            }
        }, 300); // Reduced delay for faster feel

        return () => clearTimeout(timer);
    }, [value]);

    const handleSelect = (suggestion) => {
        onChange(suggestion.name);
        setShowSuggestions(false);
    };

    return (
        <div className="autocomplete-wrapper" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                className={className}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => value && value.length >= 3 && setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((s, index) => (
                        <li key={index} onClick={() => handleSelect(s)}>
                            <strong>{s.name.split(',')[0]}</strong>
                            <br />
                            <small>{s.name}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AutocompleteInput;
