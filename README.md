# msgpack-js
`msgpack-js` is a [MessagePack](http://msgpack.org/) implementation for JavaScript and TypeScript.

## Encoding
To encode objects into the binary MessagePack format, an `encode` function is provided:
```typescript
function encode<T>(v: T, typ?: Type<T>): Uint8Array;
```
This function takes an object of an arbitrary type and converts it to its binary representation. If the type of the object is known in advance, an optional `typ` parameter could be passed to indicate the encoding algorithm. For an automatic type detection this parameter could be omitted.

## Decoding
To decode binary MessagePack data into objects, a `decode` function is provided:
```typescript
function decode<T>(buf: BufferSource, typ?: Type<T>): T;
```
This function takes a buffer containing the binary data and converts it to an object. The buffer could either be an `ArrayBuffer` or an `ArrayBufferView` and should contain valid MessagePack data. If a certain type is expected, an optional `typ` parameter could be passed. For automatic detection from the buffer's content this parameter could be omitted.

## Example
```typescript
import {encode, decode} from "messagepack";

const bin1 = encode({foo: 7, bar: "seven"});
const obj = decode(bin1);
console.log(obj);

const bin2 = encode("foobar");
const str = decode(bin2);
console.log(str);
```

## Types
Sometimes even a JavaScript developer wants to have a little bit more type safety. In this situation specific types could be passed to the `encode` and `decode` functions. If the object or the binary data has an incompatible type, an error will be thrown.

The following types are supported:
* `Nil` for null values,
* `Bool` for boolean values,
* `Int` for signed integer values,
* `Uint` for unsigned integer values,
* `Float` for floating-point values,
* `Bytes` for binary data,
* `Str` for string values,
* `Arr` for arrays,
* `Map` for objects,
* `Time` for date and time values, and
* `Any` for automatically detecting the type and forward it to one of the types above.

The `Arr` and `Map` types provide generic encoding and decoding for their elements, i.e. `Arr` and `Map` essentially equal `Any[]` and `Map<Str, Any>` respectively. If more stringent element types are required, the `TypedArr` and `TypedMap` functions could be used instead:
```typescript
import {TypedArr, TypedMap, Int, Str} from "messagepack";

const IntArray = TypedArr(Int);
const IntStrMap = TypedMap(Int, Str);
```
