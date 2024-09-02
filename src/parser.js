export default (response) => {
  const parser = new DOMParser();
  const content = parser.parseFromString(response.data.contents, "text/xml");
  const error = content.querySelector("parsererror");

  if (error) {
    return false;
  }

  const feed = {
    title: content.querySelector("description").textContent,
    description: content.querySelector("description").textContent,
  };

  const items = content.querySelectorAll("item");
  const posts = [...items].map((item) => ({
    title: item.querySelector("title").textContent,
    description: item.querySelector("description").textContent,
    link: item.querySelector("link").textContent,
  }));

  return { feed, posts };
};
