import * as process from "process";
import {Tag, posFixintTag, negFixintTag, fixstrTag, fixarrayTag, fixmapTag} from "./tags";
import {Nil, Bool, Int, Uint, Float, Bytes, Str, Arr, Map, Any} from "./types";
import {encode, decode} from "./index";



function runTests(t: T): void {
	// decode
	const encodeTests = [
		// nil
		{
			val: undefined,
			typ: Nil,
			bin: [Tag.Nil],
		},
		{
			val: null,
			typ: Nil,
			bin: [Tag.Nil],
		},
		{
			val: 7,
			typ: Nil,
			bin: [Tag.Nil],
		},
		{
			val: "foo",
			typ: Nil,
			bin: [Tag.Nil],
		},
		{
			val: [7, "foo"],
			typ: Nil,
			bin: [Tag.Nil],
		},
		// bool
		{
			val: true,
			typ: Bool,
			bin: [Tag.True],
		},
		{
			val: false,
			typ: Bool,
			bin: [Tag.False],
		},
		// int
		{
			val: 7,
			typ: Int,
			bin: [posFixintTag(7)],
		},
		{
			val: -7,
			typ: Int,
			bin: [negFixintTag(-7)],
		},
		{
			val: -128,
			typ: Int,
			bin: [Tag.Int8, 0x80],
		},
		{
			val: -32768,
			typ: Int,
			bin: [Tag.Int16, 0x80, 0x0],
		},
		{
			val: 32767,
			typ: Int,
			bin: [Tag.Int16, 0x7f, 0xff],
		},
		{
			val: 2147483647,
			typ: Int,
			bin: [Tag.Int32, 0x7f, 0xff, 0xff, 0xff],
		},
		{
			val: -2147483648,
			typ: Int,
			bin: [Tag.Int32, 0x80, 0x0, 0x0, 0x0],
		},
		{
			val: 2147483648,
			typ: Int,
			bin: [Tag.Int64, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00],
		},
		{
			val: 4294967296,
			typ: Int,
			bin: [Tag.Int64, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00],
		},
		{
			val: -2147483649,
			typ: Int,
			bin: [Tag.Int64, 0xff, 0xff, 0xff, 0xff, 0x7f, 0xff, 0xff, 0xff],
		},
		{
			val: 549764202560,
			typ: Int,
			bin: [Tag.Int64, 0x00, 0x00, 0x00, 0x80, 0x00, 0x80, 0x00, 0x40],
		},
		{
			val: -549764202560,
			typ: Int,
			bin: [Tag.Int64, 0xff, 0xff, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0xc0],
		},
		// uint
		{
			val: 7,
			typ: Uint,
			bin: [posFixintTag(7)],
		},
		{
			val: 255,
			typ: Uint,
			bin: [Tag.Uint8, 0xff],
		},
		{
			val: 65535,
			typ: Uint,
			bin: [Tag.Uint16, 0xff, 0xff],
		},
		{
			val: 4294967295,
			typ: Uint,
			bin: [Tag.Uint32, 0xff, 0xff, 0xff, 0xff],
		},
		{
			val: 4294967296,
			typ: Uint,
			bin: [Tag.Uint64, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00],
		},
		{
			val: 549764202560,
			typ: Uint,
			bin: [Tag.Uint64, 0x00, 0x00, 0x00, 0x80, 0x00, 0x80, 0x00, 0x40],
		},
		// float
		{
			val: 3.141592,
			typ: Float,
			bin: [Tag.Float64, 0x40, 0x09, 0x21, 0xfa, 0xfc, 0x8b, 0x00, 0x7a],
		},
		// bytes
		{
			val: new Uint8Array(repeat(0x30, 1)),
			typ: Bytes,
			bin: [Tag.Bin8, 0x1].concat(repeat(0x30, 1)),
		},
		{
			val: new Uint8Array(repeat(0x30, 256)),
			typ: Bytes,
			bin: [Tag.Bin16, 0x01, 0x00].concat(repeat(0x30, 256)),
		},
		{
			val: new Uint8Array(repeat(0x30, 65536)),
			typ: Bytes,
			bin: [Tag.Bin32, 0x00, 0x01, 0x00, 0x00].concat(repeat(0x30, 65536)),
		},
		// string
		{
			val: "0",
			typ: Str,
			bin: [fixstrTag(1), 0x30],
		},
		{
			val: "ä",
			typ: Str,
			bin: [fixstrTag(2), 0xc3, 0xa4],
		},
		{
			val: "∞",
			typ: Str,
			bin: [fixstrTag(3), 0xe2, 0x88, 0x9e],
		},
		{
			val: "𐍈",
			typ: Str,
			bin: [fixstrTag(4), 0xf0, 0x90, 0x8d, 0x88],
		},
		{
			val: repeats("0", 7),
			typ: Str,
			bin: [fixstrTag(7)].concat(repeat(0x30, 7)),
		},
		{
			val: repeats("0", 32),
			typ: Str,
			bin: [Tag.Str8, 0x20].concat(repeat(0x30, 32)),
		},
		{
			val: repeats("0", 256),
			typ: Str,
			bin: [Tag.Str16, 0x01, 0x00].concat(repeat(0x30, 256)),
		},
		{
			val: repeats("0", 65536),
			typ: Str,
			bin: [Tag.Str32, 0x00, 0x01, 0x00, 0x00].concat(repeat(0x30, 65536)),
		},
		// array (32 bit not testable due to oom)
		{
			val: repeat(13, 7),
			typ: Arr,
			bin: [fixarrayTag(7)].concat(repeat(posFixintTag(13), 7)),
		},
		{
			val: repeat(13, 65535),
			typ: Arr,
			bin: [Tag.Array16, 0xff, 0xff].concat(repeat(posFixintTag(13), 65535)),
		},
		// map
		{
			val: {a: 7, b: 13},
			typ: Map,
			bin: [fixmapTag(2), fixstrTag(1), 0x61, posFixintTag(7), fixstrTag(1), 0x62, posFixintTag(13)],
		},
		// any
		{
			val: undefined,
			typ: Any,
			bin: [Tag.Nil],
		},
		{
			val: null,
			typ: Any,
			bin: [Tag.Nil],
		},
		{
			val: true,
			typ: Any,
			bin: [Tag.True],
		},
		{
			val: false,
			typ: Any,
			bin: [Tag.False],
		},
		{
			val: -128,
			typ: Any,
			bin: [Tag.Int8, 0x80],
		},
		{
			val: 255,
			typ: Any,
			bin: [Tag.Uint8, 0xff],
		},
		{
			val: 3.141592,
			typ: Any,
			bin: [Tag.Float64, 0x40, 0x09, 0x21, 0xfa, 0xfc, 0x8b, 0x00, 0x7a],
		},
		{
			val: new Uint8Array([0x0a, 0x0b, 0x0c]),
			typ: Any,
			bin: [Tag.Bin8, 0x03, 0x0a, 0x0b, 0x0c],
		},
		{
			val: (new Uint8Array([0x0a, 0x0b, 0x0c])).buffer,
			typ: Any,
			bin: [Tag.Bin8, 0x03, 0x0a, 0x0b, 0x0c],
		},
		{
			val: "12345678901234567890123456789012",
			typ: Any,
			bin: [Tag.Str8, 0x20, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32],
		},
		{
			val: [],
			typ: Any,
			bin: [fixarrayTag(0)],
		},
		{
			val: {},
			typ: Any,
			bin: [fixmapTag(0)],
		},
	];

	for(let i = 0; i < encodeTests.length; ++i) {
		const test = encodeTests[i];
		try {
			const bin = encode(test.val, test.typ);
			const expected = new Uint8Array(test.bin);
			if(!bufEqual(bin, expected)) {
				t.error(`unexpected encoding at ${i} for '${test.val}': ${fmtBuf(bin)}, expected ${fmtBuf(expected)}`);
			}
		} catch(e) {
			t.error(`unexpected error at ${i} for '${test.val}': ${e}`);
		}
	}


	// decode
	const decodeTests = [
		// nil
		{
			bin: [Tag.Nil],
			typ: Nil,
			val: null,
		},
		// bool
		{
			bin: [Tag.Nil],
			typ: Bool,
			val: false,
		},
		{
			bin: [Tag.False],
			typ: Bool,
			val: false,
		},
		{
			bin: [Tag.True],
			typ: Bool,
			val: true,
		},
		// int
		{
			bin: [posFixintTag(7)],
			typ: Int,
			val: 7,
		},
		{
			bin: [negFixintTag(-7)],
			typ: Int,
			val: -7,
		},
		{
			bin: [Tag.Nil],
			typ: Int,
			val: 0,
		},
		{
			bin: [Tag.Int8, 0x9e],
			typ: Int,
			val: -98,
		},
		{
			bin: [Tag.Int8, 0x62],
			typ: Int,
			val: 98,
		},
		{
			bin: [Tag.Int8, 0x9e],
			typ: Int,
			val: -98,
		},
		{
			bin: [Tag.Int16, 0x48, 0x72],
			typ: Int,
			val: 18546,
		},
		{
			bin: [Tag.Int16, 0xb7, 0x8e],
			typ: Int,
			val: -18546,
		},
		{
			bin: [Tag.Int32, 0x04, 0x8a, 0x51, 0x9d],
			typ: Int,
			val: 76173725,
		},
		{
			bin: [Tag.Int32, 0xfb, 0x75, 0xae, 0x63],
			typ: Int,
			val: -76173725,
		},
		{
			bin: [Tag.Int64, 0x00, 0x00, 0x04, 0x8a, 0x51, 0x9d, 0x7f, 0xa3],
			typ: Int,
			val: 4992121274275,
		},
		{
			bin: [Tag.Int64, 0xff, 0xff, 0xfb, 0x75, 0xae, 0x62, 0x80, 0x5d],
			typ: Int,
			val: -4992121274275,
		},
		{
			bin: [Tag.Uint8, 0x62],
			typ: Int,
			val: 98,
		},
		{
			bin: [Tag.Uint16, 0x48, 0x72],
			typ: Int,
			val: 18546,
		},
		{
			bin: [Tag.Uint32, 0x04, 0x8a, 0x51, 0x9d],
			typ: Int,
			val: 76173725,
		},
		{
			bin: [Tag.Uint64, 0x00, 0x00, 0x04, 0x8a, 0x51, 0x9d, 0x7f, 0xa3],
			typ: Int,
			val: 4992121274275,
		},
		// uint
		{
			bin: [posFixintTag(7)],
			typ: Int,
			val: 7,
		},
		{
			bin: [Tag.Nil],
			typ: Int,
			val: 0,
		},
		{
			bin: [Tag.Int8, 0x62],
			typ: Int,
			val: 98,
		},
		{
			bin: [Tag.Int16, 0x48, 0x72],
			typ: Int,
			val: 18546,
		},
		{
			bin: [Tag.Int32, 0x04, 0x8a, 0x51, 0x9d],
			typ: Int,
			val: 76173725,
		},
		{
			bin: [Tag.Int64, 0x00, 0x00, 0x04, 0x8a, 0x51, 0x9d, 0x7f, 0xa3],
			typ: Int,
			val: 4992121274275,
		},
		{
			bin: [Tag.Uint8, 0x62],
			typ: Int,
			val: 98,
		},
		{
			bin: [Tag.Uint16, 0x48, 0x72],
			typ: Int,
			val: 18546,
		},
		{
			bin: [Tag.Uint32, 0x04, 0x8a, 0x51, 0x9d],
			typ: Int,
			val: 76173725,
		},
		{
			bin: [Tag.Uint64, 0x00, 0x00, 0x04, 0x8a, 0x51, 0x9d, 0x7f, 0xa3],
			typ: Int,
			val: 4992121274275,
		},
		// float
		{
			bin: [Tag.Nil],
			typ: Float,
			val: 0,
		},
		{
			bin: [Tag.Float32, 0x3f, 0xc0, 0x00, 0x00],
			typ: Float,
			val: 1.5,
		},
		{
			bin: [Tag.Float64, 0x40, 0x09, 0x21, 0xfa, 0xfc, 0x8b, 0x00, 0x7a],
			typ: Float,
			val: 3.141592,
		},
		// bytes
		{
			bin: [fixstrTag(5), 0x30, 0x30, 0x30, 0x30, 0x30],
			typ: Bytes,
			val: new Uint8Array([0x30, 0x30, 0x30, 0x30, 0x30]),
			eq: (x, y) => bufEqual(new Uint8Array(x), y),
		},
		{
			bin: [Tag.Bin8, 0x05, 0x30, 0x30, 0x30, 0x30, 0x30],
			typ: Bytes,
			val: new Uint8Array([0x30, 0x30, 0x30, 0x30, 0x30]),
			eq: (x, y) => bufEqual(new Uint8Array(x), y),
		},
		{
			bin: [Tag.Bin16, 0x01, 0x00].concat(repeat(0x30, 256)),
			typ: Bytes,
			val: new Uint8Array(repeat(0x30, 256)),
			eq: (x, y) => bufEqual(new Uint8Array(x), y),
		},
		{
			bin: [Tag.Bin32, 0x00, 0x01, 0x00, 0x00].concat(repeat(0x30, 65536)),
			typ: Bytes,
			val: new Uint8Array(repeat(0x30, 65536)),
			eq: (x, y) => bufEqual(new Uint8Array(x), y),
		},
		// string
		{
			bin: [fixstrTag(2), 0xc3, 0xa4],
			typ: Str,
			val: "ä",
		},
		{
			bin: [fixstrTag(3), 0xe2, 0x88, 0x9e],
			typ: Str,
			val: "∞",
		},
		{
			bin: [fixstrTag(4), 0xf0, 0x90, 0x8d, 0x88],
			typ: Str,
			val: "𐍈",
		},
		{
			bin: [fixstrTag(5), 0x30, 0x30, 0x30, 0x30, 0x30],
			typ: Str,
			val: "00000",
		},
		{
			bin: [Tag.Bin8, 0x05, 0x30, 0x30, 0x30, 0x30, 0x30],
			typ: Str,
			val: "00000",
		},
		{
			bin: [Tag.Bin16, 0x01, 0x00].concat(repeat(0x30, 256)),
			typ: Str,
			val: repeats("0", 256),
		},
		{
			bin: [Tag.Bin32, 0x00, 0x01, 0x00, 0x00].concat(repeat(0x30, 65536)),
			typ: Str,
			val: repeats("0", 65536),
		},
		// array
		{
			bin: [fixarrayTag(2), posFixintTag(7), fixstrTag(1), 0x30],
			typ: Arr,
			val: [7, "0"],
			eq: arrayEqual,
		},
		{
			bin: [Tag.Array16, 0x00, 0x01, negFixintTag(-7)],
			typ: Arr,
			val: [-7],
			eq: arrayEqual,
		},
		{
			bin: [Tag.Array32, 0x00, 0x00, 0x00, 0x01, fixstrTag(3), 0xe2, 0x88, 0x9e],
			typ: Arr,
			val: ["∞"],
			eq: arrayEqual,
		},
		// map
		{
			bin: [fixmapTag(1), fixstrTag(1), 0x61, posFixintTag(7)],
			typ: Map,
			val: {"a": 7},
			eq: objectEqual,
		},
		{
			bin: [Tag.Map16, 0x00, 0x01, fixstrTag(1), 0x61, posFixintTag(7)],
			typ: Map,
			val: {"a": 7},
			eq: objectEqual,
		},
		{
			bin: [Tag.Map32, 0x00, 0x00, 0x00, 0x01, fixstrTag(3), 0x69, 0x6e, 0x66, fixstrTag(3), 0xe2, 0x88, 0x9e],
			typ: Map,
			val: {"inf": "∞"},
			eq: objectEqual,
		},
		// any
		{
			bin: [Tag.Nil],
			typ: Any,
			val: null,
		},
		{
			bin: [Tag.False],
			typ: Any,
			val: false,
		},
		{
			bin: [Tag.True],
			typ: Any,
			val: true,
		},
		{
			bin: [posFixintTag(7)],
			typ: Any,
			val: 7,
		},
		{
			bin: [negFixintTag(-7)],
			typ: Any,
			val: -7,
		},
		{
			bin: [Tag.Int8, 0x80],
			typ: Any,
			val: -128,
		},
		{
			bin: [Tag.Int16, 0xff, 0x80],
			typ: Any,
			val: -128,
		},
		{
			bin: [Tag.Int32, 0xff, 0xff, 0xff, 0x80],
			typ: Any,
			val: -128,
		},
		{
			bin: [Tag.Int64, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x80],
			typ: Any,
			val: -128,
		},
		{
			bin: [Tag.Uint8, 0x07],
			typ: Any,
			val: 7,
		},
		{
			bin: [Tag.Uint16, 0x01, 0x10],
			typ: Any,
			val: 272,
		},
		{
			bin: [Tag.Uint32, 0x0a, 0x7e, 0x00, 0x43],
			typ: Any,
			val: 176029763,
		},
		{
			bin: [Tag.Uint64, 0x00, 0x00, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc],
			typ: Any,
			val: 20015998343868,
		},
		{
			bin: [Tag.Float32, 0x3e, 0x20, 0x00, 0x00],
			typ: Any,
			val: 0.15625,
		},
		{
			bin: [Tag.Float64, 0x40, 0x09, 0x21, 0xfa, 0xfc, 0x8b, 0x00, 0x7a],
			typ: Any,
			val: 3.141592,
		},
		{
			bin: [Tag.Bin8, 0x03, 0x0d, 0x0e, 0x0f],
			typ: Any,
			val: new Uint8Array([0x0d, 0x0e, 0x0f]),
			eq: (x, y) => bufEqual(new Uint8Array(x), y),
		},
		{
			bin: [Tag.Bin16, 0x00, 0x03, 0x0d, 0x0e, 0x0f],
			typ: Any,
			val: new Uint8Array([0x0d, 0x0e, 0x0f]),
			eq: (x, y) => bufEqual(new Uint8Array(x), y),
		},
		{
			bin: [Tag.Bin32, 0x00, 0x00, 0x00, 0x03, 0x0d, 0x0e, 0x0f],
			typ: Any,
			val: new Uint8Array([0x0d, 0x0e, 0x0f]),
			eq: (x, y) => bufEqual(new Uint8Array(x), y),
		},
		{
			bin: [fixstrTag(1), 0x30],
			typ: Any,
			val: "0",
		},
		{
			bin: [Tag.Str8, 0x03, 0xe2, 0x88, 0x9e],
			typ: Any,
			val: "∞",
		},
		{
			bin: [Tag.Str16, 0x00, 0x04, 0xf0, 0x90, 0x8d, 0x88],
			typ: Any,
			val: "𐍈",
		},
		{
			bin: [Tag.Str32, 0x00, 0x00, 0x00, 0x02, 0xc3, 0xa4],
			typ: Any,
			val: "ä",
		},
		{
			bin: [fixarrayTag(1), fixstrTag(1), 0x30],
			typ: Any,
			val: ["0"],
			eq: arrayEqual,
		},
		{
			bin: [Tag.Array16, 0x00, 0x01, posFixintTag(5)],
			typ: Any,
			val: [5],
			eq: arrayEqual,
		},
		{
			bin: [Tag.Array32, 0x00, 0x00, 0x00, 0x01, negFixintTag(-13)],
			typ: Any,
			val: [-13],
			eq: arrayEqual,
		},
		{
			bin: [fixmapTag(1), fixstrTag(1), 0x61, negFixintTag(-12)],
			typ: Any,
			val: {"a": -12},
			eq: objectEqual,
		},
		{
			bin: [Tag.Map16, 0x00, 0x01, fixstrTag(2), 0xc3, 0xa4, posFixintTag(11)],
			typ: Any,
			val: {"ä": 11},
			eq: objectEqual,
		},
		{
			bin: [Tag.Map32, 0x00, 0x00, 0x00, 0x01, fixstrTag(2), 0x31, 0x30, fixstrTag(1), 0x32],
			typ: Any,
			val: {"10": "2"},
			eq: objectEqual,
		},
	];
	for(let i = 0; i < decodeTests.length; ++i) {
		const test = decodeTests[i];
		const bin = new Uint8Array(test.bin);
		try {
			const val = decode(bin, test.typ);
			const eq = opEqual(test);
			if(!eq(val, test.val)) {
				t.error(`unexpected decoding at ${i} for '${fmtBuf(bin)}': ${val}, expected ${test.val}`);
			}
		} catch(e) {
			t.error(`unexpected error at ${i} for '${fmtBuf(bin)}': ${e}`);
		}
	}
}



class T {
	private _errs: string[];


	public constructor() {
		this._errs = [];
	}

	public error(msg: string): void {
		this._errs.push(msg);
	}

	public failed(): boolean {
		return this._errs.length !== 0;
	}

	public report(): boolean {
		if(this._errs.length === 0) {
			console.log("> PASSED");
			return true;
		}
		console.error(this._errs.reduce((msg, err) => `${msg}\n    ${err}`, "> FAILED"));
		return false;
	}
}



function repeat<T>(x: T, n: number): T[] {
	let res = [];
	for(let i = 0; i < n; ++i) {
		res.push(x);
	}
	return res;
}

function repeats(s: string, n: number): string {
	let res = "";
	for(let i = 0; i < n; ++i) {
		res += s;
	}
	return res;
}

function fmtBuf(buf: Uint8Array): string {
	const list = Array.prototype.map.call(buf, x => `0${ x.toString(16)}`.slice(-2)).join(",");
	return `[${list}]`;
}

function opEqual(test: any): (x: any, y: any) => boolean {
	if(test.eq) {
		return test.eq;
	}
	return (x, y) => x === y;
}

function arrayEqual(x: any[], y: any[]): boolean {
	return x.length === y.length
		&& x.every((v, i) => v === y[i]);
}

function objectEqual(x: any, y: any): boolean {
	for(const p in x) {
		if(!(p in y) || x[p] !== y[p]) {
			return false;
		}
	}
	for(const p in y) {
		if(!(p in x) || x[p] !== y[p]) {
			return false;
		}
	}
	return true;
}

function bufEqual(left: Uint8Array, right: Uint8Array): boolean {
	if(left.length !== right.length) {
		return false;
	}
	for(let i = 0; i < left.length; ++i) {
		if(left[i] !== right[i]) {
			return false;
		}
	}
	return true;
}






console.log("RUN TESTS...");
const t = new T();
runTests(t);
if(!t.report()) {
	process.exit(1);
}
