import {Type, Nil, Bool, Int, Uint, Float, Bytes, Str, Arr, TypedArr, Map, TypedMap, Any} from "./types";
import {createWriteBuffer, createReadBuffer} from "./buffer";


export {
	Type, Nil, Bool, Int, Uint, Float, Bytes, Str, Arr, TypedArr, Map, TypedMap, Any,
	encode, decode,
};



function encode(v: any, typ?: Type): Uint8Array {
	const buf = createWriteBuffer();
	(typ || Any).enc(buf, v);
	return buf.ui8array();
}



function decode(buf: BufferSource, typ?: Type): any {
	return (typ || Any).dec(createReadBuffer(buf));
}
