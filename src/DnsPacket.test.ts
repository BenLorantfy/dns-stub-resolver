import { expect, test } from 'vitest'
import { DnsPacket } from './DnsPacket';

test('should properly parse a DNS response', () => {
    const buffer = Buffer.from([
        0x95, 
        0xe5, 
        0b10000001,
        0b10000000,

        // Num questions
        0x00,
        0x01,

        // Num answers
        0x00,
        0x01,

        // Num authority
        0x00,
        0x00,

        // Num additional
        0x00,
        0x00,

        // Payload
        //                         query name              type   class
        //            -----------------------------------  -----  -----
        //     HEX    06 67 6f 6f 67 6c 65 03 63 6f 6d 00  00 01  00 01
        //     ASCII     g  o  o  g  l  e     c  o  m
        //     DEC    6                    3           0       1      1

        // Query name
        0x06,
        0x67,
        0x6f,
        0x6f,
        0x67,
        0x6c,
        0x65,
        0x03,
        0x63,
        0x6f,
        0x6d,
        0x00,

        // Type
        0x00,
        0x01,

        // Class
        0x00,
        0x01,

        // Answer name
        0xc0,
        0x0c,
        0x00,
        0x01,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x13,
        0x00,
        0x04,
        0x8e,
        0xfb,
        0x29,
        0x2e,
    ]);

    const dnsPacket = DnsPacket.fromBytes(buffer);
    const dnsHeader = dnsPacket.dnsHeader.getRawHeaderInfo();
    
    expect(dnsHeader).toEqual({
        ID: 0x95e5,
        QR: 1,
        OPCODE: 0,
        AA: 0,
        TC: 0,
        RD: 1,
        RA: 1,
        Z: 0,
        RCODE: 0,
        QDCOUNT: 1,
        ANCOUNT: 1,
        NSCOUNT: 0,
        ARCOUNT: 0
    })

    expect(dnsPacket.queryName).toEqual('google.com');
    expect(dnsPacket.queryType).toEqual(1); // A record
    expect(dnsPacket.queryClass).toEqual(1);

    expect(dnsPacket.answer).toEqual({
        name: 'google.com',
        type: 1,
        class: 1,
        ttl: 19,
        len: 4,
        ip: '142.251.41.46'
    });
})

test('should properly parse a DNS request and convert it back to a buffer', () => {
    const buffer = Buffer.from([
        // ID
        0x95, 
        0xe5, 

        // Misc info
        0x01,
        0x20,

        // Num questions
        0x00,
        0x01,

        // Num answers
        0x00,
        0x00,

        // Num authority
        0x00,
        0x00,

        // Num additional
        0x00,
        0x00,

        // Payload
        //                         query name              type   class
        //            -----------------------------------  -----  -----
        //     HEX    06 67 6f 6f 67 6c 65 03 63 6f 6d 00  00 01  00 01
        //     ASCII     g  o  o  g  l  e     c  o  m
        //     DEC    6                    3           0       1      1

        // Query name
        0x06,
        0x67,
        0x6f,
        0x6f,
        0x67,
        0x6c,
        0x65,
        0x03,
        0x63,
        0x6f,
        0x6d,
        0x00,

        // Type
        0x00,
        0x01,

        // Class
        0x00,
        0x01
    ]);

    const dnsPacket = DnsPacket.fromBytes(buffer);
    const buffer2 = dnsPacket.toBuffer();

    expect(buffer2.toString('hex')).toEqual(
        // Header
        '95e501200001000000000000' + 
        // Question
        '06676f6f676c6503636f6d0000010001'
    );
})