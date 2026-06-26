// Helper function for payload validation
export const validateLeagueOfficialsPayload = (payload: any): string[] => {
    const errors: string[] = [];

    if (!payload) return errors;

    // License validation
    if (payload.licenseValid) {
        const licenseDate = new Date(payload.licenseValid);
        if (licenseDate <= new Date()) {
            errors.push("License validity must be a future date");
        }
    }

    // Rounded validation (if provided)
    if (payload.founded !== undefined && payload.founded !== null) {
        if (typeof payload.founded !== 'number' || !Number.isInteger(payload.founded)) {
            errors.push("Founded must be an integer");
        } else if (payload.founded < 0) {
            errors.push("Founded cannot be negative");
        }
    }

    // Level validation
    const validLevels = ['INTERNATIONAL_LEVEL', 'NATIONAL_LEVEL', 'REGIONAL_LEVEL'];
    if (payload.level && !validLevels.includes(payload.level)) {
        errors.push(`Invalid League Officials level. Must be one of: ${validLevels.join(', ')}`);
    }

    // String field length validations
    if (payload.officialName && payload.officialName.length > 100) {
        errors.push("Official name cannot exceed 100 characters");
    }

    if (payload.officialDesignation && payload.officialDesignation.length > 100) {
        errors.push("Official designation cannot exceed 100 characters");
    }

    if (payload.organizationId && payload.organizationId.length > 50) {
        errors.push("Organization ID cannot exceed 50 characters");
    }

    if (payload.country && payload.country.length > 50) {
        errors.push("Country cannot exceed 50 characters");
    }

    // Email validation
    if (payload.officialEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payload.officialEmail)) {
            errors.push("Official email must be a valid email address");
        }
    }

    if (payload.certifyingAuthority && payload.certifyingAuthority.length > 100) {
        errors.push("Certifying authority cannot exceed 100 characters");
    }

    return errors;
}
