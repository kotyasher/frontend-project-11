export default (state, elements) => () => {
  const { form, feedback, input } = elements;

  if (state.urlState === "valid") {
    input.classList.remove("is-invalid");
    feedback.classList.remove("text-danger");
    feedback.classList.add("text-success");

    form.reset();
  } else {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");

    feedback.classList.remove("text-success");
    feedback.classList.add("text-danger");
  }

  input.focus();
  feedback.textContent = state.feedbackText;
};
