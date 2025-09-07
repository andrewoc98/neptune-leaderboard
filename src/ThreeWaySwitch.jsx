import React, { useState } from 'react';

function ThreeWaySwitch({ onChange }) {
    const [selected, setSelected] = useState('Season');
    const options = ['Season', 'Month', 'Week'];

    // Abbreviation mapping
    const abbreviations = {
        Season: 'sea',
        Month: 'mon',
        Week: 'wk',
    };

    const handleSelect = (option) => {
        setSelected(option);
        if (onChange) onChange(option);
    };

    return (
        <div style={{
            display: 'flex',
            border: '2px solid #a0b0b0',
            borderRadius: '9999px',
            padding: '6px',
            backgroundColor: '#fff',
        }}>
            {options.map(option => {
                const isSelected = selected === option;
                return (
                    <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        style={{
                            height: '32px',
                            width: '32px',
                            margin: '0 6px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: isSelected ? '#28a745' : '#fff',
                            color: isSelected ? '#fff' : '#7f8c8d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                        }}
                        title={option}
                    >
                        {abbreviations[option]}
                    </button>
                );
            })}
        </div>
    );
}

export default ThreeWaySwitch;
