export type UserANFActivity = {
    addedToday: number;
    addedWeek: number;
    addedMonth: number;
    addedTotal: number;
    removedToday: number;
    removedWeek: number;
    removedMonth: number;
    removedTotal: number;
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
    added_at: Date,
    duration_hours: number
}


export type UserCommentActivity = {
    countToday: number,
    countWeek: number,
    countMonth: number,
    countTotal: number,
    avgWordCountToday: number
    avgWordCountWeek: number
    avgWordCountMonth: number
}

export type BulkUserCommentActivity = { userId: string } & UserCommentActivity;

export type SpaceItemCommentActivity = UserCommentActivity;

export type BulkSpaceItemCommentActivity = { root_id: string } & SpaceItemCommentActivity;

export type SpaceItemMetricData =
    | { kind: 'ANF_ACTIVITY', data: BulkSpaceItemANFActivity }
    | { kind: 'ANF_DURATION', data: ANFDuration }
    | { kind: 'COMMENT_ACTIVITY', data: BulkSpaceItemCommentActivity };


export type DisplayItemMetrics = {
    anfAddedToday?: number;
    anfAddedThisWeek?: number;
    anfAddedThisMonth?: number;
    anfRemovedToday?: number;
    anfRemovedThisWeek?: number;
    anfRemovedThisMonth?: number;
    anfDurationWeek?: number;
    anfDurationMonth?: number;
    anfDurationQuarter?: number;
    anfTopFiveDurationWeek?: number;
    anfTopFiveDurationMonth?: number;
    anfTopFiveDurationQuarter?: number;
    anfOverdueWeek?: number;
    anfOverdueMonth?: number;
    anfOverdueQuarter?: number;
    anfOverdueCountsWeek?: number;
    anfOverdueCountsMonth?: number;
    anfOverdueCountsQuarter?: number;
    anfTransitionCountsWeek?: number;
    anfTransitionCountsMonth?: number;
    anfTransitionCountsQuarter?: number;
    commentsToday?: number;
    commentsThisWeek?: number;
    commentsThisMonth?: number;
    commentAvgWordCountToday?: number;
    commentAvgWordCountThisWeek?: number;
    commentAvgWordCountThisMonth?: number;
}