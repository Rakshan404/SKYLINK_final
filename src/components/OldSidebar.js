import AutocompleteInput from './AutocompleteInput';
import './OldSidebar.css';

const OldSidebar = ({
    locations,
    handleInputChange,
    addUser,
    removeUser,
    findSpots,
    loading,
    userColors
}) => {
    return (
        <div className="old-sidebar">
            <div className="old-sidebar-header">
                <h2 className="old-sidebar-title">Dashboard</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>
                    Enter locations to find the best meeting spot.
                </p>
            </div>

            <div className="input-group">
                {locations.map((loc, index) => (
                    <div key={index} className="location-input-wrapper">
                        <div
                            className="color-pin"
                            style={{ backgroundColor: userColors[index % userColors.length] }}
                        />
                        <AutocompleteInput
                            className="location-input"
                            placeholder={`Person ${index + 1} Location`}
                            value={loc}
                            onChange={(val) => handleInputChange(index, val)}
                        />
                        {locations.length > 2 && (
                            <button
                                className="remove-btn"
                                onClick={() => removeUser(index)}
                                title="Remove Person"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}

                {locations.length < 6 && (
                    <button className="add-btn" onClick={addUser}>
                        <span>+</span> Add Another Person
                    </button>
                )}
            </div>

            <button
                className="action-btn"
                onClick={findSpots}
                disabled={loading}
            >
                {loading ? 'Calculating...' : 'Find Meeting Spot ⚡'}
            </button>
        </div>
    );
};

export default OldSidebar;
