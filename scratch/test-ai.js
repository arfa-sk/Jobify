const { generateContent } = require('./src/server/ai/gemini');

async function test() {
    try {
        console.log("Testing Gemini content generation...");
        const result = await generateContent("Say hello world in 5 words.");
        console.log("Result:", result.text);
    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

test();
