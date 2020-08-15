import 'jest';
import '../testHelpers/mockFirebaseSetup';

import * as pubsubSyncUser from '../src/pubsubSyncUser';

describe('Module: pubsubSyncUser', () => {

    describe('Function: filterTasks', () => {
        // TODO: add types here
        const recurringTask: any = {
            due: {
                is_recurring: true,
            },
        };

        const validTask: any = {
            due: {
                is_recurring: false,
            },
            checked: false,
        };

        it('should filter recurring items', () => {
            const items: any[] = [
                recurringTask,
                validTask,
            ];

            const output = pubsubSyncUser.filterTasks(items);
            expect(output).toStrictEqual([ validTask ]);
        });
    });
});
