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

### Structs
A struct is an object type with a predefined shape. To define such a type, the function
```typescript
function Struct(fields: Fields): Type<Obj<any>>;
```
can be used, which creates a type out of the predefined fields. All fields, that do not belong to the struct definition, will be omitted during the encoding and decoding process. To save some bytes and allow name changes, a struct is not simply encoded as a map with string keys. Instead, each field consists of a name, a type, and an ordinal, where the ordinal is used to uniquely identify a field.

Here is an example, how define a struct:
```typescript
import {Struct, Int, Str} from "messagepack";

const S = Struct({
    // ordinal: [name, type],
    1: ["foo", Int],
    2: ["bar", Str],
});
```

### Unions
A union is a value, that can be one of several types. To define a union type, the function
```typescript
function Union(branches: Branches): Type<any>;
```
can be used, which creates a type out of the predefined branches. Each branch consists of an ordinal and a type. If a type should be encoded or decoded, that is not part of the union definition, an exception will be thrown.

Here is an example, how to define a union:
```typescript
import {Union, Int, Str} from "messagepack";

const U = Union({
    // ordinal: type,
    1: Int,
    2: Str,
});
```

### Cyclic Dependencies
When using the `Struct` and the `Union` functions, the declaration order of types is important. All types has to be defined before they can be used. This makes cyclic type dependencies impossible. To solve this issue, there are separate functions to create the encoder and decoder functions for struct and union types:
```typescript
function structEncoder(fields: Fields): EncodeFunc<any>;
function structDecoder(fields: Fields): DecodeFunc<any>;

function unionEncoder(branches: Branches): EncodeFunc<any>;
function unionDecoder(branches: Branches): DecodeFunc<any>;
```
Equipped with these functions, struct and union type can be defined with
```typescript
import {structEncoder, structDecoder} from "messagepack";

const T = {
    enc: structEncoder(fields),
    dec: structDecoder(fields),
};
```
where `fields` is an object containing the struct fields (see above).
