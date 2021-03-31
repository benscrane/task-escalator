import funcTest from 'firebase-functions-test';

const firebaseTester = funcTest();

firebaseTester.mockConfig({
    rollbar: {
        access_token: 'fakeAccessToken',
    }
});
