import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useStore } from "@no-bs-framework/state";

function App() {
  const $store = useStore();

  const increaseCount = () => {
    const count = $store.root.count + 1;
    const document = {
      id: "doc-123",
      name: "random.docx",
    };

    const people = [
      {
        id: 1234,
        displayName: "John Doe",
      },
      {
        id: 3312,
        displayName: "Sam Miller",
      },
    ];

    const arrayOfNumbers = [1, 2, 3, 45];
    const arrayOfStrings = ["something", "anything", "absolutely-anything"];

    $store.root.count = count;
    $store.document = document;
    $store.people = people;
    $store.numbers = arrayOfNumbers;
    $store.values = arrayOfStrings;
  };

  console.log(JSON.parse(JSON.stringify($store)));

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={increaseCount}>count is {$store.root.count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
