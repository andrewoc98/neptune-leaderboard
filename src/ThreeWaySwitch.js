import React, { useState } from 'react';

function ThreeWaySwitch({ onChange }) {
    const [selected, setSelected] = useState('Total');
    const options = ['Total', 'Month', 'Week'];

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
            width: 'fit-content',
            alignItems: 'right',
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
                            backgroundColor: isSelected ? '#28a745' : 'transparent',
                            color: isSelected ? '#fff' : '#7f8c8d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                        }}
                        title={option}
                    >
                        {option[0]} {/* First letter only */}
                    </button>
                );
            })}
        </div>
    );
}

export default ThreeWaySwitch;
