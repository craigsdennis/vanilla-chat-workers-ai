const models = {
  beta: [
    "@cf/deepseek-ai/deepseek-math-7b-instruct",
    "@cf/defog/sqlcoder-7b-2",
    "@cf/fblgit/una-cybertron-7b-v2-bf16",
    "@cf/google/gemma-2b-it-lora",
    "@cf/google/gemma-7b-it-lora",
    "@cf/meta-llama/llama-2-7b-chat-hf-lora",
    "@cf/meta/llama-3-8b-instruct",
    "@cf/meta/llama-3-8b-instruct-awq",
    "@cf/meta/llama-3.1-8b-instruct",
    "@cf/microsoft/phi-2",
    "@cf/mistral/mistral-7b-instruct-v0.2-lora",
    "@cf/openchat/openchat-3.5-0106",
    "@cf/qwen/qwen1.5-0.5b-chat",
    "@cf/qwen/qwen1.5-1.8b-chat",
    "@cf/qwen/qwen1.5-14b-chat-awq",
    "@cf/qwen/qwen1.5-7b-chat-awq",
    "@cf/thebloke/discolm-german-7b-v1-awq",
    "@cf/tiiuae/falcon-7b-instruct",
    "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
    "@hf/google/gemma-7b-it",
    "@hf/mistral/mistral-7b-instruct-v0.2",
    "@hf/nexusflow/starling-lm-7b-beta",
    "@hf/nousresearch/hermes-2-pro-mistral-7b",
    "@hf/thebloke/deepseek-coder-6.7b-base-awq",
    "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
    "@hf/thebloke/llama-2-13b-chat-awq",
    "@hf/thebloke/llamaguard-7b-awq",
    "@hf/thebloke/mistral-7b-instruct-v0.1-awq",
    "@hf/thebloke/neural-chat-7b-v3-1-awq",
    "@hf/thebloke/openhermes-2.5-mistral-7b-awq",
    "@hf/thebloke/zephyr-7b-beta-awq",
  ],
  ga: [
    "@cf/meta/llama-2-7b-chat-fp16",
    "@cf/meta/llama-2-7b-chat-int8",
    "@cf/mistral/mistral-7b-instruct-v0.1",
    "@hf/meta-llama/meta-llama-3-8b-instruct",
  ],
};

const CHAT_MODEL_DEFAULT = "@cf/meta/llama-3.1-8b-instruct";
const SYSTEM_MESSAGE_DEFAULT = "You are a helpful assistant";

const domReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

let md;
domReady(() => {
  md = window.markdownit();
  const modelSelect = document.getElementById("model-select");
  // Set model options
  for (const model of models.ga) {
    const opt = document.createElement("option");
    opt.setAttribute("value", model);
    opt.textContent = model.split("/").at(-1);
    modelSelect.appendChild(opt);
  }
  const optGroup = document.createElement("optgroup");
  optGroup.label = "BETA";
  for (const model of models.beta) {
    const opt = document.createElement("option");
    opt.setAttribute("value", model);
    opt.textContent = model.split("/").at(-1);
    optGroup.appendChild(opt);
  }
  modelSelect.appendChild(optGroup);
  const chatSettings = retrieveChatSettings();
  if (chatSettings.model !== undefined) {
    modelSelect.value = chatSettings.model;
    updateModelDisplay(chatSettings);
  }
  if (chatSettings.systemMessage !== undefined) {
    document.getElementById("system-message").value =
      chatSettings.systemMessage;
  }
  renderPreviousMessages();
});

// Based on the message format of `{role: "user", content: "Hi"}`
function createChatMessageElement(msg) {
  const div = document.createElement("div");
  div.className = `message-${msg.role}`;
  if (msg.role === "assistant") {
    const response = document.createElement("div");
    response.className = "response";
    const html = md.render(msg.content);
    response.innerHTML = html;
    div.appendChild(response);
    highlightCode(div);
    const modelDisplay = document.createElement("p");
    modelDisplay.className = "message-model";
    const settings = retrieveChatSettings();
    modelDisplay.innerText = settings.model;
    div.appendChild(modelDisplay);
  } else {
    const userMessage = document.createElement("p");
    userMessage.innerText = msg.content;
    div.appendChild(userMessage);
  }
  return div;
}

function retrieveChatSettings() {
  const settingsJSON = localStorage.getItem("chatSettings");
  if (!settingsJSON) {
    return {
      model: CHAT_MODEL_DEFAULT,
      systemMessage: SYSTEM_MESSAGE_DEFAULT,
    };
  }
  return JSON.parse(settingsJSON);
}

function storeChatSettings(settings) {
  localStorage.setItem("chatSettings", JSON.stringify(settings));
}

function retrieveMessages() {
  const msgJSON = localStorage.getItem("messages");
  if (!msgJSON) {
    return [];
  }
  return JSON.parse(msgJSON);
}

function storeMessages(msgs) {
  localStorage.setItem("messages", JSON.stringify(msgs));
}

function highlightCode(content) {
  const codeEls = [...content.querySelectorAll("code")];
  for (const codeEl of codeEls) {
    hljs.highlightElement(codeEl);
  }
}

function renderPreviousMessages() {
  console.log("Rendering previous messages");
  const chatHistory = document.getElementById("chat-history");
  const messages = retrieveMessages();
  for (const msg of messages) {
    chatHistory.prepend(createChatMessageElement(msg));
  }
}

async function sendMessage() {
  const config = retrieveChatSettings();
  if (config.model === undefined) {
    applyChatSettingChanges();
  }
  const input = document.getElementById("message-input");
  const chatHistory = document.getElementById("chat-history");

  // Create user message element
  const userMsg = { role: "user", content: input.value };
  chatHistory.prepend(createChatMessageElement(userMsg));

  const messages = retrieveMessages();
  messages.push(userMsg);
  const payload = { messages, config };

  input.value = "";

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let assistantMsg = { role: "assistant", content: "" };
  const assistantMessage = createChatMessageElement(assistantMsg);
  chatHistory.prepend(assistantMessage);
  const assistantResponse = assistantMessage.firstChild;

  // Scroll to the latest message
  chatHistory.scrollTop = chatHistory.scrollHeight;

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      console.log("Stream done");
      break;
    }
    assistantMsg.content += value;
    // Continually render the markdown => HTML
    // Do not wipe out the model display
    assistantResponse.innerHTML = md.render(assistantMsg.content);
  }
  // Highlight code on completion
  highlightCode(assistantMessage);
  messages.push(assistantMsg);
  storeMessages(messages);
}

function applyChatSettingChanges() {
  const chatHistory = document.getElementById("chat-history");
  chatHistory.innerHTML = "";
  storeMessages([]);
  const chatSettings = {
    model: document.getElementById("model-select").value,
    systemMessage: document.getElementById("system-message").value,
  };
  storeChatSettings(chatSettings);
  updateModelDisplay(chatSettings);
}

function getDocsUrlForModel(model) {
  const modelDisplayName = model.split("/").at(-1);
  return `https://developers.cloudflare.com/workers-ai/models/${modelDisplayName}/`;
}

function updateModelDisplay(chatSettings) {
  for (const display of [...document.getElementsByClassName("model-display")]) {
    display.innerText = chatSettings.model + " - ";
    const docsLink = document.createElement("a");
    docsLink.href = getDocsUrlForModel(chatSettings.model);
    docsLink.target = "docs";
    docsLink.innerText = "Docs";
    display.append(docsLink);
  }
}

document.getElementById("chat-form").addEventListener("submit", function (e) {
  e.preventDefault();
  sendMessage();
});

document
  .getElementById("message-input")
  .addEventListener("keydown", function (event) {
    // Check if Enter is pressed without holding Shift
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent the default action (newline)
      sendMessage();
    }
  });

document
  .getElementById("apply-chat-settings")
  .addEventListener("click", function (e) {
    e.preventDefault();
    applyChatSettingChanges();
  });
