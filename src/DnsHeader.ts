import { concatenateBytes, getBitAtPosition, splitWordIntoBytes } from './utils';

export class DnsHeader {
    /**
     * A random identifier is assigned to query packets. Response packets must
     * reply with the same id. This is needed to differentiate responses due to
     * the stateless nature of UDP.
     */
    protected ID: number = Math.random() * 50000 + 10000;

    /**
     * 0 for queries, 1 for responses.
     */
    protected QR: number = 0;

    /**
     * Typically always 0, see RFC1035 for details.
     */
    protected OPCODE: number = 0;

    /**
     * Set to 1 if the responding server is authoritative - that is, it "owns" -
     * the domain queried.
     */
    protected AA: number = 0;

    /**
     * Set to 1 if the message length exceeds 512 bytes. Traditionally a hint
     * that the query can be reissued using TCP, for which the length limitation
     * doesn't apply.
     */
    protected TC: number = 0;

    /**
     * Set by the sender of the request if the server should attempt to resolve
     * the query recursively if it does not have an answer readily available.
     */
    protected RD: number = 1;

    /**
     * Set by the server to indicate whether or not recursive queries are allowed.
     */
    protected RA: number = 0;

    /**
     * Originally reserved for later use, but now used for DNSSEC queries.
     */
    protected Z: number = 0;

    /**
     * Set by the server to indicate the status of the response, i.e. whether or
     * not it was successful or failed, and in the latter case providing details
     * about the cause of the failure.
     */
    protected RCODE: number = 0;

    /**
     * The number of entries in the Question Section
     */
    protected QDCOUNT: number = 1;

    /**
     * The number of entries in the Answer Section
     */
    protected ANCOUNT: number = 0;

    /**
     * The number of entries in the Authority Section
     */
    protected NSCOUNT: number = 0;

    /**
     * The number of entries in the Additional Section
     */
    protected ARCOUNT: number = 0;

    public getRawHeaderInfo() {
        return {
            ID: this.ID,
            QR: this.QR,
            OPCODE: this.OPCODE,
            AA: this.AA,
            TC: this.TC,
            RD: this.RD,
            RA: this.RA,
            Z: this.Z,
            RCODE: this.RCODE,
            QDCOUNT: this.QDCOUNT,
            ANCOUNT: this.ANCOUNT,
            NSCOUNT: this.NSCOUNT,
            ARCOUNT: this.ARCOUNT
        }
    }

    isRequest() {
        return this.QR === 0;
    }

    getNumAnswers() {
        return this.ANCOUNT;
    }

    toBuffer() {
        return Buffer.from([
            ...splitWordIntoBytes(this.ID),
            // The next two bytes (byte 3 and byte 4) encode the following
            // information:
            //
            //      0 0 0 0 0 0 0 1  0 0 1 0 0 0 0 0
            //      - -+-+-+- - - -  - -+-+- -+-+-+-
            //      Q    O    A T R  R   Z      R
            //      R    P    A C D  A          C
            //           C                      O
            //           O                      D
            //           D                      E
            //           E
            0b00000000 | (this.QR << 7) | (this.OPCODE << 3) | (this.AA << 2) | (this.TC << 1) | this.RD,
            0b00000000 | (this.RA << 7) | (this.Z << 4) | this.RCODE,
            ...splitWordIntoBytes(this.QDCOUNT),
            ...splitWordIntoBytes(this.ANCOUNT),
            ...splitWordIntoBytes(this.NSCOUNT),
            ...splitWordIntoBytes(this.ARCOUNT)
        ]);
    }

    static fromBuffer(bytes: Buffer) {
        const dnsHeader = new DnsHeader();

        // The first 2 bytes (16 bits) of the packet is the ID of the query.  To
        // get this number, we can "concatenate" the first two bytes (8 bits
        // each).
        dnsHeader.ID = concatenateBytes(bytes[0], bytes[1]);

        // The next two bytes (byte 3 and byte 4) encode the following
        // information:
        //
        //      0 0 0 0 0 0 0 1  0 0 1 0 0 0 0 0
        //      - -+-+-+- - - -  - -+-+- -+-+-+-
        //      Q    O    A T R  R   Z      R
        //      R    P    A C D  A          C
        //           C                      O
        //           O                      D
        //           D                      E
        //           E
        dnsHeader.QR = getBitAtPosition(bytes[2], 7);
        dnsHeader.OPCODE = bytes[2] >> 3 & 0b00001111;
        dnsHeader.AA = getBitAtPosition(bytes[2], 2);
        dnsHeader.TC = getBitAtPosition(bytes[2], 1);

        if (dnsHeader.TC === 1) {
            throw new Error("DNS packets greater than 512 are currently not supported");
        }

        dnsHeader.RD = getBitAtPosition(bytes[2], 0);

        dnsHeader.RA = getBitAtPosition(bytes[3], 7);
        dnsHeader.Z = bytes[3] >> 4 & 0b00000111;
        dnsHeader.RCODE = bytes[3] & 0b00001111;
        
        dnsHeader.QDCOUNT = concatenateBytes(bytes[4], bytes[5]);
        dnsHeader.ANCOUNT = concatenateBytes(bytes[6], bytes[7]);
        dnsHeader.NSCOUNT = concatenateBytes(bytes[8], bytes[9]);
        dnsHeader.ARCOUNT = concatenateBytes(bytes[10], bytes[11]);

        return dnsHeader;
    }
}
