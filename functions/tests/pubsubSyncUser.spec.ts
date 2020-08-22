import 'jest';
import axios from 'axios';
import {
    Taskalator,
    TempTask,
    Todoist,
} from '../src/types';
import '../testHelpers/mockFirebaseSetup';

import * as pubsubSyncUser from '../src/pubsubSyncUser';

const axiosPostSpy: jest.SpyInstance = jest.spyOn(axios, 'post');

describe('Module: pubsubSyncUser', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Function: getTodoistSync', () => {
        const taskalatorUser: Taskalator.User = {
            oauthToken: 'oauthToken',
            syncToken: 'syncToken',
        };
        
        it('should call axios with correct request', async () => {
            axiosPostSpy.mockResolvedValueOnce({});

            await pubsubSyncUser.getTodoistSync(taskalatorUser);
            expect(axiosPostSpy.mock.calls[0][0]).toEqual(
                'https://api.todoist.com/sync/v8/sync'
            );
            expect(axiosPostSpy.mock.calls[0][1]).toEqual(
                'token=oauthToken&sync_token=syncToken&resource_types=%5B%22items%22%5D'
            );
        });

        it('should return response data from axios call', async () => {
            const syncData: Todoist.SyncResponse = {
                sync_token: 'abcd',
            };

            axiosPostSpy.mockResolvedValueOnce({
                data: syncData,
            });

            const output = await pubsubSyncUser.getTodoistSync(taskalatorUser);
            expect(output).toStrictEqual(syncData);
        });
    });

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
        let taskalatorTask: Taskalator.Task;
        let todoistTask: Todoist.Task;
        let user: Taskalator.User;

        beforeEach(() => {
            taskalatorTask = {
                current_priority: 2,
            };

            todoistTask = {
                priority: 4,
                taskId: 100,
                due_date_utc: 'temp',
                content: 'Test task',
            };

            user = {
                p2Days: 7,
            };
        });

        it('should return UPDATE if incoming task has new priority', () => {
            taskalatorTask.current_priority = 1;
            todoistTask.priority = 2;

            const input: pubsubSyncUser.DetermineActionNeededInfo = {
                taskalatorTask,
                todoistTask,
                user,
            };
            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('UPDATE');
        });

        it('should return ESCALATE if past escalation days', () => {
            todoistTask.priority = 3;
            taskalatorTask.current_priority = 3;
            todoistTask.due_date_utc = '2020-08-03';
            taskalatorTask.current_due_date_utc = '2020-08-01T00:00:00Z';
            user.p2Days = 2;

            const input: pubsubSyncUser.DetermineActionNeededInfo = {
                taskalatorTask,
                todoistTask,
                user,
            };

            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('ESCALATE');
        });

        it('should return UPDATE if user has no escalation days set', () => {
            todoistTask.priority = 3;
            taskalatorTask.current_priority = 3;
            todoistTask.due_date_utc = '2020-08-04';
            taskalatorTask.current_due_date_utc = '2020-08-01T00:00:00Z';
            delete user.p2Days;

            const input: pubsubSyncUser.DetermineActionNeededInfo = {
                taskalatorTask,
                todoistTask,
                user,
            };

            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('UPDATE');
        });

        it('should return UPDATE if not past escalation days', () => {
            todoistTask.priority = 3;
            taskalatorTask.current_priority = 3;
            todoistTask.due_date_utc = '2020-08-04';
            taskalatorTask.current_due_date_utc = '2020-08-01T00:00:00Z';
            user.p2Days = 5;

            const input: pubsubSyncUser.DetermineActionNeededInfo = {
                taskalatorTask,
                todoistTask,
                user,
            };

            const output = pubsubSyncUser.determineActionNeeded(input);
            expect(output).toEqual('UPDATE');
        });
    });

    describe('Function: formatTodoistTask', () => {
        it('should format the task correctly', () => {
            const input: TempTask = {
                id: 100,
                content: 'test task',
                priority: '2',
                due: {
                    date: '2020-09-01',
                    is_recurring: false,
                }
            };
    
            const expectedOutput: Todoist.Task = {
                content: 'test task',
                taskId: 100,
                priority: 2,
                due_date_utc: '2020-09-01T00:00:00Z'
            };
    
            const output = pubsubSyncUser.formatTodoistTask(input);
            expect(output).toStrictEqual(expectedOutput);
        });
    });
});
