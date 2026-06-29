# LinkedIn post

---

I built a Chrome extension so my cat can watch YouTube without breaking it. 🐾

If you have a cat, you've probably tried this: put on one of those "cat games"
videos — birds hopping around, a mouse darting across the screen — and let them
go feral at the monitor.

The problem: my cat doesn't just watch. She *pounces*. Paws on the screen, paws
on the keyboard, full hunting mode. And every pounce pauses the video, skips it,
opens some random app, mutes it — game over. I'm basically a full-time
video-un-pauser.

So I built **Cat Mode**: one click and the keyboard + trackpad stop affecting
the page. Now she can smack the laptop as much as she wants and the birds keep
flying. When I want control back, I press a shortcut only a human would press.

The fun engineering bits:

→ It doesn't disable the keyboard — it catches every key and click *before the
page sees it* and quietly drops them. The video player never knows a paw landed
on the spacebar. (Browser event capture phases, if you want the rabbit hole.)

→ No backend, no accounts, no tracking. ~200 lines, two settings stored locally.

→ My Mac had no image tools, so I generated the icon and store art with a
hand-written PNG encoder in pure Python. A cat made me learn the PNG file format.

Built for an audience of one very demanding cat. Live + open source 👇
🔗 https://saif-09.github.io/cat-mode/
💻 https://github.com/Saif-09/cat-mode
(Chrome Web Store listing is in review.)

Does your pet have opinions about your software? 👇

#buildinpublic #chromeextension #javascript #sideproject #cats
