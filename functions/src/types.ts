// tslint:disable:no-namespace

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

export interface TaskActionInfo {
    oauthToken?: string;
    todoistTaskData: Todoist.Task;
    taskalatorTaskData?: Taskalator.Task;
    userData?: Taskalator.User;
    action?: Taskalator.Action;
}

export interface TempTask {
    due?: {
        is_recurring: boolean;
        timezone?: string;
        date?: string;
    };
    checked?: boolean;
    id: number;
    content?: string;
    priority?: string;
}

export namespace Taskalator {
    export type Action = 'ESCALATE' | 'UPDATE';

    export interface Task {
        current_priority?: number;
        current_due_date_utc? : string;
        content?: string;
        original_due_date_utc?: string;
    }

    export interface User {
        oauthToken?: string;
        syncToken?: string;
        doc_id?: string;
        p2Days?: number;
        p3Days?: number;
        p4Days?: number;
        todoistLinked?: boolean;
        todoistUserId?: number;
    }
}

export namespace Todoist {
    export interface Task {
        priority: number;
        taskId: number;
        content: string;
        due_date_utc: string;
    }

    export interface SyncResponse {
        sync_token: string;
    }
}
