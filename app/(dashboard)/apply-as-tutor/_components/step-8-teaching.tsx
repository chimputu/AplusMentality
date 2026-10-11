'use client';

interface Props {
  formData: any;
  updateField: (field: string, value: any) => void;
}

const TEACHING_MODES = ['ONLINE', 'HYBRID', 'PHYSICAL'] as const;
const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const;

const TIME_SLOTS = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
  '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
];

export default function Step8Teaching({ formData, updateField }: Props) {
  const modes = formData.teachingModes || [];
  const schedule = formData.teachingSchedule || {};

  const toggleMode = (mode: string) => {
    const current = modes || [];
    if (current.includes(mode)) {
      if (current.length > 1) {
        updateField('teachingModes', current.filter((m: string) => m !== mode));
      }
    } else {
      updateField('teachingModes', [...current, mode]);
    }
  };

  const toggleTimeSlot = (day: string, slot: string) => {
    const currentSlots = schedule[day] || [];
    let newSlots;
    if (currentSlots.includes(slot)) {
      newSlots = currentSlots.filter((s: string) => s !== slot);
    } else {
      newSlots = [...currentSlots, slot];
    }
    const newSchedule = { ...schedule, [day]: newSlots };
    updateField('teachingSchedule', newSchedule);
  };

  return (
    <div className="space-y-8">
      {/* Teaching Modes */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Teaching Modes
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select how you prefer to teach your students.
        </p>
        <div className="space-y-3">
          {TEACHING_MODES.map((mode) => (
            <label key={mode} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={modes.includes(mode)}
                onChange={() => toggleMode(mode)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {mode === 'ONLINE' ? 'Online' : mode === 'HYBRID' ? 'Hybrid' : 'In-Person'}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {mode === 'ONLINE' && 'Teach via video calls and online platforms'}
                  {mode === 'HYBRID' && 'Mix of online and in-person sessions'}
                  {mode === 'PHYSICAL' && 'Teach in person at a physical location'}
                </p>
              </div>
            </label>
          ))}
        </div>

        {modes.includes('PHYSICAL') && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Physical Location
            </label>
            <input
              type="text"
              value={formData.physicalLocation || ''}
              onChange={(e) => updateField('physicalLocation', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., UNZA Main Campus, Lusaka"
            />
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hourly Rate (ZMW)
            </label>
            <input
              type="number"
              value={formData.hourlyRateZMW || ''}
              onChange={(e) => updateField('hourlyRateZMW', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
              max={50000}
              placeholder="500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum Booking (hours)
            </label>
            <input
              type="number"
              value={formData.minimumBookingHours || ''}
              onChange={(e) => updateField('minimumBookingHours', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
              max={8}
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Teaching Schedule */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Teaching Schedule
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select the days and times you are available to teach.
        </p>

        <div className="space-y-4">
          {DAYS.map(({ key, label }) => (
            <div key={key}>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
              </h4>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = (schedule[key] || []).includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleTimeSlot(key, slot)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
