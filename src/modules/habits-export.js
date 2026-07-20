import { state } from '../core/store.js';
import { generateHabitCSVData } from './habits-data.js';

export function exportHabitCSV(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const reps = state.habitRepetitions[habitId] || {};
    const csvContent = generateHabitCSVData(habit, reps);
    
    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const safeName = habit.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        link.setAttribute("download", `riwayat_kebiasaan_${safeName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Use standard vibration fallback if needed, or window.vibrate
        if (window.vibrate) window.vibrate(15);
    } catch (e) {
        console.error("CSV Export failed", e);
        if (window.showModal) {
            window.showModal('Ekspor Gagal', 'Gagal membuat file CSV.', null, true);
        }
    }
}
