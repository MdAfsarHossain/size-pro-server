// Helper function for payload validation
export const validateRefereePayload = (payload: any): string[] => {
    const errors: string[] = [];

    if (!payload) return errors;

    // Experience validation
    if (payload.experience !== undefined) {
        if (typeof payload.experience !== 'number' || payload.experience < 0) {
            errors.push("Experience must be a positive number");
        }
        if (payload.experience > 50) {
            errors.push("Experience cannot exceed 50 years");
        }
    }

    // License validation
    if (payload.licenseValid) {
        const licenseDate = new Date(payload.licenseValid);
        if (licenseDate <= new Date()) {
            errors.push("License validity must be a future date");
        }
    }

    // Level validation
    const validLevels = ['INTERNATIONAL_LEVEL', 'NATIONAL_LEVEL', 'REGIONAL_LEVEL'];
    if (payload.level && !validLevels.includes(payload.level)) {
        errors.push(`Invalid referee level. Must be one of: ${validLevels.join(', ')}`);
    }

    return errors;
}
