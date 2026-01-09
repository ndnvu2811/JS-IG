import React from 'react';

interface NumberInputControlProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    label: string;
    value: number;
    onChangeValue: (value: number) => void;
    unit: string;
}

const NumberInputControl: React.FC<NumberInputControlProps> = ({ label, value, onChangeValue, unit, ...props }) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-gray-400 block">{label}</label>
        <div className="flex items-center gap-2">
             <div className="relative w-24">
                 <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                        const num = parseInt(e.target.value, 10);
                        onChangeValue(isNaN(num) || num < 0 ? 0 : num);
                    }}
                    {...props}
                    className={`w-full bg-gray-800 border border-gray-600 rounded-lg text-white py-3 pl-3 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
            </div>
            <span className={`font-mono text-sm text-gray-400 ${props.disabled ? 'opacity-50' : ''}`}>{unit}</span>
        </div>
    </div>
);

export default NumberInputControl;
