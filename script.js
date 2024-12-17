abc_buttons.addEventListener("pointerup", handleButtonClick);

let pause = false;
const emojiWords = parseEmojiWords();
let currentWord = randomWord();
const found = new Set();
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ".split("");

const prevent = (e) => e.preventDefault();
addEventListener("touchstart", prevent, { passive: false });
addEventListener("touchmove", prevent, { passive: false });
addEventListener("contextmenu", prevent, { passive: false });
addEventListener("selectstart", prevent, { passive: false });
addEventListener("selectionchange", prevent, { passive: false });
addEventListener("keydown", handleKeydown);

async function handleButtonClick(event) {
  if (event.target.tagName !== "BUTTON") return;

  handleLetter(event.target.dataset.value);
}

async function handleKeydown(event) {
  const letter = event.key.toUpperCase();
  if (letter.length !== 1) return;
  if (!letters.includes(letter)) return;

  handleLetter(letter);
}

function handleLetter(letter) {
  if (pause) return;
  if (letter === "?") {
    reorderButtons();
  } else {
    speakLetter(letter);
    tryLetter(letter);
  }
}

async function tryLetter(letter) {
  const upper = currentWord.word.toUpperCase();
  abc_buttons.querySelector(`button[data-value="${letter}"]`).disabled = true;
  if (!upper.includes(letter)) return;

  found.add(letter);
  const hint = upper.split("").map((l) => (found.has(l) ? l : "_"));
  current_hint.textContent = hint.join("");
  if (hint.includes("_")) return;

  pause = true;
  await speakWordSuccess();
  currentWord = newRandomWord();
  found.clear();
  pause = false;
}

function parseEmojiWords() {
  const words = [];
  const parts = words_template.content.textContent.trim().split(/\s+/);
  while (parts.length) {
    const emoji = parts.shift();
    const word = parts.shift();
    words.push({ emoji, word });
  }
  for (const part of parts) {
    if (part.startsWith(":")) {
      emojis.push(part);
    }
  }
  return words;
}

function randomWord() {
  const item = emojiWords[Math.floor(Math.random() * emojiWords.length)];
  current_emoji.textContent = item.emoji;
  current_hint.textContent = item.word.replace(/./g, "_");
  h1_text.textContent = h1_text.dataset.text.replace("#", item.word.length);
  abc_buttons
    .querySelectorAll("button")
    .forEach((b) => b.removeAttribute("disabled"));
  return item;
}

function newRandomWord() {
  const item = randomWord();
  speakSentence(h1_text.textContent);
  return item;
}

async function speakLetter(letter) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(`${letter}?`);
    utterance.lang = "sv-SE";
    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

async function speakSentence(text, rate = 1) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "sv-SE";
    utterance.onend = () => resolve();
    utterance.rate = rate;
    speechSynthesis.speak(utterance);
  });
}

async function speakWordSuccess() {
  await speakSentence("Ja!");
  await sleep(100);
  for (const letter of currentWord.word.split("")) {
    await speakLetter(letter);
    await sleep(100);
  }
  await speakSentence(`blir "${currentWord.word}"`, 0.8);
  await sleep(100);
  await speakSentence(`som är rätt svar!`);
  //return new Promise((resolve) => {
  //  const utterance = new SpeechSynthesisUtterance(
  //    `Ja! ${currentWord.word.split(" ")} "${currentWord.word}" är rätt svar!`,
  //  );
  //  utterance.lang = "sv-SE";
  //  utterance.onend = () => resolve();
  //  speechSynthesis.speak(utterance);
  //});
}

function reorderButtons() {
  if (abc_buttons.dataset.sort === "abc") {
    const buttons = [...abc_buttons.querySelectorAll("button")];
    buttons.sort(sortBy((b) => Number(b.dataset.qwerty)));
    for (const b of buttons) abc_buttons.appendChild(b);
    abc_buttons.dataset.sort = "qwerty";
  } else {
    const buttons = [...abc_buttons.querySelectorAll("button")];
    buttons.sort(
      sortBy((b) => (b.dataset.value === "?" ? 99 : b.dataset.value)),
    );
    for (const b of buttons) abc_buttons.appendChild(b);
    abc_buttons.dataset.sort = "abc";
  }
}

function sortBy(mapper) {
  return (a, b) => {
    const aVal = mapper(a);
    const bVal = mapper(b);
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
