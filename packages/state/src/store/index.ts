export type Selector<T, R> = (state: T) => R;

export type Subscriber<T> = (state: T) => void;

export class Store<T> {
  private state: T;
  private subscribers: Set<{
    selector: Selector<T, any>;
    callback: Subscriber<any>;
    lastValue: any;
  }> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState() {
    return this.state;
  }

  setState(updater: (state: T) => T): void {
    const newState = updater(this.state);

    if (newState !== this.state) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  subscribe<R>(selector: Selector<T, R>, callback: Subscriber<R>): () => void {
    const initialValue = selector(this.state);
    const subscription = {
      selector,
      callback,
      lastValue: initialValue,
    };

    this.subscribers.add(subscription);
    return () => {
      this.subscribers.delete(subscription);
    };
  }

  private notifyListeners() {
    for (const subscriber of this.subscribers) {
      const newValue = subscriber.selector(this.state);
      if (!this.shallowEqual(newValue, subscriber.lastValue)) {
        subscriber.lastValue = newValue;
        subscriber.callback(newValue);
      }
    }
  }

  private shallowEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;

    if (typeof a !== "object" || typeof b !== "object") return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (a[key] !== b[key]) return false;
    }

    return true;
  }
}
