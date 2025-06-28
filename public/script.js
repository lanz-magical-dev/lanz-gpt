const msgerForm = document.querySelector(".msger-inputarea");
const msgerInput = document.querySelector(".msger-input");
const msgerChat = document.querySelector(".msger-chat");

const BOT_NAME = "LanzGPT";
const PERSON_NAME = "You";
const BOT_IMG = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/robot.svg";
const PERSON_IMG = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person.svg";

// initial centered intro text
msgerChat.innerHTML = `
  <div class="intro-message">Where shall we begin?</div>
`;

msgerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msgText = msgerInput.value.trim();

  if (!msgText) {
    msgerInput.classList.add("input-error");
    setTimeout(() => msgerInput.classList.remove("input-error"), 500);
    return;
  }

  appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
  msgerInput.value = "";

  const typingBubble = appendTypingIndicator();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msgText }),
    });

    const data = await res.json();
    typingBubble.remove();
    appendMessage(BOT_NAME, BOT_IMG, "left", data.reply);
  } catch (err) {
    console.error(err);
    typingBubble.remove();

    const isQuotaError =
      err.message?.includes("quota") ||
      err.message?.includes("limit") ||
      err.toString().includes("429") ||
      err.toString().toLowerCase().includes("quota");

    if (isQuotaError) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const options = { weekday: "long", month: "long", day: "numeric" };
      const resetDay = tomorrow.toLocaleDateString(undefined, options);
      const quotaMsg = `<strong>Prompt limit reached.</strong> Please try again on <strong>${resetDay}</strong>.`;
      appendMessage(BOT_NAME, BOT_IMG, "left", quotaMsg);
    } else {
      appendMessage(BOT_NAME, BOT_IMG, "left", "Oops! Something went wrong.");
    }
  }
});

function appendTypingIndicator() {
  const typingHTML = `
    <div class="msg left-msg typing fade-up">
      <div class="msg-img">
        <img src="${BOT_IMG}" alt="${BOT_NAME}" />
      </div>
      <div class="msg-content">
        <div class="msg-name text-start">${BOT_NAME}</div>
        <div class="msg-bubble">
          <div class="msg-text typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>`;
  msgerChat.insertAdjacentHTML("beforeend", typingHTML);
  msgerChat.scrollTop = msgerChat.scrollHeight;
  return msgerChat.lastElementChild;
}

function appendMessage(name, img, side, text) {
  const intro = document.querySelector(".intro-message");
  if (intro) intro.classList.add("fade-out");

  const time = formatDate(new Date());
  const alignTime = side === "right" ? "text-end" : "text-start";
  const parsedText = parseMarkdown(text);

  const msgHTML = `
    <div class="msg ${side}-msg fade-up">
      <div class="msg-img">
        <img src="${img}" alt="${name}" />
      </div>
      <div class="msg-content">
        <div class="msg-name ${alignTime}">${name}</div>
        <div class="msg-bubble">
          <div class="msg-text">${parsedText}</div>
          <div class="msg-time ${alignTime}">${time}</div>
        </div>
      </div>
    </div>`;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop = msgerChat.scrollHeight;
}

// converts markdown-like text into bold headers, ul lists, and paragraphs
function parseMarkdown(text) {
  // step 1: convert headings with colon (e.g., "Early Life and Career:") to <strong>
  text = text.replace(/^([^\n:]+):/gm, (_, heading) => `<strong>${heading.trim()}</strong>`);

  // step 2: convert "* bullet" to <ul><li>
  const lines = text.split("\n");
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("* ")) {
      if (!inList) {
        lines[i] = "<ul><li>" + line.substring(2) + "</li>";
        inList = true;
      } else {
        lines[i] = "<li>" + line.substring(2) + "</li>";
      }
    } else {
      if (inList) {
        lines[i - 1] += "</ul>";
        inList = false;
      }
    }
  }
  if (inList) lines[lines.length - 1] += "</ul>";
  text = lines.join("\n");

  // step 3: convert newlines into paragraphs
  const paragraphs = text.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`);
  return paragraphs.join("");
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();
  return `${h.slice(-2)}:${m.slice(-2)}`;
}
