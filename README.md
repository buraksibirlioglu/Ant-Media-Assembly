# Ant-Media-Assembly
Webinar &amp; Video Conferencing Application Build on Ant-Media-Server
## Ant Media Assembly

Web-based seminar (Webinar) is a presentation, lecture,workshop or seminar that is transmitted over the Web using video streaming services. Key feature of webinar is the ability to share receive and discuss information in real time via video conferencing software.Today's globalized world compels companies to use video conference software for increasing productivity and save time. We are glad to present [Assembly v1.0.0](https://github.com/buraksibirlioglu/Ant-Media-Assembly) Alpha which enables many-to-many video conferences using Ant-Media-Server platform. If you are interested in low latency webinars here is Assembly!

![](https://user-images.githubusercontent.com/25819600/43515481-472dae22-958b-11e8-9694-fb45b558dee5.png)
## How Assembly Works ?
Ant-Media-Server enables video streaming and receiving applications with accuracy and ultra low latency. Assembly uses this abilities of media service to offer webinars with high functionality and low latency.  Differently from traditional video conferencing software, Assembly provides participation modes as publisher or audience. Also application allows user to record webinar.
### Features
* Peer to Peer Video Communication
* Many to Many Video Conference
* Publisher/Audience Mods
* Record Conference
* Share Link

## How to Use Assembly ?
* In order to use the application, Ant-Media-Server is required as streaming service. You can get the service from [Ant-Media web page](https://antmedia.io/) and you can learn how to install the service from [documentation.](https://github.com/ant-media/Ant-Media-Server/wiki)
* If you have Ant-Media-Server installed on your host you can start using Assembly.
* Locate the Ant-Media-Server directory in your host machine.

```
$ cd webapps
$ git clone https://github.com/buraksibirlioglu/Ant-Media-Assembly
$ cp -a Ant-Media-Assembly/. WebRTCAppEE/
$ rm -rf Ant-Media-Assembly
$ cd ..
$ ./start.sh
