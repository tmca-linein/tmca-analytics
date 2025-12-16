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
    subRows?: User[];
};

export interface WrikeApiUserGroupResponse {
    data: ApiWrikeUserGroup[]
}

export type ApiWrikeUserGroup = {
    id: string;
    accountId: string;
    title: string;
    memberIds: string[];
    childIds: string[];
    parentIds: string[]
    avatarUrl: string;
    myteam?: boolean;
};

export interface WrikeApiContactsResponse {
    data: ApiWrikeUser[]
}

export type ApiWrikeUser = {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
    avatarUrl?: string;
    deleted: boolean
    profiles?: unknown;
    locale: string;
    timezone: string;
    me?: boolean;
    title?: string;
    memberIds?: string[];
    companyName?: string;
    myTeam?: boolean;
    userTypeId: string;
    primaryEmail?: string;
};


export interface WrikeLegacyIdConversionResponse {
    data: ApiWrikeLegacyUserIdConversion[]
}

export type ApiWrikeLegacyUserIdConversion = {
    id: string;
    apiV2Id: string;
}