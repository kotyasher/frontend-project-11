import * as yup from "yup";
import onChange from "on-change";
import i18next from "i18next";
import render from "./view.js";
import resources from "./locales/index.js";

// /home/frontend-project-11/src
const i18nInstance = i18next.createInstance();
i18nInstance.init({
  lng: "ru",
  debug: false,
  resources,
});

yup.setLocale({
  mixed: {
    notOneOf: () => "errorsTexts.notUniq",
  },
  string: {
    url: () => "errorsTexts.invalidUrl",
  },
});

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

  const validate = (url) => {
    const schema = yup.string().lowercase().trim().url().notOneOf(state.list);

    return schema
      .validate(url)
      .then(() => "successText")
      .catch((e) => e.message);
  };

  elements.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get("url").trim();
    validate(url).then((feedbackPath) => {
      state.feedbackText = i18nInstance.t(feedbackPath);
      if (feedbackPath === "successText") {
        state.urlState = "valid";
        state.list.push(url);
      } else {
        state.urlState = "invalid";
      }
    });
  });
};
