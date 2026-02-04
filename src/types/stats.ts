export type UserANFActivity = {
    addedDay: number;
    addedWeek: number;
    addedMonth: number;
    addedLastMonth: number;
    removedDay: number;
    removedWeek: number;
    removedMonth: number;
    removedLastMonth: number;
}

export type BulkUserANFActivity = {
    assignedUserId: string;
} & UserANFActivity;

export type SpaceItemANFActivity = UserANFActivity;

export type BulkSpaceItemANFActivity = {
    root_id: string;
} & SpaceItemANFActivity;


export type ANFDuration = {
    granularity: string;
    bucket: string;
    assignedUserId: string;
    root_id: string;
    avgduration: number;
    topfiveavgduration: number;
    transitions_count: number;
    overdue_count: number;
    avgoverduehours: number;
}

export type ANFLongDurationItem = {
    id: string,
    wrikeItemId: string,
    scope: string,
    added_at: Date,
    duration_hours: number
}


export type UserCommentActivity = {
    countDay: number,
    countWeek: number,
    countMonth: number,
    countLastMonth: number,
    avgWordCountDay: number,
    avgWordCountWeek: number,
    avgWordCountMonth: number,
    avgWordCountLastMonth: number
}

export type BulkUserCommentActivity = { userId: string } & UserCommentActivity;

export type SpaceItemCommentActivity = UserCommentActivity;

export type BulkSpaceItemCommentActivity = { root_id: string } & SpaceItemCommentActivity;

export type SpaceItemMetricData =
    | { kind: 'ANF_ACTIVITY', data: BulkSpaceItemANFActivity }
    | { kind: 'ANF_DURATION', data: ANFDuration }
    | { kind: 'COMMENT_ACTIVITY', data: BulkSpaceItemCommentActivity };


export type DisplayItemMetrics = {
    id?: string;
    day: string;
    wrikeItemId?: string,
    anfAddedDay?: number | null;
    anfAddedWeek?: number | null;
    anfAddedMonth?: number | null;
    anfAddedLastMonth?: number | null;
    anfRemovedDay?: number | null;
    anfRemovedWeek?: number | null;
    anfRemovedMonth?: number | null;
    anfRemovedLastMonth?: number | null;
    bucketWeek?: string | null;
    avgDurationWeek?: number | null;
    topFiveAvgDurationWeek?: number | null;
    transitionsCountWeek?: number | null;
    overdueCountWeek?: number | null;
    avgOverdueHoursWeek?: number | null;
    bucketMonth?: string | null;
    avgDurationMonth?: number | null;
    topFiveAvgDurationMonth?: number | null;
    transitionsCountMonth?: number | null;
    overdueCountMonth?: number | null;
    avgOverdueHoursMonth?: number | null;
    bucketLastMonth?: string | null;
    avgDurationLastMonth?: number | null;
    topFiveAvgDurationLastMonth?: number | null;
    transitionsCountLastMonth?: number | null;
    overdueCountLastMonth?: number | null;
    avgOverdueHoursLastMonth?: number | null;
    countDay?: number | null;
    countWeek?: number | null;
    countMonth?: number | null;
    countLastMonth?: number | null;
    avgWordCountDay?: number | null;
    avgWordCountWeek?: number | null;
    avgWordCountMonth?: number | null;
    avgWordCountLastMonth?: number | null;
}

export type DisplayItemUserMetrics = DisplayItemMetrics & { userId: string }

export type ActionItem = {
    id: string;
    title: string;
    actionNeededFromDate: string;
    actionNeededUntilDate: string;
    overdueDuration: number;
    type: "ANF" | "NANFA" | "DTMBF";
    description: string;
    link: string;
};

export type ActivityItem = {
    id: string;
    title: string;
    date: string;
    description: string;
    type: "ANF" | "comment";
    link: string;
};

export type AnfStatsRow = { date: string; added: number; removed: number };
export type CommentsRow = { date: string; comments: number };

export type AttentionItem = {
    id: number;
    title: string;
    description?: string;
    date: string;
    status: "overdue" | "today" | "upcoming" | "completed";
    time?: string;
    link: string;
};

export type SeriesDef<T> = {
    key: keyof T
    label: string
    color?: string
}
export type SelectFilterDef<TData> = {
    id: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    defaultValue: string;
    apply: (row: TData, selectedValue: string, allRows: TData[]) => boolean;
    /** Optional: hide the filter entirely based on data */
    hidden?: (allRows: TData[]) => boolean;
    /** Optional: custom trigger className */
    triggerClassName?: string;
};
