/**
 * An observable, settable value interface.
 */

import { EventEmitter } from 'events';
import { AnyType } from './types';

/**
 * A property value.
 *
 * This is used for communicating between the Thing representation and the
 * actual physical thing implementation.
 *
 * Notifies all observers when the underlying value changes through an external
 * update (command to turn the light off) or if the underlying sensor reports a
 * new value.
 */
class Value<ValueType = AnyType> extends EventEmitter {
  private lastValue: ValueType;

  private valueForwarder: Value.Forwarder<ValueType> | null;

  private valueRequestor: Value.Requestor<ValueType> | null;

  /**
   * Initialize the object.
   *
   * @param {*} initialValue The initial value
   * @param {function?} valueForwarder The method that updates the actual value
   *                                   on the thing
   */
  constructor(initialValue: ValueType,
              valueForwarder: Value.Forwarder<ValueType> | null = null,
              valueRequestor: Value.Requestor<ValueType> | null = null) {
    super();
    this.lastValue = initialValue;
    this.valueForwarder = valueForwarder;
    this.valueRequestor = valueRequestor;
  }

  /**
   * Set a new value for this thing.
   *
   * @param {*} value Value to set
   */
  set(value: ValueType): Promise<void> {
    return Promise.resolve(
      this.valueForwarder ? this.valueForwarder(value) : undefined
    ).then(() => this.notifyOfExternalUpdate(value));
  }

  /**
   * Return the last known value from the underlying thing.
   *
   * @returns the value.
   */
  get(): Promise<ValueType> {
    if (this.valueRequestor) {
      return Promise.resolve(this.valueRequestor()).then((newValue) => {
        this.notifyOfExternalUpdate(newValue);
        return newValue;
      });
    }
    return Promise.resolve(this.lastValue);
  }

  /**
   * Notify observers of a new value.
   *
   * @param {*} value New value
   */
  notifyOfExternalUpdate(value: ValueType): void {
    if (typeof value !== 'undefined' && value !== null && value !== this.lastValue) {
      this.lastValue = value;
      this.emit('update', value);
    }
  }
}

declare namespace Value {
  export type Forwarder<T> = (value: T) => void | Promise<void>;
  export type Requestor<T> = () => T | Promise<T>;
}

export = Value;
