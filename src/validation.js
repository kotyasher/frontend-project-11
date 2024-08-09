import * as yup from "yup";
import onChange from "on-change";
import render from "./view.js";

// /home/frontend-project-11/src/js

const schema = yup.string().lowercase().trim().url();

const validate = (url) =>
  schema
    .validate(url)
    .then(() => "")
    .catch((e) => e.message);

export default () => {
  const elements = {
    form: document.querySelector("form"),
    input: document.querySelector("input"),
    feedback: document.querySelector(".feedback"),
  };

  const initialState = {
    urlState: "valid",
    feedbackText: null,
    list: [],
  };

  const state = onChange(initialState, render(initialState, elements));

  elements.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get("url");
    validate(url).then((err) => {
      const isUniq = state.list.includes(url);

      if (err === "" && !isUniq) {
        state.urlState = "valid";
        state.feedbackText = "RSS успешно загружен";
        state.list.push(url);
      } else if (err === "" && isUniq) {
        state.urlState = "invalid";
        state.feedbackText = "RSS уже существует";
      } else {
        state.urlState = "invalid";
        state.feedbackText = "Ссылка должна быть валидным URL";
      }
    });
  });
};
