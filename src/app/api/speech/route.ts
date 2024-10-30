// Import necessary libraries
import {NextRequest, NextResponse} from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { whispercpp, generateTranscription } from "modelfusion";
console.log(process.env.WHISPER_API_URL)
const api = whispercpp.Api({
    baseUrl: process.env.WHISPER_API_URL,
});
const whisper = whispercpp.Transcriber({
    api,
    temperature: 0,
});

// Promisify the exec function from child_process
// This function handles POST requests to the /api/speechToText route
export async function POST(request: NextRequest) {
    // Check if the OpenAI API key is configured
    // Parse the request body

    try {
        const req = await request.json()

        // Extract the audio data from the request body
        const base64Audio = req.audio.toString().split(',')[1];
        const transcription = await generateTranscription({
            model: whisper,
            mimeType: "audio/wav",
            audioData: base64Audio,
            logging: "basic-text",
        });
        console.log(transcription)
        // Return the transcribed text in the response
        return NextResponse.json({result: transcription}, {status:200});
    } catch(error) {
        // Handle any errors that occur during the request
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (error.response) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            console.error(error.response.status, error.response.data);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            return NextResponse.json({ error: error.response.data }, {status:500});
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            console.error(`Error with OpenAI API request: ${error.message}`);
            return NextResponse.json({ error: "An error occurred during your request." }, {status:500});
        }
    }
}