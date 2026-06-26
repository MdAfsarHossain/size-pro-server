// export const formatTimeSlotDate = (dateString: any) => {
//     const date = new Date(dateString);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const dateStr = date.toDateString();

//     if (dateStr === today.toDateString()) {
//         return 'Today';
//     } else if (dateStr === tomorrow.toDateString()) {
//         return 'Tomorrow';
//     } else {
//         return date.toLocaleDateString('en-US', {
//             weekday: 'long',
//             month: 'short',
//             day: 'numeric'
//         });
//     }
// };

export const formatTimeSlotDate = (dateString: any) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }

    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }

    // Format other dates
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};