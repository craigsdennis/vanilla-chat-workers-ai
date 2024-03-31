import { Hono } from "hono";
import { renderer } from "./renderer";

const app = new Hono();

app.use(renderer);

app.get("/", (c) => {
  return c.render(
    <>
      <div class="flex h-screen bg-gray-200">
        <div
          class="flex-grow flex flex-col"
          style="max-width: calc(100% - 20rem)"
        >
          <div
            id="chat-history"
            class="flex-1 overflow-y-auto p-6 space-y-4 bg-white flex flex-col-reverse messages-container"
          ></div>
          <div class="px-6 py-2 bg-white shadow-up">
            <form class="flex items-center" id="chat-form">
              <textarea
                id="message-input"
                class="flex-grow m-2 p-2 border border-chat-border rounded shadow-sm placeholder-chat-placeholder"
                placeholder="Type a message..."
              ></textarea>
              <button
                type="submit"
                class="m-2 px-4 py-2 bg-chat-button text-black rounded hover:bg-gray-300"
              >
                Send
              </button>
            </form>
            <div class="text-xs text-gray-500 mt-2">
              <p class="model-display">-</p>
            </div>
          </div>
        </div>
        <div class="w-80 bg-chat-settings p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div class="mb-4">
              <h2 class="text-xl font-semibold">Chat Settings</h2>
              <p class="text-sm text-chat-helpertext mt-1">
                Try out different models and configurations for your chat
                application
              </p>
            </div>
            <form>
              <div class="mb-4">
                <label class="block text-black text-sm font-bold mb-2">
                  Model
                </label>
                <select
                  id="model-select"
                  class="border border-chat-border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                ></select>
              </div>
              <div class="mb-4">
                <label class="block text-black text-sm font-bold mb-2">
                  System Message
                </label>
                <p class="text-sm text-chat-helpertext mb-2">
                  Guides the tone of the response
                </p>
                <textarea
                  id="system-message"
                  class="border border-chat-border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter system message..."
                ></textarea>
              </div>
              <button
                id="apply-chat-settings"
                class="w-full px-4 py-2 bg-chat-apply text-white rounded hover:bg-gray-800 focus:outline-none focus:shadow-outline"
              >
                Apply Changes
              </button>
            </form>
          </div>
          <div class="mt-4 text-center text-sm text-gray-500 flex items-center justify-center">
            <span class="mr-2 pt-2">Powered by</span>
            <a
              href="https://developers.cloudflare.com/workers-ai/"
              target="_blank"
            >
              <img
                src="/cloudflare-logo.png"
                alt="Cloudflare Logo"
                class="h-6 inline"
              />
            </a>
          </div>
        </div>
      </div>
      <script src="/script.js"></script>;
    </>
  );
});

export default app;
