/// <reference types="vite/client" />
interface SerialPort extends EventTarget {
  onconnect: ((this: this, ev: Event) => any) | null;
  ondisconnect: ((this: this, ev: Event) => any) | null;
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
}
interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: ParityType;
  bufferSize?: number;
  flowControl?: FlowControlType;
}
interface Serial extends EventTarget {
  onconnect: ((this: this, ev: Event) => any) | null;
  ondisconnect: ((this: this, ev: Event) => any) | null;
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
}
interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}
interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}
interface Navigator {
  readonly serial: Serial;
}