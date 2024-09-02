/* eslint-disable no-param-reassign  */
import axios from "axios";
import i18next from "i18next";
import onChange from "on-change";
import { string } from "yup";
import { uniqueId, differenceWith } from "lodash";

import render from "./view.js";
import parse from "./parser.js";
import resources from "./locales/index.js";

const validate = (currentURL, previousURLs) => {
  const schema = string().url().required().notOneOf(previousURLs);
  return schema.validate(currentURL);
};

const updateFeeds = (state) => {
  const promise = state.feeds.map(({ url, id }) =>
    axios
      .get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
      .then((response) => {
        const currentPosts = state.posts.filter(({ feedId }) => feedId === id);
        const loadedPosts = parse(response.data.contents).posts.map((post) => ({
          ...post,
          feedId: id,
        }));
        const newPosts = differenceWith(
          loadedPosts,
          currentPosts,
          (loadedPost, currentPost) => loadedPost.title === currentPost.title,
        ).map((post) => ({ ...post, id: uniqueId() }));

        state.posts.unshift(...newPosts);
      }),
  );

  Promise.all(promise).finally(() => {
    setTimeout(() => updateFeeds(state), 5000);
  });
};

const errorState = (error, state) => {
  switch (error.name) {
    case "ValidationError":
      state.form = { ...state.form, valid: false, error: error.message };
      break;
    case "parserError":
      state.loadingProcess.error = "noRSS";
      state.loadingProcess.status = "failed";
      break;
    case "AxiosError":
      state.loadingProcess.error = "errNet";
      state.loadingProcess.status = "failed";
      break;
    default:
      state.loadingProcess.error = "unknown";
      state.loadingProcess.status = "failed";
      break;
  }
};

export default () => {
  const initialState = {
    feeds: [],
    posts: [],
    loadingProcess: {
      status: "pending",
      error: null,
    },
    form: {
      error: null,
      valid: false,
    },
    modal: {
      postId: null,
    },
    ui: {
      checkedPosts: new Set(),
    },
  };

  const elements = {
    form: document.querySelector(".rss-form"),
    input: document.querySelector("url-input"),
    feedback: document.querySelector(".feedback"),
    submitButton: document.querySelector('button[type="submit"]'),
    rssPosts: document.querySelector(".posts"),
    rssFeeds: document.querySelector(".feeds"),
    modal: document.querySelector("#modal"),
  };

  const local = i18next.createInstance();

  local.init({
    lng: "ru",
    debug: false,
    resources,
  });

  const state = onChange(initialState, () => render(state, elements, local));

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const currentURL = new FormData(event.target).get("url");
    const previousURLs = state.feeds.map(({ url }) => url);

    validate(currentURL, previousURLs)
      .then(() => {
        state.form = { ...state.form, valid: true, error: null };
        state.loadingProcess.status = "loading";

        return axios.get(
          `https://allorigins.hexlet.app/get?disableCache=true&url=${currentURL}`,
        );
      })
      .then((response) => {
        const { feed, posts } = parse(response);
        const postsList = posts.map((post) => ({
          ...post,
          id: uniqueId(),
          feedId: feed.id,
        }));

        state.feeds.unshift(feed);
        state.posts.unshift(...postsList);
        state.loadingProcess.error = null;
        state.loadingProcess.status = "success";
      })
      .catch((error) => {
        errorState(error, state);
      });
  });

  elements.rssPosts.addEventListener("click", ({ target }) => {
    if (!("id" in target.dataset)) {
      return;
    }

    const { id } = target.dataset;
    state.modal.postId = id;
    state.ui.checkedPosts.add(id);
  });
  setTimeout(() => updateFeeds(state), 5000);
};
