#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw

def create_icon(size):
    # Create RGBA canvas
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 128.0
    padding = 6 * scale
    
    # Shield / Squircle background: rounded rectangle with gradient effect
    # Emerald green to cyan gradient styling
    bg_color = (15, 23, 42, 255) # Deep slate navy #0f172a
    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=26 * scale,
        fill=bg_color
    )

    # Accent border
    border_color = (16, 185, 129, 230) # Emerald #10b981
    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=26 * scale,
        outline=border_color,
        width=max(1, int(3 * scale))
    )

    # Draw Shopping Cart Icon in crisp white / mint
    cart_color = (241, 245, 249, 255) # Slate 100
    w = max(1, int(3.5 * scale))

    # Cart handle & basket path
    # points for cart:
    # Handle start: (32, 38) -> (42, 38) -> (50, 72) -> (88, 72) -> (96, 46) -> (42, 46)
    pts = [
        (32 * scale, 38 * scale),
        (42 * scale, 38 * scale),
        (52 * scale, 72 * scale),
        (88 * scale, 72 * scale),
        (96 * scale, 48 * scale),
        (46 * scale, 48 * scale)
    ]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=cart_color, width=w)

    # Cart wheels
    r = 4.5 * scale
    draw.ellipse([54 * scale - r, 82 * scale - r, 54 * scale + r, 82 * scale + r], fill=cart_color)
    draw.ellipse([82 * scale - r, 82 * scale - r, 82 * scale + r, 82 * scale + r], fill=cart_color)

    # AI spark / magic wand with a cancellation slash / shield checkmark
    # Draw a distinct Anti-AI emblem: Red/Amber diagonal cancellation slash across an AI spark
    spark_cx, spark_cy = 72 * scale, 48 * scale
    spark_r = 10 * scale
    spark_color = (245, 158, 11, 240) # Amber AI spark #f59e0b

    # Diamond spark
    diamond = [
        (spark_cx, spark_cy - spark_r),
        (spark_cx + spark_r * 0.7, spark_cy),
        (spark_cx, spark_cy + spark_r),
        (spark_cx - spark_r * 0.7, spark_cy)
    ]
    draw.polygon(diamond, fill=spark_color)

    # Prohibition slash over spark
    slash_color = (239, 68, 68, 255) # Rose/Red #ef4444
    draw.line(
        [(spark_cx - 12 * scale, spark_cy + 12 * scale), (spark_cx + 12 * scale, spark_cy - 12 * scale)],
        fill=slash_color,
        width=max(2, int(3.5 * scale))
    )

    return img

def main():
    os.makedirs("public/icons", exist_ok=True)
    sizes = [16, 32, 48, 128]
    for s in sizes:
        icon = create_icon(s)
        icon.save(f"public/icons/icon-{s}.png", "PNG")
        print(f"Generated public/icons/icon-{s}.png ({s}x{s})")

if __name__ == "__main__":
    main()
