import { createStore } from "@no-bs-framework/state";
import { seedData } from "./seed";

const store = createStore(seedData);

export default store;
