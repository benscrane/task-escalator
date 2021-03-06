import 'jest';
import './helpers/mockFirebaseSetup';
import { rollbar } from '../src/admin';
import { PubsubMessageData, TaskPubSubMessage } from '../src/types';
import * as chronFetchUpdatedTasks from '../src/chronFetchUpdatedTasks';

describe('Module: chronFetchUpdatedTasks', () => {
    describe('Function: chronFetchUpdatedTasks', () => {
        let fetchSpy: jest.SpyInstance;
        let processSpy: jest.SpyInstance;
        let ackSpy: jest.SpyInstance;
        let publishSpy: jest.SpyInstance;

        const testMsg1: TaskPubSubMessage = {
            message: {
                data: 'stuff',
            },
            ackId: '1',
        };
        const testMsg2: TaskPubSubMessage = {
            message: {
                data: 'stuff',
            },
            ackId: '2',
        };

        beforeEach(() => {
            jest.spyOn(chronFetchUpdatedTasks, 'getPubSubClient');
            fetchSpy = jest.spyOn(chronFetchUpdatedTasks, 'fetchPubSubMessages')
                .mockResolvedValue([testMsg1, testMsg2]);
            processSpy = jest.spyOn(chronFetchUpdatedTasks, 'processMessages')
                .mockReturnValue({
                    ackIds: ['1', '2'],
                    todoistUids: ['abcd'],
                });
            ackSpy = jest.spyOn(chronFetchUpdatedTasks, 'ackMessages')
                .mockResolvedValue();
            publishSpy = jest.spyOn(chronFetchUpdatedTasks, 'publishTodoistIds')
                .mockResolvedValue();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call all required functions', async () => {
            await chronFetchUpdatedTasks.chronFetchUpdatedTasks();

            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(processSpy).toHaveBeenCalled();
            expect(ackSpy).toHaveBeenCalled();
            expect(publishSpy).toHaveBeenCalled();
        });
    });

    describe('Function: fetchPubSubMessages', () => {
        const pullMock = jest.fn();
        const subPathMock = jest.fn().mockReturnValue('/subscription/path');
        const clientMock = {
            pull: pullMock,
            subscriptionPath: subPathMock,
        };

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should call client.pull', async () => {
            pullMock.mockResolvedValue([{
                receivedMessages: [{
                    stuff: 'here',
                }, {
                    another: 'message',
                }]
            }]);
            await chronFetchUpdatedTasks.fetchPubSubMessages(clientMock);
            expect(pullMock).toHaveBeenCalledWith({
                maxMessages: 100,
                returnImmediately: true,
                subscription: '/subscription/path',
            });
        });

        it('should throw if pull throws', async () => {
            pullMock.mockRejectedValue(undefined);
            expect(async () => {
                chronFetchUpdatedTasks.fetchPubSubMessages(clientMock);
            }).rejects.toThrow();
        });
    });

    describe('Function: getSubscriptionPath', () => {
        const clientMock = {
            subscriptionPath: () => '/subscription/path',
        };

        it('should call client.subscriptionPath', () => {
            const result = chronFetchUpdatedTasks.getSubscriptionPath(clientMock);
            expect(result).toEqual('/subscription/path');
        });
    });

    describe('Function: processMessages', () => {
        let extractSpy: jest.SpyInstance;

        beforeEach(() => {
            extractSpy = jest.spyOn(chronFetchUpdatedTasks, 'extractDataFromMsg');
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });
        
        it('should extract info correctly', () => {
            const messages: TaskPubSubMessage[] = [{
                message: {
                    data: 'stuff',
                },
                ackId: '1',
            }, {
                message: {
                    data: 'stuff',
                },
                ackId: '2',
            }, {
                message: {
                    data: 'stuff',
                },
                ackId: '3',
            }];

            extractSpy.mockReturnValueOnce({
                todoistId: 'abcd',
            });
            extractSpy.mockReturnValueOnce({
                todoistId: 'wxyz',
            });
            extractSpy.mockReturnValueOnce({
                todoistId: 'abcd',
            });

            const result = chronFetchUpdatedTasks.processMessages(messages);
            expect(result).toEqual({
                ackIds: [
                    '1',
                    '2',
                    '3',
                ],
                todoistUids: [
                    'abcd',
                    'wxyz',
                ],
            });
        })
    });

    describe('Function: extractDataFromMsg', () => {

        it('should extract data correctly', () => {
            const json: PubsubMessageData = {
                todoistId: 'abcd',
            };
            const buffer = Buffer.from(JSON.stringify(json));
            const base64 = buffer.toString('base64');
            const message: TaskPubSubMessage = {
                message: {
                    data: base64,
                },
                ackId: '1',
            };
            const expected = json;
            
            const result = chronFetchUpdatedTasks.extractDataFromMsg(message);
            expect(result).toEqual(expected);
        });
    });

    describe('Function: ackMessages', () => {
        const ackIds: string[] = [
            '1',
            '2',
        ];
        const ackMock = jest.fn();
        const clientMock = {
            acknowledge: ackMock,
            subscriptionPath: () => 'subscription',
        };

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should call client.acknowledge', async () => {
            await chronFetchUpdatedTasks.ackMessages(clientMock, ackIds);
            expect(ackMock).toHaveBeenCalledWith({
                subscription: 'subscription',
                ackIds,
            });
        });

        it('should not call client.acknowledge if no ack ids', async () => {
            await chronFetchUpdatedTasks.ackMessages(clientMock, []);
            expect(ackMock.mock.calls.length).toBe(0);
        });

        it('should throw if client.acknowledge fails', async () => {
            ackMock.mockRejectedValue(undefined);
            clientMock.acknowledge = jest.fn().mockRejectedValue({});

            await expect(chronFetchUpdatedTasks.ackMessages(clientMock, ackIds)).rejects.toThrow(/Failed to acknowledge/);
        });
    });

    describe('Function: publishTodoistIds', () => {
        const ids: string[] = [
            'abcd',
            'bcde',
        ];

        let publishMock: jest.MockedFunction<any>;


        beforeEach(() => {
            publishMock = jest.fn();
            jest.spyOn(chronFetchUpdatedTasks, 'getPubSub')
                .mockReturnValue({
                    topic: jest.fn().mockReturnThis(),
                    publish: publishMock,
                } as any)
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should call publish for each id', async () => {

            await chronFetchUpdatedTasks.publishTodoistIds(ids);
            expect(publishMock.mock.calls.length).toBe(2);
        });

        it('should call rollbar if errors', async () => {
            const rollbarSpy = jest.spyOn(rollbar, 'error');

            publishMock.mockRejectedValue({});

            await chronFetchUpdatedTasks.publishTodoistIds(ids);
            expect(rollbarSpy.mock.calls.length).toBe(2);
            expect(rollbarSpy.mock.calls[0][0]).toMatch(/Problem pushing userID/);

        })
    });
});
