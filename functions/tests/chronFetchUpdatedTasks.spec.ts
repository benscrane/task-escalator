import 'jest';
import './helpers/mockFirebaseSetup';
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

    });

    describe('Function: publishTodoistIds', () => {

    });
});
