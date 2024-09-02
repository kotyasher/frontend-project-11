/* eslint-disable no-param-reassign  */
import axios from "axios";
import i18next from "i18next";
import onChange from "on-change";
import { string } from "yup";
import { uniqueId } from "lodash";

import render from "./view.js";
import parse from "./parser.js";
import resources from "./locales/index.js";

const validate = (currentURL, previousURLs) => {
  const schema = string().url().required().notOneOf(previousURLs);
  return schema.validate(currentURL);
};

const proxy = (url) => {
  const proxyURL = new URL("/get", "https://allorigins.hexlet.app");
  proxyURL.searchParams.set("url", url);
  proxyURL.searchParams.set("disableCache", "true");
  return proxyURL;
};

const updateFeeds = (state) => {
  const promises = state.rss.feeds.map(({ url, id }) =>
    axios
      .get(proxy(url))
      .then((response) => {
        const currentPosts = state.rss.posts.filter(
          ({ feedId }) => feedId === id,
        );
        const loadedPosts = parse(response).posts.map((post) => ({
          ...post,
          feedId: id,
        }));
        const currentPostTitles = currentPosts.map((post) => post.title);
        const newPosts = loadedPosts
          .filter((post) => !currentPostTitles.includes(post.title))
          .map((post) => ({ ...post, id: uniqueId() }));

        state.rss.posts = [...newPosts, ...state.rss.posts];
      })
      .catch((error) => {
        console.error(error);
      }),
  );

  Promise.all(promises).finally(() => {
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
    rss: {
      feeds: [],
      posts: [],
    },
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
    form: document.querySelector("form"),
    input: document.querySelector("input"),
    feedback: document.querySelector(".feedback"),
    submitButton: document.querySelector('button[type="submit"]'),
    rssPosts: document.querySelector(".posts"),
    rssFeeds: document.querySelector(".feeds"),
    modal: document.querySelector("#modal"),
  };

  const local = i18next.createInstance();

  local
    .init({
      lng: "ru",
      debug: false,
      resources,
    })
    .then(() => {
      const state = onChange(initialState, () =>
        render(state, elements, local),
      );

      elements.form.addEventListener("submit", (event) => {
        event.preventDefault();

        const currentURL = new FormData(event.target).get("url");
        const previousURLs = state.rss.feeds.map(({ url }) => url);

        validate(currentURL, previousURLs)
          .then(() => {
            state.form = { ...state.form, valid: true, error: null };
            state.loadingProcess.status = "loading";

            return axios.get(proxy(currentURL));
          })
          .then((response) => {
            const { feed, posts } = parse(response);
            const postsList = posts.map((post) => ({
              ...post,
              id: uniqueId(),
              feedId: feed.id,
            }));

            state.rss.feeds.unshift(feed);
            state.rss.posts.unshift(...postsList);
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
    });
};
