import { h, render } from "preact";
import { BookmarkApp } from "./bookmark.ts";

addEventListener("DOMContentLoaded", () => {
  render(h(BookmarkApp, null), document.body);
});
