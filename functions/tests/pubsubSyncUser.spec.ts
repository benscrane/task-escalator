import 'jest';
import '../testHelpers/mockFirebaseSetup';
import {
    TaskalatorTaskData,
    TempTask,
    TodoistTaskData,
    TaskalatorUserData
} from '../src/types';

import * as pubsubSyncUser from '../src/pubsubSyncUser';

describe('Module: pubsubSyncUser', () => {

    describe('Function: filterTasks', () => {
        const recurringTask: TempTask = {
            id: 1,
            due: {
                is_recurring: true,
            },
        };

        const validTask: TempTask = {
            id: 2,
            due: {
                is_recurring: false,
            },
            checked: false,
        };

        const noDueDateTask: TempTask = {
            id: 3,
            checked: false,
        };

        const completedTask: TempTask = {
            id: 4,
            due: {
                is_recurring: false,
            },
            checked: true,
        };

        it('should filter tasks we don\'t care about', () => {
            const items: TempTask[] = [
                recurringTask,
                validTask,
                noDueDateTask,
                completedTask,
            ];

            const output = pubsubSyncUser.filterTasks(items);
            expect(output).toStrictEqual([ validTask ]);
        });
    });

    describe('Function: determineActionNeeded', () => {
        let taskaltorData: TaskalatorTaskData;
        let todoistData: TodoistTaskData;
        let userData: TaskalatorUserData;

        beforeEach(() => {
            taskaltorData = {
                current_priority: 2,
            };

            todoistData = {
                priority: 4,
                taskId: 100,
                due_date_utc: 'temp',
                content: 'Test task',
            };

            userData = {
                p2Days: 7,
            };
        });

        it('should return UPDATE if incoming task has new priority', () => {
            taskaltorData.current_priority = 1;
            todoistData.priority = 2;

            const input = {
                taskalatorTaskData: taskaltorData,
                todoistTaskData: todoistData,
                userData,
            };
            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('UPDATE');
        });

        it('should return ESCALATE if past escalation days', () => {
            todoistData.priority = 3;
            taskaltorData.current_priority = 3;
            todoistData.due_date_utc = '2020-08-04';
            taskaltorData.current_due_date_utc = '2020-08-01T00:00:00Z';
            userData.p2Days = 2;

            const input = {
                taskalatorTaskData: taskaltorData,
                todoistTaskData: todoistData,
                userData,
            };

            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('ESCALATE');
        });

        it('should return UPDATE if user has no escalation days set', () => {
            todoistData.priority = 3;
            taskaltorData.current_priority = 3;
            todoistData.due_date_utc = '2020-08-04';
            taskaltorData.current_due_date_utc = '2020-08-01T00:00:00Z';
            delete userData.p2Days;

            const input = {
                taskalatorTaskData: taskaltorData,
                todoistTaskData: todoistData,
                userData,
            };

            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('UPDATE');
        });

        it('should return UPDATE if not past escalation days', () => {
            todoistData.priority = 3;
            taskaltorData.current_priority = 3;
            todoistData.due_date_utc = '2020-08-04';
            taskaltorData.current_due_date_utc = '2020-08-01T00:00:00Z';
            userData.p2Days = 5;

            const input = {
                taskalatorTaskData: taskaltorData,
                todoistTaskData: todoistData,
                userData,
            };

            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('UPDATE');
        });
    });
});
