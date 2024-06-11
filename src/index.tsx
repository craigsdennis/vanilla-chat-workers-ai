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
  return c.render(
    <>
      <div className="flex h-screen bg-gray-200">
        <div
          className="flex-grow flex flex-col"
          style="max-width: calc(100% - 20rem)"
        >
          <div
            id="chat-history"
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-white flex flex-col-reverse messages-container"
          ></div>
          <div className="px-6 py-2 bg-white shadow-up">
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
            </form>
            <div className="text-xs text-gray-500 mt-2">
              <p className="model-display">-</p>
              <input
                type="hidden"
                class="message-user message-assistant message-model"
              />
            </div>
          </div>
        </div>
        <div className="w-80 bg-chat-settings p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Chat Settings</h2>
              <p className="text-sm text-chat-helpertext mt-1">
                Try out different models and configurations for your chat
                application
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
                ></select>
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
              >
                Apply Changes
              </button>
            </form>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center">
            <span className="mr-2 pt-2">Powered by</span>
            <a
              href="https://developers.cloudflare.com/workers-ai/"
              target="_blank"
            >
              <img
                src="/static/cloudflare-logo.png"
                alt="Cloudflare Logo"
                className="h-6 inline"
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
  //console.log("Model", payload.config.model);
  //console.log("Messages", JSON.stringify(messages));
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
  // EventSource stream is handy for local event sources, but we want to just stream text
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
