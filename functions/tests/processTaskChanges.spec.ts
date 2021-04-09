import 'jest';
import './helpers/mockFirebaseSetup';
import { Request, Response } from 'express';
import * as processTaskChanges from '../src/processTaskChanges';
import { rollbar } from '../src/admin';


describe('Module: processTaskChanges', () => {
    describe('Function: processTaskChanges', () => {
        const todoistId = 'test-id';
        let req: Request;
        let res: Response;
        let statusMock: jest.MockedFunction<any>;
        let sendMock: jest.MockedFunction<any>;
        let topicMock: jest.MockedFunction<any>;
        let publishMock: jest.MockedFunction<any>;


        beforeEach(() => {
            publishMock = jest.fn().mockResolvedValue({});
            topicMock = jest.fn().mockReturnValue({
                publish: publishMock,
            });

            jest.spyOn(processTaskChanges, 'getPubSub')
                .mockReturnValue({
                    topic: topicMock,
                } as any);

            sendMock = jest.fn();
            statusMock = jest.fn().mockReturnValue({
                send: sendMock,
            });

            req = {
                body: {
                    user_id: todoistId,
                }
            } as Request;

            res = {
                status: statusMock,
            } as Response;
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should send 400 status if no user_id', async () => {
            delete req.body.user_id;
            await processTaskChanges.processTaskChanges(req, res);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(sendMock).toHaveBeenCalled();
        });

        it('should send 200 status otherwise', async () => {
            await processTaskChanges.processTaskChanges(req, res);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalled();
        });

        it('should call topic with todoist-updates', async () => {
            await processTaskChanges.processTaskChanges(req, res);

            expect(topicMock).toHaveBeenCalledWith('todoist-updates');
        });

        it('should call publish with data', async () => {
            await processTaskChanges.processTaskChanges(req, res);

            const expected = Buffer.from(
                JSON.stringify({
                    todoistId,
                })
            );

            expect(publishMock).toHaveBeenCalledWith(expected);
        });

        it('should call rollbar with error', async () => {
            publishMock.mockRejectedValue({});

            const rollbarSpy = jest.spyOn(rollbar, 'error');

            await processTaskChanges.processTaskChanges(req, res);
            expect(rollbarSpy.mock.calls[0][0]).toMatch(/Failed to publish user ID/);
        });
    });
});
