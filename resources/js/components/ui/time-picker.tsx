import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    onClose: () => void;
}

export function TimePicker({ value, onChange, onClose }: TimePickerProps) {
    // Parse existing time or default to current time
    const [hours, minutes] = value ? value.split(':').map(Number) : [7, 0];
    const [selectedHour, setSelectedHour] = useState(hours > 12 ? hours - 12 : hours || 12);
    const [selectedMinute, setSelectedMinute] = useState(minutes);
    const [period, setPeriod] = useState<'AM' | 'PM'>(hours >= 12 ? 'PM' : 'AM');
    const [hourInput, setHourInput] = useState(selectedHour.toString().padStart(2, '0'));
    const [minuteInput, setMinuteInput] = useState(selectedMinute.toString().padStart(2, '0'));

    const handleOk = () => {
        let hour24 = selectedHour;
        if (period === 'PM' && selectedHour !== 12) {
            hour24 = selectedHour + 12;
        } else if (period === 'AM' && selectedHour === 12) {
            hour24 = 0;
        }
        const timeString = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        onChange(timeString);
        onClose();
    };

    const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        setHourInput(value); // Always update the input display
    };

    const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        setMinuteInput(value); // Always update the input display
    };

    const handleHourBlur = () => {
        let num = parseInt(hourInput);
        if (isNaN(num) || num < 1 || num > 12) {
            num = 12;
        }
        setSelectedHour(num);
        setHourInput(num.toString().padStart(2, '0'));
    };

    const handleMinuteBlur = () => {
        let num = parseInt(minuteInput);
        if (isNaN(num) || num < 0 || num > 59) {
            num = 0;
        }
        setSelectedMinute(num);
        setMinuteInput(num.toString().padStart(2, '0'));
    };

    // Update input fields when values change
    useEffect(() => {
        setHourInput(selectedHour.toString().padStart(2, '0'));
    }, [selectedHour]);

    useEffect(() => {
        setMinuteInput(selectedMinute.toString().padStart(2, '0'));
    }, [selectedMinute]);

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-background rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Enter your preferred time</div>
            
            {/* Time Display */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground text-center">Hour</label>
                    <Input
                        type="text"
                        inputMode="numeric"
                        value={hourInput}
                        onChange={handleHourInput}
                        onBlur={handleHourBlur}
                        onClick={(e) => {
                            // Select all on click
                            const target = e.target as HTMLInputElement;
                            target.select();
                        }}
                        className="text-4xl font-bold px-4 py-3 rounded-lg transition-all w-28 text-center border-2 hover:border-primary/50 focus-visible:ring-2 cursor-text"
                        maxLength={2}
                        placeholder="07"
                    />
                    <span className="text-xs text-muted-foreground text-center">1-12</span>
                </div>
                
                <span className="text-4xl font-bold text-muted-foreground mt-6">:</span>
                
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground text-center">Minute</label>
                    <Input
                        type="text"
                        inputMode="numeric"
                        value={minuteInput}
                        onChange={handleMinuteInput}
                        onBlur={handleMinuteBlur}
                        onClick={(e) => {
                            // Select all on click
                            const target = e.target as HTMLInputElement;
                            target.select();
                        }}
                        className="text-4xl font-bold px-4 py-3 rounded-lg transition-all w-28 text-center border-2 hover:border-primary/50 focus-visible:ring-2 cursor-text"
                        maxLength={2}
                        placeholder="00"
                    />
                    <span className="text-xs text-muted-foreground text-center">0-59</span>
                </div>
                
                {/* AM/PM Toggle */}
                <div className="flex flex-col gap-2 ml-2 mt-6">
                    <button
                        type="button"
                        onClick={() => setPeriod('AM')}
                        className={cn(
                            "px-4 py-2 text-base font-semibold rounded-lg transition-all",
                            period === 'AM' 
                                ? "bg-primary text-primary-foreground shadow-md" 
                                : "text-muted-foreground hover:bg-muted border border-border"
                        )}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('PM')}
                        className={cn(
                            "px-4 py-2 text-base font-semibold rounded-lg transition-all",
                            period === 'PM' 
                                ? "bg-primary text-primary-foreground shadow-md" 
                                : "text-muted-foreground hover:bg-muted border border-border"
                        )}
                    >
                        PM
                    </button>
                </div>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-muted-foreground text-center">
                Click on the hour or minute to type your desired time
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full justify-end pt-2">
                <Button variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleOk}>
                    OK
                </Button>
            </div>
        </div>
    );
}

