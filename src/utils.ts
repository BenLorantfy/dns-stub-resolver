export function concatenateBytes(byte1 :number, byte2: number) {
    // To do this, we left shift the first byte by 8, and then bitwise OR
    // with the second byte.
    // 
    // For example, say we have two bytes:
    //  1. 10010101
    //  2. 11100101
    // 
    // If we left bitwise shift the first byte by 8, we will get this:
    //
    //  1001010100000000
    //  (adds 8 zeros on the end)
    //
    // If we bitwise OR this with the 2nd byte, we'll replace the end zeros with
    // the 2nd byte.  This happens because when you OR a zero with X, you'll
    // get X.  
    //
    //      1001010100000000 <- first byte shifted left by 8 zeros
    //      0000000011100101 <- second byte
    //  OR  ----------------
    //      1001010111100101 <- result is first byte concatented with second byte
    //
    // https://stackoverflow.com/questions/1935449/how-do-i-concatenate-2-bytes
    return byte1 << 8 | byte2;
}

export function getBitAtPosition(byte: number, position: number) {
    // Say you have this number:
    //   10010000
    //      ^ and you want this digit
    //
    // If you left shift by 5 you'll get this
    //   00001001
    // 
    // and then if you bit-wise AND 1:
    //
    //      00001001
    // AND  00000001
    //      --------
    //      00000001
    // 
    // You'll turn the first 7 digits to 0 and the last digit to whatever the
    // value was in the first byte
    return (byte >> position) & 0b00000001;
}