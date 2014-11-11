/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Broad Institute
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var igv = (function (igv) {



    igv.unbgzf = function(data, lim) {

        lim = data.byteLength - 100;
        var oBlockList = [];
        var ptr = [0];
        var totalSize = 0;

        console.log("");
        while (ptr[0] < lim) {


            var ba = new Uint8Array(data, ptr[0], 100); // FIXME is this enough for all credible BGZF block headers?

            var xlen = (ba[11] << 8) | (ba[10]);
            var si1 = ba[12];
            var si2 = ba[13];
            var slen = (ba[15] << 8) | (ba[14]);
            var bsize = (ba[17] << 8) | (ba[16]) + 1;

            var start = 12 + xlen + ptr[0];    // Start of CDATA
            var length = data.byteLength - start;

            if (length < (bsize + 8)) break;

           // console.log("" + bsize + "  " + start + "  " + length);

            var unc = jszlib_inflate_buffer(data, start, length, ptr);

            ptr[0] += 8;    // Skipping CRC-32 and size of uncompressed data

            totalSize += unc.byteLength;
            oBlockList.push(unc);
        }

        // Concatenate decompressed blocks
        if (oBlockList.length == 1) {
            return oBlockList[0];
        } else {
            var out = new Uint8Array(totalSize);
            var cursor = 0;
            for (var i = 0; i < oBlockList.length; ++i) {
                var b = new Uint8Array(oBlockList[i]);
                arrayCopy(b, 0, out, cursor, b.length);
                cursor += b.length;
            }
            return out.buffer;
        }
    }


    return igv;

})(igv || {});