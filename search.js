import { SearchEngine } from "./search_engine.js";

// First Install
if (!window.localStorage.getItem("hasSeenIntro")) {
  window.localStorage.setItem("hasSeenIntro", "yep");
  chrome.tabs.create({
    url: "chrome://extensions/shortcuts",
  });
}

new SearchEngine();
