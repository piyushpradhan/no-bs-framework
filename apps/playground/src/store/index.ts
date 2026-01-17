import { createStore } from "@no-bs-framework/state";

const store = createStore({
  count: 0,
  users: [
    {
      id: 1,
      name: "something",
    },
  ],
});

export default store;
