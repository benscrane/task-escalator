import 'jest';
import './helpers/mockFirebaseSetup';
import * as createUserDocument from '../src/createUserDocument';
import { db } from '../src/admin';

describe('Module: createUserDocument', () => {
    describe('Function: createUserDocument', () => {
        let docMock: any;
        let setMock: any;
        let collectionSpy: jest.SpyInstance;

        const user: createUserDocument.TaskalatorUser = {
            uid: 'test',
        };

        beforeEach(() => {
            setMock = jest.fn().mockResolvedValue({});

            docMock = jest.fn()
                .mockReturnValue({
                    set: setMock,
                });

            collectionSpy = jest.spyOn(db, 'collection')
                .mockReturnValue({
                    doc: docMock,
                } as any);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should call doc with user id', async () => {
            await createUserDocument.createUserDocument(user);

            expect(docMock.mock.calls[0][0]).toEqual('test');
        });

        it('should call collection with users', async () => {
            await createUserDocument.createUserDocument(user);

            expect(collectionSpy.mock.calls[0][0]).toEqual('users');
        });

        it('should call set appropriately', async () => {
            await createUserDocument.createUserDocument(user);

            expect(setMock.mock.calls[0]).toEqual([
                {
                    todoistLinked: false,
                }, {
                    merge: true,
                },
            ]);
        })
    });
});
