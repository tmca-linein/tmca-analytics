export type User = {
    id: string;
    firstName: string;
    lastName: string;
    primaryEmail?: string;
    anfAddedToday: number;
    anfRemovedToday: number;
    anfAddedThisWeek: number;
    anfRemovedThisWeek: number;
    anfAddedThisMonth: number;
    anfRemovedThisMonth: number;
};