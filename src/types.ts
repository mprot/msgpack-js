import {typeError} from "./error";
import {
	WriteBuffer, ReadBuffer, createWriteBuffer,
	putBlob, getBlob,
	putArrHeader, getArrHeader,
	putMapHeader, getMapHeader,
	getRaw,
} from "./buffer";
import {
	Tag,
	posFixintTag, isPosFixintTag, readPosFixint,
	negFixintTag, isNegFixintTag, readNegFixint,
	fixstrTag, isFixstrTag, isFixarrayTag, isFixmapTag,
} from "./tags";



export type EncodeFunc<T> = (buf: WriteBuffer, v: T) => void;
export type DecodeFunc<T> = (buf: ReadBuffer) => T;

export interface Type<T> {
	readonly enc: EncodeFunc<T>;
	readonly dec: DecodeFunc<T>;
}

export interface Collection<T> extends Type<T> {
	encHeader(buf: WriteBuffer, len: number): void;
	decHeader(buf: ReadBuffer, expect?: number): number;
}

export type Obj<T> = {[key: string]: T};

export type Field = [string, Type<any>]; // (name, type)
export type Fields = {readonly [ordinal: number]: Field};

export interface Branches {
	readonly [ordinal: number]: Type<any>;
	ordinalOf(v: any): number;
};



export const Any: Type<any> = {
	enc(buf: WriteBuffer, v: any): void {
		typeOf(v).enc(buf, v);
	},

	dec(buf: ReadBuffer): any {
		return tagType(buf.peek()).dec(buf);
	},
};


export const Nil: Type<null> = {
	enc(buf: WriteBuffer, v: null): void {
		buf.putUi8(Tag.Nil);
	},

	dec(buf: ReadBuffer): null {
		const tag = buf.getUi8();
		if(tag !== Tag.Nil) {
			typeError(tag, "nil");
		}
		return null;
	},
};


export const Bool: Type<boolean> = {
	enc(buf: WriteBuffer, v: boolean): void {
		buf.putUi8(v ? Tag.True : Tag.False);
	},

	dec(buf: ReadBuffer): boolean {
		const tag = buf.getUi8();
		switch(tag) {
		case Tag.Nil:
		case Tag.False:
			return false;
		case Tag.True:
			return true;
		default:
			typeError(tag, "bool");
		}
	},
};


export const Int: Type<number> = {
	enc(buf: WriteBuffer, v: number): void {
		if(-128 <= v && v <= 127) {
			if(v >= 0) {
				buf.putUi8(posFixintTag(v));
			} else if(v > -32) {
				buf.putUi8(negFixintTag(v));
			} else {
				buf.putUi8(Tag.Int8);
				buf.putUi8(v);
			}
		} else if(-32768 <= v && v <= 32767) {
			buf.putI8(Tag.Int16);
			buf.putI16(v);
		} else if(-2147483648 <= v && v <= 2147483647) {
			buf.putI8(Tag.Int32);
			buf.putI32(v);
		} else {
			buf.putI8(Tag.Int64);
			buf.putI64(v);
		}
	},

	dec(buf: ReadBuffer): number {
		const tag = buf.getUi8();
		if(isPosFixintTag(tag)) {
			return readPosFixint(tag);
		} else if(isNegFixintTag(tag)) {
			return readNegFixint(tag);
		}

		switch(tag) {
		case Tag.Nil:
			return 0;

		// signed int types
		case Tag.Int8:
			return buf.getI8();
		case Tag.Int16:
			return buf.getI16();
		case Tag.Int32:
			return buf.getI32();
		case Tag.Int64:
			return buf.getI64();

		// unsigned int types
		case Tag.Uint8:
			return buf.getUi8();
		case Tag.Uint16:
			return buf.getUi16();
		case Tag.Uint32:
			return buf.getUi32();
		case Tag.Uint64:
			return buf.getUi64();

		default:
			typeError(tag, "int");
		}
	},
};


export const Uint: Type<number> = {
	enc(buf: WriteBuffer, v: number): void {
		if(v < 0) {
			throw new Error(`not an uint: ${v}`);
		} else if(v <= 127) {
			buf.putUi8(posFixintTag(v));
		} else if(v <= 255) {
			buf.putUi8(Tag.Uint8);
			buf.putUi8(v);
		} else if(v <= 65535) {
			buf.putUi8(Tag.Uint16);
			buf.putUi16(v);
		} else if(v <= 4294967295) {
			buf.putUi8(Tag.Uint32);
			buf.putUi32(v);
		} else {
			buf.putUi8(Tag.Uint64);
			buf.putUi64(v);
		}
	},

	dec(buf: ReadBuffer): number {
		const v = Int.dec(buf);
		if(v < 0) {
			throw new RangeError("uint underflow");
		}
		return v;
	},
};


export const Float: Type<number> = {
	enc(buf: WriteBuffer, v: number): void {
		buf.putUi8(Tag.Float64);
		buf.putF(v);
	},

	dec(buf: ReadBuffer): number {
		const tag = buf.getUi8();
		switch(tag) {
		case Tag.Nil:
			return 0;
		case Tag.Float32:
			return buf.getF32();
		case Tag.Float64:
			return buf.getF64();
		default:
			typeError(tag, "float");
		}
	},
};


export const Bytes: Type<ArrayBuffer> = {
	enc(buf: WriteBuffer, v: ArrayBuffer): void {
		putBlob(buf, v, Tag.Bin8);
	},

	dec: getBlob,
};


export const Str: Type<string> = {
	enc(buf: WriteBuffer, v: string): void {
		const utf8 = toUTF8(v);
		if(utf8.byteLength < 32) {
			buf.putUi8(fixstrTag(utf8.byteLength));
			buf.put(utf8);
		} else {
			putBlob(buf, utf8, Tag.Str8);
		}
	},

	dec(buf: ReadBuffer): string {
		return fromUTF8(getBlob(buf));
	},
};


export const Raw: Type<ArrayBuffer> = {
	enc(buf: WriteBuffer, v: ArrayBuffer): void {
		buf.put(v);
	},

	dec(buf: ReadBuffer): ArrayBuffer {
		const res = createWriteBuffer();
		getRaw(buf, res);
		const arr = res.ui8array();
		return arr.buffer.slice(0, arr.length);
	},
};


export const Time: Type<Date> = {
	enc(buf: WriteBuffer, v: Date): void {
		const ms = v.getTime();
		buf.putUi8(Tag.Ext8);
		buf.putUi8(12);
		buf.putI8(-1);
		buf.putUi32((ms%1000)*1000000);
		buf.putI64(ms/1000);
	},

	dec(buf: ReadBuffer): Date {
		const tag = buf.getUi8();
		switch(tag) {
		case Tag.FixExt4: // 32-bit seconds
			if(buf.getI8() === -1) {
				return new Date(buf.getUi32() * 1000);
			}
			break;
		case Tag.FixExt8: // 34-bit seconds + 30-bit nanoseconds
			if(buf.getI8() === -1) {
				const lo = buf.getUi32();
				const hi = buf.getUi32();
				// seconds: hi + (lo&0x3)*0x100000000
				// nanoseconds: lo>>2 == lo/4
				return new Date((hi + (lo&0x3)*0x100000000)*1000 + lo/4000000);
			}
			break;
		case Tag.Ext8: // 64-bit seconds + 32-bit nanoseconds
			if(buf.getUi8() === 12 && buf.getI8() === -1) {
				const ns = buf.getUi32();
				const s = buf.getI64();
				return new Date(s*1000 + ns/1000000);
			}
			break;
		}
		typeError(tag, "time");
	},
};


export const Arr = TypedArr(Any);
export const Map = TypedMap(Any, Any);


export function TypedArr<T>(valueT: Type<T>): Collection<T[]> {
	return {
		encHeader: putArrHeader,
		decHeader: getArrHeader,

		enc(buf: WriteBuffer, v: T[]): void {
			putArrHeader(buf, v.length);
			v.forEach(x => valueT.enc(buf, x));
		},

		dec(buf: ReadBuffer): T[] {
			const res = [];
			for(let n = getArrHeader(buf); n > 0; --n) {
				res.push(valueT.dec(buf));
			}
			return res;
		},
	};
}


export function TypedMap<V>(keyT: Type<number|string>, valueT: Type<V>): Collection<Obj<V>> {
	return {
		encHeader: putMapHeader,
		decHeader: getMapHeader,

		enc(buf: WriteBuffer, v: Obj<V>): void {
			const props = Object.keys(v);
			putMapHeader(buf, props.length);
			props.forEach(p => {
				keyT.enc(buf, p);
				valueT.enc(buf, v[p]);
			});
		},

		dec(buf: ReadBuffer): Obj<V> {
			const res = {};
			for(let n = getMapHeader(buf); n > 0; --n) {
				const k = keyT.dec(buf);
				res[k] = valueT.dec(buf);
			}
			return res;
		},
	};
}


export function structEncoder(fields: Fields): EncodeFunc<any> {
	const ordinals = Object.keys(fields);

	return (buf: WriteBuffer, v: any): void => {
		putMapHeader(buf, ordinals.length);
		ordinals.forEach(ord => {
			const f = fields[ord];
			Int.enc(buf, Number(ord));
			f[1].enc(buf, v[f[0]]);
		});
	};
}

export function structDecoder(fields: Fields): DecodeFunc<any> {
	return (buf: ReadBuffer): any => {
		const res = {};
		for(let n = getMapHeader(buf); n > 0; --n) {
			const f = fields[Int.dec(buf)];
			if(f) {
				res[f[0]] = f[1].dec(buf);
			} else {
				Any.dec(buf);
			}
		}
		return res;
	};
}

export function Struct(fields: Fields): Type<Obj<any>> {
	return {
		enc: structEncoder(fields),
		dec: structDecoder(fields),
	};
}


export function unionEncoder(branches: Branches): EncodeFunc<any> {
	return (buf: WriteBuffer, v: any): void => {
		putArrHeader(buf, 2);

		const ord = branches.ordinalOf(v);
		Int.enc(buf, ord);
		branches[ord].enc(buf, v);
	};
}

export function unionDecoder(branches: Branches): DecodeFunc<any> {
	return (buf: ReadBuffer): any => {
		getArrHeader(buf, 2);

		const t = branches[Int.dec(buf)];
		if(!t) {
			throw new TypeError("invalid union type");
		}
		return t.dec(buf);
	};
}

export function Union(branches: Branches): Type<any> {
	return {
		enc: unionEncoder(branches),
		dec: unionDecoder(branches),
	};
}


function toUTF8(v: string): ArrayBuffer {
	const n = v.length;
	const bin = new Uint8Array(4*n);

	let pos = 0, i = 0, c: number;
	while(i < n) {
		c = v.charCodeAt(i++);
		if((c & 0xfc00) === 0xd800) {
			c = (c<<10) + v.charCodeAt(i++) - 0x35fdc00;
		}

		if(c < 0x80) {
			bin[pos++] = c;
		} else if(c < 0x800) {
			bin[pos++] = 0xc0 + (c >> 6);
			bin[pos++] = 0x80 + (c & 0x3f);
		} else if(c < 0x10000) {
			bin[pos++] = 0xe0 + (c >> 12);
			bin[pos++] = 0x80 + ((c>>6) & 0x3f);
			bin[pos++] = 0x80 + (c & 0x3f);
		} else {
			bin[pos++] = 0xf0 + (c >> 18);
			bin[pos++] = 0x80 + ((c>>12) & 0x3f);
			bin[pos++] = 0x80 + ((c>>6) & 0x3f);
			bin[pos++] = 0x80 + (c & 0x3f);
		}
	}
	return bin.buffer.slice(0, pos);
}

function fromUTF8(buf: ArrayBuffer): string {
	return (new TextDecoder("utf-8")).decode(buf);
}

function typeOf(v: any): Type<any> {
	switch(typeof v) {
	case "undefined":
		return Nil;
	case "boolean":
		return Bool;
	case "number":
		return !isFinite(v) || Math.floor(v) !== v ? Float
			: v < 0 ? Int
			: Uint;
	case "string":
		return Str;
	case "object":
		return v === null ? Nil
			: Array.isArray(v) ? Arr
			: v instanceof Uint8Array || v instanceof ArrayBuffer ? Bytes
			: v instanceof Date ? Time
			: Map;
	default:
		throw new TypeError(`unsupported type ${typeof v}`);
	}
}

function tagType(tag: Tag): Type<any> {
	switch(tag) {
	case Tag.Nil:
		return Nil;
	case Tag.False:
	case Tag.True:
		return Bool;
	case Tag.Int8:
	case Tag.Int16:
	case Tag.Int32:
	case Tag.Int64:
		return Int;
	case Tag.Uint8:
	case Tag.Uint16:
	case Tag.Uint32:
	case Tag.Uint64:
		return Uint;
	case Tag.Float32:
	case Tag.Float64:
		return Float;
	case Tag.Bin8:
	case Tag.Bin16:
	case Tag.Bin32:
		return Bytes;
	case Tag.Str8:
	case Tag.Str16:
	case Tag.Str32:
		return Str;
	case Tag.Array16:
	case Tag.Array32:
		return Arr;
	case Tag.Map16:
	case Tag.Map32:
		return Map;
	case Tag.FixExt4:
	case Tag.FixExt8:
	case Tag.Ext8:
		return Time;
	default:
		if(isPosFixintTag(tag) || isNegFixintTag(tag)) {
			return Int;
		}
		if(isFixstrTag(tag)) {
			return Str;
		}
		if(isFixarrayTag(tag)) {
			return Arr;
		}
		if(isFixmapTag(tag)) {
			return Map;
		}
		throw new TypeError(`unsupported tag ${tag}`);
	}
}
