---
date: '{{ .Date }}'
draft: true
title: '{{ replace .File.ContentBaseName "-" " " | title }}'
tags: []
# Cover for the bookshelf. Everything here is optional: leave it out and the
# theme picks a colour and draws geometric art from the title.
# paperback:
#   title: "Short cover title"        # HTML allowed, e.g. <span class="hl">red words</span>
#   subtitle: "or, a longer second line"
#   color: "#f2df8a"                    # cover colour
#   type: sans                          # sans | serif | cond | mix
#   art: covers/my-post.svg             # SVG in assets/covers/
---
