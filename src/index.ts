import {
	Type, Collection, Obj,
	Nil, Bool, Int, Uint, Float, Bytes, Str, TypedArr, TypedMap, Time, Any, Arr, Map, Struct, Union,
	structEncoder, structDecoder, unionEncoder, unionDecoder,
} from "./types";
import {
	WriteBuffer, ReadBuffer,
	createWriteBuffer, createReadBuffer,
} from "./buffer";


export {
	WriteBuffer, ReadBuffer,
	Type, Collection, Obj,
	Nil, Bool, Int, Uint, Float, Bytes, Str, TypedArr, TypedMap, Time, Any, Arr, Map, Struct, Union,
	structEncoder, structDecoder, unionEncoder, unionDecoder,
	encode, decode,
};






function encode<T>(v: T, typ?: Type<T>): Uint8Array {
	const buf = createWriteBuffer();
	(typ || Any).enc(buf, v);
	return buf.ui8array();
}



function decode<T>(buf: BufferSource, typ?: Type<T>): T {
	return (typ || Any).dec(createReadBuffer(buf));
}
