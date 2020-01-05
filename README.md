ecovacs-deebot.js
========

**Work in progress! The code does not work yet!**

A like for like JavaScript port based on [sucks.js](https://github.com/joostth/sucks.js) of the python project [sucks](https://github.com/wpietri/sucks) and [ozmo](https://github.com/Ligio/ozmo)
to drive an Ecovacs Deebot (Ozmo) robot vacuum.

All credits for figuring out and documenting the protocol go to [@wpietri](https://github.com/wpietri).
He documented his [findings on the protocol](http://github.com/wpietri/sucks/blob/master/protocol.md) in his repository.

## Dedication

As already mentioned above all credits for figuring out and documenting the
protocol as well as developing the python library this port is based on go
to [@wpietri](https://github.com/wpietri).

In this javascript port the following libraries are leveraged:
* [simple-xmpp](https://www.npmjs.com/package/simple-xmpp) which in turn is
  an easy to use wrapper around [node-xmpp-client](https://www.npmjs.com/package/node-xmpp-client)
  of which some elements are used directly as well.

The example code about uses the following additional resources:
* [node-machine-id](https://www.npmjs.com/package/node-machine-id) which
  provides an easy way to create a unique identifier for the machine running
  the code.
* [https://ipinfo.io/](https://ipinfo.io/) which provides a json API for IP address information
  and is free to use for testing or non-commercial use up to 1000 requests
  per day.
