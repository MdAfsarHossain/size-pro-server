// import { Day } from "@prisma/client";

export interface OpeningHourPayload {
    // day: Day;
    openTime: string;
    closeTime: string;
    isOpen?: boolean;
}

export interface UpdateOpeningHourPayload {
    openTime?: string;
    closeTime?: string;
    isOpen?: boolean;
}