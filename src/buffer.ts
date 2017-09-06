
export interface WriteBuffer {
	put(v: BufferSource): void;

	putI8(v: number): void;
	putI16(v: number): void;
	putI32(v: number): void;
	putI64(v: number): void;

	putUi8(v: number): void;
	putUi16(v: number): void;
	putUi32(v: number): void;
	putUi64(v: number): void;

	putF(v: number): void;

	ui8array(): Uint8Array;
}

export interface ReadBuffer {
	peek(): number; // returns next byte
	get(len: number): ArrayBuffer;

	getI8(): number;
	getI16(): number;
	getI32(): number;
	getI64(): number;

	getUi8(): number;
	getUi16(): number;
	getUi32(): number;
	getUi64(): number;

	getF32(): number;
	getF64(): number;
}



export function createWriteBuffer(): WriteBuffer {
	let view = new DataView(new ArrayBuffer(64));
	let n = 0;
	
	function need(x: number): void {
		if(n+x > view.byteLength) {
			const arr = new Uint8Array(Math.max(n+x, view.byteLength+64));
			arr.set(new Uint8Array(view.buffer.slice(0, n)));
			view = new DataView(arr.buffer);
		}
	}

	return {
		put(v: ArrayBuffer): void {
			need(v.byteLength);
			(new Uint8Array(view.buffer)).set(new Uint8Array(v), n);
			n += v.byteLength;
		},

		putI8(v: number): void {
			need(1);
			view.setInt8(n, v);
			++n;
		},

		putI16(v: number): void {
			need(2);
			view.setInt16(n, v);
			n += 2;
		},

		putI32(v: number): void {
			need(4);
			view.setInt32(n, v);
			n += 4;
		},

		putI64(v: number): void {
			need(8);
			const neg = v < 0;
			if(neg) {
				v = -v;
			}
			let hi = (v/0x100000000)|0;
			let lo = (v%0x100000000)|0;
			if(neg) {
				// 2s complement
				lo = (~lo+1)|0;
				hi = lo === 0 ? (~hi+1)|0 : ~hi;
			}

			view.setUint32(n, hi);
			view.setUint32(n+4, lo);
			n += 8;
		},

		putUi8(v: number): void {
			need(1);
			view.setUint8(n, v);
			++n;
		},

		putUi16(v: number): void {
			need(2);
			view.setUint16(n, v);
			n += 2;
		},

		putUi32(v: number): void {
			need(4);
			view.setUint32(n, v);
			n += 4;
		},

		putUi64(v: number): void {
			need(8);
			view.setUint32(n, (v/0x100000000)|0);
			view.setUint32(n+4, v%0x100000000);
			n += 8;
		},

		putF(v: number): void {
			need(8);
			view.setFloat64(n, v);
			n += 8;
		},

		ui8array(): Uint8Array {
			return new Uint8Array(view.buffer.slice(0, n));
		},
	};
}


export function createReadBuffer(buf: BufferSource): ReadBuffer {
	let view = new DataView(ArrayBuffer.isView(buf) ? buf.buffer : buf);
	let n = 0;
	
	return {
		peek(): number {
			return view.getUint8(n);
		},

		get(len: number): ArrayBuffer {
			n += len;
			return view.buffer.slice(n-len, n);
		},

		getI8(): number {
			return view.getInt8(n++);
		},

		getI16(): number {
			n += 2;
			return view.getInt16(n-2);
		},

		getI32(): number {
			n += 4;
			return view.getInt32(n-4);
		},

		getI64(): number {
			n += 8;
			const hi = view.getInt32(n-8);
			const lo = view.getUint32(n-4);
			return hi*0x100000000 + lo;
		},

		getUi8(): number {
			return view.getUint8(n++);
		},

		getUi16(): number {
			n += 2;
			return view.getUint16(n-2);
		},

		getUi32(): number {
			n += 4;
			return view.getUint32(n-4);
		},

		getUi64(): number {
			n += 8;
			const hi = view.getUint32(n-8);
			const lo = view.getUint32(n-4);
			return hi*0x100000000 + lo;
		},

		getF32(): number {
			n += 4;
			return view.getFloat32(n-4);
		},

		getF64(): number {
			n += 8;
			return view.getFloat64(n-8);
		},
	};
}
