import 'jest';
import axios from 'axios';
import * as firebaseAdmin from 'firebase-admin';
import { omit } from 'lodash';
import {
    Taskalator,
    TempTask,
    Todoist,
    TaskActionInfo,
    UserPubSubMessage,
} from '../src/types';
import './helpers/mockFirebaseSetup';

import * as pubsubSyncUser from '../src/pubsubSyncUser';

describe('Module: pubsubSyncUser', () => {
    let axiosPostSpy: jest.SpyInstance

    beforeEach(() => {
        axiosPostSpy = jest.spyOn(axios, 'post')
            .mockResolvedValue({});
    });

    afterEach(() => {
        jest.restoreAllMocks();
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
                due_date_utc: '2020-09-01T00:00:00.000Z'
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

    describe('Function: escalateTodoistTask', () => {
        let input: TaskActionInfo;

        beforeEach(() => {
            input = {
                oauthToken: 'abcd',
                todoistTaskData: {
                    priority: 2,
                    taskId: 2,
                    content: 'stuff',
                    due_date_utc: '2021-01-01T12:00:00Z'
                },
            };
        });

        it('should throw if no auth token', async () => {
            delete input.oauthToken;
            
            await expect(pubsubSyncUser.escalateTodoistTask(input))
                .rejects
                .toThrow(/Missing oauth token/);
        });

        it('should call axios', async () => {
            await pubsubSyncUser.escalateTodoistTask(input);

            expect(axiosPostSpy.mock.calls[0][0]).toEqual(
                'https://api.todoist.com/sync/v8/sync',
            );
            const qs = axiosPostSpy.mock.calls[0][1];
            expect(qs).toContain('token=abcd');
            expect(qs).toContain('uuid');
            expect(qs).toContain('item_update');
            expect(qs).toContain('id');
            expect(qs).toContain('priority');
        });

        it('should not escalate if priority is already 4', async () => {
            input.todoistTaskData.priority = 4;

            await pubsubSyncUser.escalateTodoistTask(input);

            expect(axiosPostSpy).not.toHaveBeenCalled();
        });

    });

    describe('Function: loadUserData', () => {
        let dataMock: jest.MockedFunction<(...args: any[]) => any>;
        let docMock: jest.MockedFunction<any>;
        let getMock: jest.MockedFunction<(...args: any[]) => any>;

        let whereMock: jest.MockedFunction<(...args: any[]) => any>;
        let collectionMock: jest.SpyInstance;

        const todoistId = 'abcd';

        const userDoc: Taskalator.User = {
            todoistLinked: true,
            todoistUserId: 1234,
        };

        beforeEach(() => {
            dataMock = jest.fn(() => userDoc);
            docMock = {
                data: dataMock,
                id: 'docId',
            };
            getMock = jest.fn(() => ({
                docs: [
                    docMock,
                ],
            }));

            whereMock = jest.fn(() => ({
                get: getMock
            }))
            collectionMock = jest.spyOn(firebaseAdmin.firestore(), 'collection')
                .mockReturnValue(({ where: whereMock } as unknown) as any);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call collection with users', async () => {
            await pubsubSyncUser.loadUserData(todoistId);

            expect(collectionMock).toHaveBeenCalledWith('users');
        });

        it('should call where', async () => {
            await pubsubSyncUser.loadUserData(todoistId);

            expect(whereMock.mock.calls[0]).toEqual([
                'todoistUserId',
                '==',
                todoistId,
            ]);
        });


        it('should return user data', async () => {
            const result = await pubsubSyncUser.loadUserData(todoistId);

            expect(result).toEqual({
                ...userDoc,
                doc_id: 'docId',
            });
        });

        it('should call rollbar with error', async () => {

            dataMock.mockImplementation(() => {
                throw new Error('data error');
            });

            await expect(pubsubSyncUser.loadUserData(todoistId))
                .rejects
                .toThrow(/data error/);
        });
    });
    
    describe('Function: pubsubSyncUser', () => {
        let loadUserDataSpy: jest.SpyInstance;
        let getTodoistSyncSpy: jest.SpyInstance;
        let processTaskChangesSpy: jest.SpyInstance;

        const todoistId = 'todoistId';
        const data: string = JSON.stringify({
            todoistId,
        });
        const base64 = Buffer.from(data).toString('base64');
        const message: UserPubSubMessage = {
            data: base64
        };

        const userData: Taskalator.User = {
            todoistUserId: 1,
        };

        const syncResponse: Todoist.SyncResponse = {
            sync_token: 'syncToken',
        };


        beforeEach(() => {
            loadUserDataSpy = jest.spyOn(pubsubSyncUser, 'loadUserData')
                .mockResolvedValue(userData);

            getTodoistSyncSpy = jest.spyOn(pubsubSyncUser, 'getTodoistSync')
                .mockResolvedValue(syncResponse);

            processTaskChangesSpy = jest.spyOn(pubsubSyncUser, 'processTaskUpdates')
                .mockResolvedValue();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call loadUserData with todoist id', async () => {
            await pubsubSyncUser.pubsubSyncUser(message);

            expect(loadUserDataSpy).toHaveBeenCalledWith('todoistId');
        });

        it('should call getTodoistSync', async () => {
            await pubsubSyncUser.pubsubSyncUser(message);
            loadUserDataSpy.mockResolvedValue(userData);

            expect(getTodoistSyncSpy).toHaveBeenCalledWith(userData);
        });

        it('should call processTaskChanges', async () => {
            await pubsubSyncUser.pubsubSyncUser(message);

            expect(processTaskChangesSpy.mock.calls[0]).toEqual([
                syncResponse,
                userData,
            ]);
        });
    });

    describe('Function: processTaskUpdates', () => {
        let handleSingleTaskSpy: jest.SpyInstance;
        let filterTasksSpy: jest.SpyInstance;
        let updateSyncTokenSpy: jest.SpyInstance;
        
        const syncResponse: Todoist.SyncResponse = {
            sync_token: 'syncToken',
            items: [{
                id: 1,
            }, {
                id: 2,
            }],
        };
        const userData: Taskalator.User = {
            todoistUserId: 1,
            doc_id: 'docId',
        };

        beforeEach(() => {
            handleSingleTaskSpy = jest.spyOn(pubsubSyncUser, 'handleSingleTask')
                .mockResolvedValue();

            filterTasksSpy = jest.spyOn(pubsubSyncUser, 'filterTasks')
                .mockReturnValue(syncResponse.items!);

            updateSyncTokenSpy = jest.spyOn(pubsubSyncUser, 'updateSyncToken')
                .mockResolvedValue();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call handleSingleTask', async () => {
            await pubsubSyncUser.processTaskUpdates(syncResponse, userData);

            expect(handleSingleTaskSpy).toHaveBeenCalledTimes(2);
            expect(handleSingleTaskSpy.mock.calls).toEqual([
                [
                    syncResponse.items![0],
                    userData,
                ], [
                    syncResponse.items![1],
                    userData,
                ],
            ]);
        });

        it('should call filterTasks', async () => {
            await pubsubSyncUser.processTaskUpdates(syncResponse, userData);

            expect(filterTasksSpy).toHaveBeenCalled();
        });

        it('should stop if no filtered tasks', async () => {
            filterTasksSpy.mockReturnValue([]);

            await pubsubSyncUser.processTaskUpdates(syncResponse, userData);

            expect(handleSingleTaskSpy).not.toHaveBeenCalled();
            expect(updateSyncTokenSpy).not.toHaveBeenCalled();
        });

        it('should call updateSyncToken', async () => {
            await pubsubSyncUser.processTaskUpdates(syncResponse, userData);

            expect(updateSyncTokenSpy).toHaveBeenCalledWith({
                newSyncToken: 'syncToken',
                userDocId: 'docId',
            });
        });
    });

    describe('Function: handleSingleTask', () => {
        let loadTaskalatorTaskSpy: jest.SpyInstance;
        let formatTodoistTaskSpy: jest.SpyInstance;
        let determineActionNeededSpy: jest.SpyInstance;
        let updateFirestoreTaskSpy: jest.SpyInstance;
        let escalateTodoistTaskSpy: jest.SpyInstance;
        let addEscalatedTaskSpy: jest.SpyInstance;

        const item: TempTask = {
            id: 1,
            content: 'stuff',
            priority: '2',
            due: {
                is_recurring: false,
                date: '2021-04-04T12:00:00Z',
            },
        };
        const todoistTask: Todoist.Task = {
            priority: 2,
            content: 'stuff',
            taskId: 1,
            due_date_utc: '2021-04-04T12:00:00Z',
        };
        const userData: Taskalator.User = {
            todoistUserId: 1,
            doc_id: 'abcd',
            oauthToken: 'authToken',
        };
        const taskalatorTask: Taskalator.Task = {
            content: 'stuff',
        };

        beforeEach(() => {
            loadTaskalatorTaskSpy = jest.spyOn(pubsubSyncUser, 'loadTaskalatorTask')
                .mockResolvedValue(taskalatorTask);

            formatTodoistTaskSpy = jest.spyOn(pubsubSyncUser, 'formatTodoistTask')
                .mockReturnValue(todoistTask);

            determineActionNeededSpy = jest.spyOn(pubsubSyncUser, 'determineActionNeeded')
                .mockReturnValue('UPDATE');
            
            updateFirestoreTaskSpy = jest.spyOn(pubsubSyncUser, 'updateFirestoreTask')
                .mockResolvedValue();
            
            escalateTodoistTaskSpy = jest.spyOn(pubsubSyncUser, 'escalateTodoistTask')
                .mockResolvedValue();

            addEscalatedTaskSpy = jest.spyOn(pubsubSyncUser, 'addEscalatedTask')
                .mockResolvedValue();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should load taskalator task data', async () => {
            await pubsubSyncUser.handleSingleTask(item, userData);

            expect(loadTaskalatorTaskSpy).toHaveBeenCalledWith({
                taskId: 1,
                userId: 'abcd',
            });
        });

        it('should call formatTodoistTask', async () => {
            await pubsubSyncUser.handleSingleTask(item, userData);

            expect(formatTodoistTaskSpy).toHaveBeenCalledWith(item);
        });

        it('should call determineActionNeeded', async () => {
            await pubsubSyncUser.handleSingleTask(item, userData);

            expect(determineActionNeededSpy).toHaveBeenCalledWith({
                taskalatorTask,
                todoistTask,
                user: userData,
            });
        });

        it('should update firestore task if action is \'UPDATE\'', async () => {
            determineActionNeededSpy.mockReturnValue('UPDATE');

            await pubsubSyncUser.handleSingleTask(item, userData);

            expect(updateFirestoreTaskSpy).toHaveBeenCalledWith({
                taskalatorTaskData: taskalatorTask,
                todoistTaskData: todoistTask,
                userData,
            });
        });

        it('should escalate the task correctly', async () => {
            determineActionNeededSpy.mockReturnValue('ESCALATE');

            await pubsubSyncUser.handleSingleTask(item, userData);

            expect(escalateTodoistTaskSpy).toHaveBeenCalledWith({
                todoistTaskData: todoistTask,
                oauthToken: 'authToken',
            });
            expect(updateFirestoreTaskSpy).toHaveBeenCalledWith({
                taskalatorTaskData: taskalatorTask,
                todoistTaskData: todoistTask,
                userData,
            });
            expect(addEscalatedTaskSpy).toHaveBeenCalledWith({
                todoistTaskData: todoistTask,
                userData,
            });
        });
    });

    describe('Function: updateFirestoreTask', () => {
        let setMock: jest.MockedFunction<any>;
        let docMockTwo: jest.MockedFunction<any>;
        let collectionMock: jest.MockedFunction<any>;
        let docMockOne: jest.MockedFunction<any>;
        let collectionSpy: jest.SpyInstance;

        let todoistTask: Todoist.Task;
        let userData: Taskalator.User;
        let taskalatorTask: Taskalator.Task;

        let input: TaskActionInfo;

        beforeEach(() => {
            setMock = jest.fn().mockResolvedValue({});
            docMockTwo = jest.fn(() => ({
                set: setMock,
            }));
            collectionMock = jest.fn(() => ({
                doc: docMockTwo,
            }));
            docMockOne = jest.fn(() => ({
                collection: collectionMock,
            }));
            collectionSpy = jest.spyOn(firebaseAdmin.firestore(), 'collection')
                .mockReturnValue(({ doc: docMockOne } as unknown) as any);

            todoistTask = {
                priority: 2,
                content: 'stuff',
                taskId: 1,
                due_date_utc: '2021-04-04T12:00:00Z',
            };
            userData = {
                todoistUserId: 1,
                doc_id: 'abcd',
                oauthToken: 'authToken',
            };
            taskalatorTask = {
                content: 'stuff',
                current_due_date_utc: '2021-03-01T12:00:00Z',
            };

            input = {
                taskalatorTaskData: taskalatorTask,
                todoistTaskData: todoistTask,
                userData,
                action: 'ESCALATE',
            };
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should throw if todoistPriority is invalid', async () => {
            input = {
                ...input,
                todoistTaskData: {},
            } as any;

            await expect(pubsubSyncUser.updateFirestoreTask(input))
                .rejects.toThrow(/Bad todoist data/);
        });

        it('should save new tasks', async () => {
            input.action = 'UPDATE';

            await pubsubSyncUser.updateFirestoreTask(input);

            expect(collectionSpy).toHaveBeenCalledWith('users');
            expect(docMockOne).toHaveBeenCalledWith('abcd');
            expect(collectionMock).toHaveBeenCalledWith('trackedTasks');
            expect(docMockTwo).toHaveBeenCalledWith('1');
            expect(setMock.mock.calls[0]).toEqual([
                {
                    content: 'stuff',
                    current_due_date_utc: '2021-04-04T12:00:00Z',
                    original_due_date_utc: '2021-04-04T12:00:00Z',
                    current_priority: 2,
                }, {
                    merge: true,
                }
            ]);
        });

        it('should not escalate priority if already a 4', async () => {
            input.action = 'ESCALATE';
            todoistTask.priority = 4;

            await pubsubSyncUser.updateFirestoreTask(input);

            expect(setMock.mock.calls[0][0]['current_priority']).toEqual(4)
        });

        it('should reset original due date if incoming priority is changing', async () => {
            taskalatorTask.current_priority = 2;
            todoistTask.priority = 3;
            input.action = 'UPDATE';
            todoistTask.due_date_utc = '2022-01-01T12:00:00Z';

            await pubsubSyncUser.updateFirestoreTask(input);
            expect(setMock.mock.calls[0][0]['original_due_date_utc']).toEqual(todoistTask.due_date_utc);
        });
    });
});
