export interface UserPubSubMessage {
    data: string;
}

export interface PubsubMessageData {
    todoistId: string;
}

export interface TaskPubSubMessage {
    message: {
        data: string;
    };
}

// TODO: why are UserPSMessage and TaskPSMessage different?

export interface TaskalatorUserData {
    oauthToken?: string;
    syncToken?: string;
    doc_id?: string;
}

export interface TodoistTaskData {
    priority: number;
    taskId: string;
    content: string;
    due_date_utc: string;
}

export interface TaskalatorTaskData {

}

export type TaskalatorAction = 'ESCALATE' | 'UPDATE';

export interface TaskActionInfo {
    oauthToken?: string;
    todoistTaskData: TodoistTaskData;
    taskalatorTaskData?: TaskalatorTaskData;
    userData?: TaskalatorUserData;
    action?: TaskalatorAction;
}

export interface TodoistSyncData {
    sync_token: string;
}
