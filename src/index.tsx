import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { renderer } from "./renderer";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { Ai } from "@cloudflare/workers-types";

type Bindings = {
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(renderer);

app.get("/", (c) => {
  const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct"; // Default model
  const DEFAULT_SYSTEM_MESSAGE = "You are a helpful assistant"; // Default system message

  const handleChatSettings = () => {
    const modelSelect = document.getElementById("model-select") as HTMLSelectElement;
    const systemMessage = document.getElementById("system-message") as HTMLTextAreaElement;

    // Logic to apply chat settings
    const chatSettings = {
      model: modelSelect.value,
      systemMessage: systemMessage.value,
    };

    // Here you can add any additional logic to handle the chat settings
    console.log("Chat settings applied:", chatSettings);
  };

  return c.render(
    <>
      <div className="flex flex-col h-screen bg-gray-200" id="chat-container">
        <div className="flex-grow flex flex-col">
          <div
            id="chat-history"
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white flex flex-col-reverse messages-container"
          ></div>
          <div className="px-4 py-2 bg-white shadow-up">
            <form className="flex items-center" id="chat-form">
              <textarea
                id="message-input"
                className="flex-grow m-2 p-2 border border-chat-border rounded shadow-sm placeholder-chat-placeholder"
                placeholder="Type a message..."
              ></textarea>
              <button
                type="submit"
                className="m-2 px-4 py-2 bg-chat-button text-black rounded hover:bg-gray-300"
              >
                Send
              </button>
              <button
                type="button"
                id="apply-chat-settings"
                className="m-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                onClick={(e) => {
                  e.preventDefault(); // Prevent form submission
                  handleChatSettings(); // Call the function to apply changes
                }}
              >
                Reset
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-2">
              <p className="model-display">-</p>
              <input
                type="hidden"
                className="message-user message-assistant message-model"
              />
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 mx-auto bg-chat-settings p-4 shadow-xl flex flex-col justify-between chat-settings">
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Chat Settings</h2>
              <p className="text-sm text-chat-helpertext mt-1">
                Try out different models and configurations for your chat application
              </p>
            </div>
            <form>
              <div className="mb-4">
                <label className="block text-black text-sm font-bold mb-2">
                  Model
                </label>
                <select
                  id="model-select"
                  className="border border-chat-border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value={DEFAULT_MODEL}>{DEFAULT_MODEL}</option>
                  {/* Add other model options here */}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-black text-sm font-bold mb-2">
                  System Message
                </label>
                <p className="text-sm text-chat-helpertext mb-2">
                  Guides the tone of the response
                </p>
                <textarea
                  id="system-message"
                  className="border border-chat-border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter system message..."
                ></textarea>
              </div>
              <button
                id="apply-chat-settings"
                className="w-full px-4 py-2 bg-chat-apply text-white rounded hover:bg-gray-800 focus:outline-none focus:shadow-outline"
                onClick={(e) => {
                  e.preventDefault(); // Prevent form submission
                  handleChatSettings(); // Call the function to apply changes
                }}
              >
                Apply Changes
              </button>
            </form>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center">
            <span className="mr-2 pt-2">Powered by</span>
            <a href="https://megavault.in/" target="_blank">
              <img
                src="/static/logo.png"
                alt="Megavault Logo"
                style={{ height: '20px', width: '20px' }} // Set height and width directly
                className="inline"
              />
            </a>
          </div>
        </div>
      </div>
      <script src="/static/script.js"></script>
    </>
  );
});

app.post("/api/chat", async (c) => {
  const payload = await c.req.json();
  const messages = [...payload.messages];
  // Prepend the systemMessage
  if (payload?.config?.systemMessage) {
    messages.unshift({ role: "system", content: payload.config.systemMessage });
  }
  let eventSourceStream;
  let retryCount = 0;
  let successfulInference = false;
  let lastError;
  const MAX_RETRIES = 3;
  while (successfulInference === false && retryCount < MAX_RETRIES) {
    try {
      eventSourceStream = (await c.env.AI.run(payload.config.model, {
        messages,
        stream: true,
      })) as ReadableStream;
      successfulInference = true;
    } catch (err) {
      lastError = err;
      retryCount++;
      console.error(err);
      console.log(`Retrying #${retryCount}...`);
    }
  }
  if (eventSourceStream === undefined) {
    if (lastError) {
      throw lastError;
    }
    throw new Error(`Problem with model`);
  }
  const tokenStream = eventSourceStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  return streamText(c, async (stream) => {
    for await (const msg of tokenStream) {
      if (msg.data !== "[DONE]") {
        const data = JSON.parse(msg.data);
        stream.write(data.response);
      }
    }
  });
});

export default app;