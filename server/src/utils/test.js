import axios from 'axios';
// Replace with your backend server URL
const serverUrl = 'https://mlsc.tech';

// Number of requests to send
const numberOfRequests = 1000;

async function sendRequest(index) {
    const startTime = Date.now();
    try {
        const response = await axios.get(serverUrl);
        const endTime = Date.now();
        console.log(`Request ${index + 1}: Success | Time taken: ${endTime - startTime} ms`);
        return endTime - startTime;
    } catch (error) {
        const endTime = Date.now();
        console.error(`Request ${index + 1}: Error | Time taken: ${endTime - startTime} ms`, error.message);
        return endTime - startTime;
    }
}

async function testServer() {
    const requests = [];
    const requestTimes = [];
    const totalStartTime = Date.now();

    for (let i = 0; i < numberOfRequests; i++) {
        requests.push(sendRequest(i).then(time => requestTimes.push(time)));
    }

    await Promise.all(requests);
    const totalEndTime = Date.now();
    const totalTimeTaken = totalEndTime - totalStartTime;
    const averageTimeTaken = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;

    console.log(`All ${numberOfRequests} requests have been sent.`);
    console.log(`Total time taken: ${totalTimeTaken} ms`);
    console.log(`Average time taken per request: ${averageTimeTaken.toFixed(2)} ms`);
}

testServer();
