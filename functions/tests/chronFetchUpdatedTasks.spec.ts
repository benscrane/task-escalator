import 'jest';
import './helpers/mockFirebaseSetup';
import { TaskPubSubMessage } from '../src/types';
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
});
