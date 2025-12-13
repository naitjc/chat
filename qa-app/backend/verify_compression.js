const axios = require('axios');

const API_URL = 'http://localhost:8888/qa';

async function runTest() {
    let history = [];

    // Simulate 5 turns (10 messages)
    for (let i = 1; i <= 5; i++) {
        console.log(`\n--- Turn ${i} ---`);
        const question = `Question ${i}`;
        console.log(`User: ${question}`);

        try {
            const response = await axios.post(API_URL, {
                question: question,
                history: history,
                // Mock other params
                temperature: 0.7,
                top_p: 0.9
            });

            const answer = response.data.answer;
            console.log(`Bot: ${answer.substring(0, 50)}...`);

            if (response.data.history) {
                history = response.data.history;
            } else {
                history.push({ role: 'user', content: [{ type: 'text', text: question }] });
                history.push({ role: 'assistant', content: answer });
            }

            console.log(`Current History Length: ${history.length}`);
        } catch (error) {
            console.error("Error in turn", i, error.message);
            return;
        }
    }

    // Turn 6 - should trigger compression
    console.log(`\n--- Turn 6 (Should trigger compression) ---`);
    const question = `Question 6`;
    console.log(`User: ${question}`);

    try {
        const response = await axios.post(API_URL, {
            question: question,
            history: history,
            temperature: 0.7,
            top_p: 0.9
        });

        const answer = response.data.answer;
        console.log(`Bot: ${answer.substring(0, 50)}...`);

        if (response.data.history) {
            console.log("RECEIVED UPDATED HISTORY FROM BACKEND");
            history = response.data.history;
        } else {
            history.push({ role: 'user', content: [{ type: 'text', text: question }] });
            history.push({ role: 'assistant', content: answer });
        }

        console.log(`Final History Length: ${history.length}`);
        console.log("Final History Content:", JSON.stringify(history, null, 2));

        if (history.length < 12) {
            console.log("\nPASS: History was compressed!");
        } else {
            console.log("\nFAIL: History was NOT compressed.");
        }

    } catch (error) {
        console.error("Error in turn 6", error.message);
    }
}

runTest();
