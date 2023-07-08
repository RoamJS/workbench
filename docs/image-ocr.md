# Overview

This feature extracts the text from an image and add it as child blocks!

# Usage

Toggle the Image OCR module on inside WorkBench.

![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamjs%2F0tC147XJdf.png?alt=media&token=d123af9a-7b65-42d2-9c70-2368c4539436)

Hover over an image in your database.

On hover, a magnifying glass icon with a `T` will appear near the Roam native block edit icon. Clicking the extension will use an OCR library to extract all the text found in an image. In the meantime, it will insert a `Loading...` text as a child block.

Once the extension finishes, it will replace the `Loading...` text with all the new text it parsed from the image. If the text begins with a bullet or dash on a line, the bullet will be stripped, leaving the rest of the text content.

This extension is currently only supported in online mode.

# Demo

[Video](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamjs%2FVnF0OffD_9.mp4?alt=media&token=09925c50-8d65-4e5a-b539-dd95ab275a18)
