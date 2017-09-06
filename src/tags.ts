
export const enum Tag {
	Nil = 0xc0, // 11000000

	// bool
	False = 0xc2, // 11000010
	True  = 0xc3, // 11000011

	// int
	Int8  = 0xd0, // 11010000
	Int16 = 0xd1, // 11010001
	Int32 = 0xd2, // 11010010
	Int64 = 0xd3, // 11010011

	// uint
	Uint8  = 0xcc, // 11001100
	Uint16 = 0xcd, // 11001101
	Uint32 = 0xce, // 11001110
	Uint64 = 0xcf, // 11001111

	// float
	Float32 = 0xca, // 11001010
	Float64 = 0xcb, // 11001011

	// string
	Str8  = 0xd9, // 11011001
	Str16 = 0xda, // 11011010
	Str32 = 0xdb, // 11011011

	// binary
	Bin8  = 0xc4, // 11000100
	Bin16 = 0xc5, // 11000101
	Bin32 = 0xc6, // 11000110

	// array
	Array16 = 0xdc, // 11011100
	Array32 = 0xdd, // 11011101

	// map
	Map16 = 0xde, // 11011110
	Map32 = 0xdf, // 11011111

	// ext
	Ext8     = 0xc7, // 11000111
	Ext16    = 0xc8, // 11001000
	Ext32    = 0xc9, // 11001001
	FixExt1  = 0xd4, // 11010100
	FixExt2  = 0xd5, // 11010101
	FixExt4  = 0xd6, // 11010110
	FixExt8  = 0xd7, // 11010111
	FixExt16 = 0xd8, // 11011000
}



// positive fixint: 0xxx xxxx
export function posFixintTag(i: number): Tag {
	return i & 0x7f;
}

export function isPosFixintTag(tag: Tag): boolean {
	return (tag & 0x80) === 0;
}

export function readPosFixint(tag: Tag): number {
	return tag & 0x7f
}


// negative fixint: 111x xxxx
export function negFixintTag(i: number): Tag {
	return 0xe0 | (i & 0x1f);
}

export function isNegFixintTag(tag: Tag): boolean {
	return (tag & 0xe0) == 0xe0;
}

export function readNegFixint(tag: Tag): number {
	return tag - 0x100;
}


// fixstr: 101x xxxx
export function fixstrTag(length: number): Tag {
	return 0xa0 | (length & 0x1f);
}

export function isFixstrTag(tag: Tag): boolean {
	return (tag & 0xe0) == 0xa0;
}

export function readFixstr(tag: Tag): number {
	return tag & 0x1f;
}


// fixarray: 1001 xxxx
export function fixarrayTag(length: number): Tag {
	return 0x90 | (length & 0x0f);
}

export function isFixarrayTag(tag: Tag): boolean {
	return (tag & 0xf0) == 0x90;
}

export function readFixarray(tag: Tag): number {
	return tag & 0x0f;
}


// fixmap: 1000 xxxx
export function fixmapTag(length: number): Tag {
	return 0x80 | (length & 0x0f);
}

export function isFixmapTag(tag: Tag): boolean {
	return (tag & 0xf0) == 0x80;
}

export function readFixmap(tag: Tag): number {
	return tag & 0x0f;
}
