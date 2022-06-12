# dns-stub-resolver

This is a very basic DNS stub resolver - essentially a simple DNS client.  It can only take a domain name and get the IPv4 address.  This is how to use it:

```bash
npm install -g dns-stub-resolver
dns-stub-resolver google.com
```

Here is some example output for a few domains:
```
$ dns-stub-resolver google.com
172.217.165.14
```

```
$ dns-stub-resolver benlorantfy.com
76.76.21.21
```

```
$ dns-stub-resolver twitter.com
104.244.42.129
```

You can also see the help page by running:
```
dns-stub-resolver --help
```

This project was mostly to learn more about how DNS works.  I learned a lot from [this guide](https://github.com/EmilHernvall/dnsguide) but I wrote the code without really looking at the rust version in this guide.

I may add support for more record types in the future, and possibly implement a recursive resolver so it doesn't have to depend on google's public DNS server.

## What does this do?

This program does the following:
1. Takes a domain name as input
2. Constructs a DNS query packet. Basically a string of bytes representing a small DNS payload.
3. Sends the DNS query packet over UDP to google's public DNS server
4. Recieves the DNS response packet from google
5. Parses the DNS response packet and finds the IP address
6. Outputs the IP address to stdout
