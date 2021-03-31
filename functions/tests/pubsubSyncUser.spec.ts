import 'jest';
import axios from 'axios';
import * as firebaseAdmin from 'firebase-admin';
import { omit } from 'lodash';
import {
    Taskalator,
    TempTask,
    Todoist,
} from '../src/types';
import './helpers/mockFirebaseSetup';

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

        it('should throw if oauthToken is missing', async () => {
            await expect(
                pubsubSyncUser.getTodoistSync(omit(taskalatorUser, 'oauthToken'))
            ).rejects.toThrow();
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
        let taskInput: TempTask;

        beforeEach(() => {
            taskInput = {
                id: 100,
                content: 'test task',
                priority: '2',
                due: {
                    date: '2020-09-01',
                    is_recurring: false,
                }
            };
        });

        it('should format the task correctly', () => {
            const expectedOutput: Todoist.Task = {
                content: 'test task',
                taskId: 100,
                priority: 2,
                due_date_utc: '2020-09-01T00:00:00Z'
            };
    
            const output = pubsubSyncUser.formatTodoistTask(taskInput);
            expect(output).toStrictEqual(expectedOutput);
        });

        it('should throw if priority is missing', () => {
            delete taskInput.priority;

            expect(() => {
                pubsubSyncUser.formatTodoistTask(taskInput);
            }).toThrow();
        });

        it('should throw if content is missing', () => {
            delete taskInput.content;
            
            expect(() => {
                pubsubSyncUser.formatTodoistTask(taskInput);
            }).toThrow();
        });

        it('should throw if date is missing', () => {
            delete taskInput.due;
            
            expect(() => {
                pubsubSyncUser.formatTodoistTask(taskInput);
            }).toThrow();
        });
    });

    describe('Function: updateSyncToken', () => {
        let setMock: jest.MockedFunction<(...args: any[]) => any>;
        let docMock: jest.MockedFunction<(...args: any[]) => any>;
        beforeEach(() => {
            setMock = jest.fn();
            docMock = jest.fn(() => ({ set: setMock }));
            jest.spyOn(firebaseAdmin.firestore(), 'collection')
                .mockReturnValue(({ doc: docMock } as unknown) as any);
        });

        afterEach(() => {
            jest.restoreAllMocks;
        });

        it('should call set with the new token', async () => {
            const input = {
                userDocId: 'abcd',
                newSyncToken: '1234',
            };
            await pubsubSyncUser.updateSyncToken(input);

            expect(setMock).toHaveBeenCalledWith({
                syncToken: '1234'
            }, {
                merge: true
            });
        });

        it('should get the document with the passed in id', async () => {
            const input = {
                userDocId: 'abcd',
                newSyncToken: '1234',
            };
            await pubsubSyncUser.updateSyncToken(input);

            expect(docMock).toHaveBeenCalledWith('abcd');
        });
    });

    describe('Function: loadTaskalatorTask', () => {
        let dataMock: jest.MockedFunction<(...args: any[]) => any>;
        let getMock: jest.MockedFunction<(...args: any[]) => any>;
        let docMockOne: jest.MockedFunction<(...args: any[]) => any>;
        let docMockTwo: jest.MockedFunction<(...args: any[]) => any>;
        let collectionMock: jest.MockedFunction<(...args: any[]) => any>;

        const fakeDocData = {
            stuff: 'here',
        };

        beforeEach(() => {
            dataMock = jest.fn(() => fakeDocData);
            getMock = jest.fn(() => ({
                exists: true,
                data: dataMock,
            }));
            docMockTwo = jest.fn(() => ({
                get: getMock,
            }));
            collectionMock = jest.fn(() => ({
                doc: docMockTwo,
            }));
            docMockOne = jest.fn(() => ({
                collection: collectionMock,
            }));
            jest.spyOn(firebaseAdmin.firestore(), 'collection')
                .mockReturnValue(({ doc: docMockOne } as unknown) as any);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should return doc data if doc exists', async () => {
            const input = {
                userId: '1234',
                taskId: 'abcd',
            };

            const result = await pubsubSyncUser.loadTaskalatorTask(input);
            expect(result).toEqual(fakeDocData);
        });

        it('should return empty object if doc does not exist', async () => {
            const input = {
                userId: '1234',
                taskId: 'abcd',
            };

            getMock.mockReturnValue({
                exists: false,
            });

            const result = await pubsubSyncUser.loadTaskalatorTask(input);
            expect(result).toEqual({});
        });
    });
});
