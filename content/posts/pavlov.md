---
date: '2026-08-15T13:46:49+02:00'
draft: false
title: 'Using a shock collar to stop myself doomscrolling'
---

I'm hooked up to the dopamine scroll machine where Meta harvests my soul for advertising. At this point that's how I see it. Like anyone with a smartphone and social media I'm susceptible to a junk food diet of endlessly scrolling Instagram Reels or viewing pigs sling mud at one another on whatever Facebook has deemed popular enough to show me against my will. 

I do dream of a healthy social media diet (and more self-control). Instagram is full of lovely creators that fill me with motivation and, well, Facebook has some interesting things on marketplace. Typical wisdom would suggest removing temptation completely and deleting these apps, but I find them marginally useful for work and for buying furniture. So instead I'd much rather try and reduce my consumption. 

Now this isn't anything new - over the years I've tried putting time limits on my apps, moving their icons around so the reflex to reach for them is stunted, and even using accessibility settings to invert the colours as if social media was some analogue for cigarettes and dulling the box would stop me (it must be if Meta is currently going to trial for it). 

Most recently I've had success with a bit of behavioural modification. I decided that it's not simply enough to disable the app, after all I could easily re-enable it when it called for just "5 minutes" of necessary use, I would need a motivating factor. So using MacroDroid I set up a macro that would launch a picture of a sad ant every time I opened a certain blacklist of apps - in an attempt to show me what would happen if I spent all my free context switching energy on social media - I'd become a sad poor ant. 

{{< figure align=center src="/images/blog/sad.jpeg" alt="A cartoon ant carrying a bindle" width="300" >}}

But as that goes I had to disable it one day and just never re-enabled it. Sisyphus slipped down the feed again. I deduced that I just wasn't scared enough of being a sad ant. I needed something like a good old case of operant conditioning. 

Inspired by cartoons from the late 90s and early 2000s I knew a solution was out there: dog training collars. As a concept I'm totally against them and I believe pain should only be shared with yourself or between two consenting adults. However, they would fit the requirement exactly. I did my research and found that modern devices come in mostly one of two varieties - radio controlled on the 433 MHz spectrum or bluetooth controlled - both via a remote. Since many of the listings don't specify this at all, I had to spend some time on FCC ID trying to match generic product names to devices, trying to get a peek under the hood, hoping I can spot a generic antenna or bluetooth module in the hope of finding an ideal model that way. Failing that, while I could set a trigger using a WiFi button pusher hooked up to the control remote, I knew that would be clunky (a bit boring) and it wouldn't allow for fine grained control. As a quick test I purchased a model from a local supplier - the 433MHz version but turned out to be the Fisher-Price oven equivalent of a training collar and I would've gotten more vibration sticking an old Nokia to my face. 

Coincidentally, at the same time I rediscovered the joys of Alibaba where you can buy anything from a dummy inflatable military aircraft to a horse cremation machine provided you meet the MOQ and can make it through the designated threshold guardian that is the factory liaison. And with a simple search I'd found what I was looking for - a collar named the S900 which had a bluetooth _app_ control (a much rarer third variation of control) and promised a "diary" (which I assume is a helpful paper trail for the SPCA to audit). I purchased a sample and it arrived. It was much better quality than the test 433 MHz style collar I bought before, dare I say good enough that a dog wouldn't choke on it. 

Box contents: one training collar, 4 metal prong contacts (two long and two short), a USB-C charging cable, a little bulb tester to show the shocky bit works and an "invite" card with the secure code of P2026. 

 {{< figure align=center src="/images/blog/collar1.jpg" alt="S900 collar, prongs, charger and bulb tester in the box" width="400" >}}

{{< figure align=center src="/images/blog/collar2.jpg" alt="The collar unit in hand, showing the contact posts" width="400" >}}

The next question was how would I get the actual collar to respond to me opening an application? I'd been playing some CTFs lately so I kneejerked to "hey let's decompile the Android Application" which I recognised would needlessly overcomplicate things. I deferred this decision until I'd played around with the app. 

I opened the Pet Diary app (it has "Pet and Human Joy, Always" as the tagline) - it let me create a guest account with a dummy email and new username (which is a great feature even if it happens to be a symptom of buying sample tech) and then asked me for my invite code which was the P2026. I booted the app, and pressed the button on the collar. It found the collar automatically and it started showing me stuff - battery level, the diary mentioned above, automatic bark monitoring and a manual training mode. Right off the bat I knew that was what I was looking for. Unlike many of the cheaper collars - this one had three types of "reinforcement": sound, vibration and static. Each had an intensity dial with a manual trigger. 

 {{< figure align=center src="/images/blog/app1.png" alt="Pet Diary home screen showing battery and training modes" width="250" >}}

{{< figure align=center src="/images/blog/app2.png" alt="Manual training screen with sound, vibration and static dials" width="250" >}}

Now another benefit to being app based on Android is it took me 10 seconds to enable bluetooth HCI sniffing - the decision of how I would reverse engineer it had been made. The commands being sent and monitored directly on an OS level should mean that I'd be able to see exactly what was firing off. In order to make the data interpretation easier, I devised a test. I set about running each command through its range: 1-8 for sound, the same for vibration, and 1-16 for shock. I fired them off in sequence then `ADB bugreport`, unzip, dig around for the bluetooth logs and then pulled them into Wireshark for interpretation.

Below are the write requests sent by the application: 

*Sound Commands*

```
407	34.979279	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:07:00:18:85:1e:00:06:03:01:00:00:01:00:00:00:05

411	41.236774	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:08:00:18:85:1e:00:06:03:02:00:00:01:00:00:00:06

```

*Vibration Commands*

``` 
443	67.865725	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:0f:00:18:85:1e:00:06:03:00:01:00:01:00:00:00:05

447	71.483347	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:10:00:18:85:1e:00:06:03:00:02:00:01:00:00:00:06
```

*Static Commands*

```
512	93.757535	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:17:00:18:85:1e:00:06:03:00:00:01:01:00:00:00:05

516	96.702175	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:18:00:18:85:1e:00:06:03:00:00:02:01:00:00:00:06

...

554	118.667453	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:21:00:18:85:1e:00:06:03:00:00:0b:01:00:00:00:0f

560	120.874215	Google_b4:9b:d9 (Pixel 7a)	Espressif_34:27:f2 ()	ATT	40	Sent Write Request, Handle: 0x001c (Unknown: Unknown)	55:55:55:39:41:42:43:61:62:63:0a:00:22:00:18:85:1e:00:06:03:00:00:0c:01:00:00:00:08
```

In each packet a handful of things changed. Stripping away the static beginning part of the packet (55:55:55:39:41:42:43:61:62:63:0a:00:) and analysing the rest: 

- Byte 12 started at 7 (we start counting at 0) and increments - this was the app keeping an internal tracker of events that fired, it kept incrementing no matter the command type.  
- Byte 20 in the sound section increases along with the level I assigned, Byte 21 does the same in Vibration and Byte 22 in Static too. 
- My pedantic will to test each and every command in the sequence paid off as I avoided a gotcha - since static stretches 1-16, once it passes 9 the hex becomes 0a, 0b etc. as it would. But the last byte which seemed to increment from 5 up turned out to not do that in certain variations. 

I didn't feel like playing a guessing game so with the assistance of Claude Opus 5 it was established that the last byte was a silly little checksum known as XOR. When creating a packet to send, XOR compares each bit in that packet for a difference and calculates the outcome - the collar does the same on the receiving end this is meant to detect "valid" frames - I guess in a way to prevent a glitched packet from toasting the collar wearer. XOR, however, doesn't care about position so shocking when you meant to vibrate would be perfectly valid in its book. 

So what I'd learned is, each setting has a specific byte that increments and the last byte just needs to be valid according to XOR. 

Passing the cap file to Opus also produced some other insights including the usual connection and discovery frames, battery percentage packets and even a clock packet that was meant to sync the collar's time to your phone's. All of this was unnecessary for my purposes. The most enlightening was that there was no pairing - I initially connected to the device via my Pop!_OS UI and that gave me an arbitrary pairing pin but it kept disconnecting after. The Bluetooth logs revealed that one can simply connect to the device on demand so trying to bond with it when the collar didn't know how to respond caused more headaches than necessary. 

Armed with this info, I knew all we had to do was discover the device, connect to the device and send a valid packet with the correct byte position incremented. 

{{< figure align=center src="/images/blog/bl-test-cropped.gif" alt="Running the script and the bulb tester lighting up" width="400" >}}

It really was as simple as that. I bundled the bluetooth code into a python web server running on my laptop and exposed an endpoint for each command in the format `http://0.0.0.0:42069/shock?level=2`. In MacroDroid I just swapped out the action for launching a photo of a sad ant with a Get Request and filled in the above. I did some testing and initially it kept disconnecting or going to "sleep" - I found just sending "00" bytes in place of each setting was treated as valid and kept the connection alive without firing the collar. 

{{< figure align=center src="/images/blog/insta-launch.gif" alt="Opening Instagram on the phone while the server logs the trigger" width="400" >}}

It was time to test for real. I stuck the collar to my leg because I'd seen enough TV shows to know it's a bad idea to put it around your neck. I then carried on with some other more pertinent tasks - collar on leg and phone within reach.

{{< figure align=center src="/images/blog/leg.jpg" alt="The collar strapped to my calf" width="300" >}}

**Did it work?** A little too well. I'd set it to 2 and just about threw my phone at the wall when it triggered. I did this twice. The pain was akin to a cramp with a much more sudden onset. I'd imagine the full 16 would reset me to default factory settings. 

I was now too scared to use my phone. I was also too scared to keep using the collar. As an initial investigation - it could work - I'd just have to switch it to the annoying high pitched beeping setting instead of the abuse settings. I'll let you know when I find a middle ground instead of the extremes. Bye.

**Future Improvements:**

- Host it on a dedicated server (maybe an ESP32 just like the collar runs off) so my laptop's state doesn't affect the loop. 
- I put a token on the server as a basic "auth" (which I didn't end up using anyway) but I'd feel better with something more robust, even though it's local. With the time my cats spend walking on my keyboard, I can't rule out that one of them is capable of portmapping or domain enumeration.
- A more comfortable collar where it doesn't loosely dangle like an untied shoe. I could 3D print a bracket to seat around the metal pegs and make it sit more flush with my leg.
- Turn this into buttplug.io for masochists.

